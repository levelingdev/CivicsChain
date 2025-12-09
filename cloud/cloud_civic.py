import grpc
from concurrent import futures
import cloud_pb2
import cloud_pb2_grpc
import json
import threading
import socket
import struct
import base64
import hashlib
import time
import os
import subprocess
import psutil 
from dotenv import load_dotenv
from utils import generate_otp, send_otp_email, process_ids_file

load_dotenv()

# === CONFIGURATION ===
DISK_PATH = "civic_cloud_disk.vfat"
TOTAL_DISK_SIZE = 3 * 1024 * 1024 * 1024 # 3GB
NODE_COUNT = 3
PARTITION_SIZE = TOTAL_DISK_SIZE // NODE_COUNT

# ✅ 300MB CHUNKS for storage distribution
CHUNK_SIZE = 300 * 1024 * 1024 

MANAGER_UDP_PORT = 9001
GRPC_PORT = 9002

class CivicCloudManager:
    def __init__(self):
        self.active_nodes = {} 
        self.file_map = {} 
        self.node_processes = {} 
        self.pending_registrations = {}
        self.credentials = {} 
        self.user_emails = {}
        self.otps = {}

        self.create_disk_if_missing()
        process_ids_file()
        self.load_credentials()
        threading.Thread(target=self.listen_for_nodes, daemon=True).start()

    def create_disk_if_missing(self):
        if not os.path.exists(DISK_PATH):
            print(f"💿 Creating Virtual Disk...")
            with open(DISK_PATH, "wb") as f:
                f.seek(TOTAL_DISK_SIZE - 1)
                f.write(b"\0")

    def load_credentials(self):
        try:
            with open('credentials', 'r') as f:
                for line in f:
                    if line.strip():
                        parts = line.strip().split(',')
                        if len(parts) >= 3:
                            self.credentials[parts[0]] = parts[2].encode()
                            self.user_emails[parts[0]] = parts[1]
        except: pass

    # --- NODE MANAGEMENT ---
    def listen_for_nodes(self):
        udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        udp.bind(('0.0.0.0', MANAGER_UDP_PORT))
        print(f"📡 Node Monitor Active on UDP {MANAGER_UDP_PORT}")
        while True:
            try:
                data, addr = udp.recvfrom(1024)
                msg = json.loads(data.decode())
                if msg['type'] == 'join':
                    self.register_node(msg['id'], msg['port'])
            except: pass

    def register_node(self, node_id, tcp_port):
        try:
            nid = int(node_id)
            offset = (nid - 1) * PARTITION_SIZE
            self.active_nodes[node_id] = { 'ip': '127.0.0.1', 'port': tcp_port, 'offset': offset, 'limit': PARTITION_SIZE }
            self.send_assignment(node_id, offset)
        except: pass

    def send_assignment(self, node_id, offset):
        node = self.active_nodes[node_id]
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((node['ip'], node['port']))
            payload = json.dumps({"command": "ASSIGN_PARTITION", "offset": offset, "size": PARTITION_SIZE}).encode()
            s.send(struct.pack('>I', len(payload)))
            s.send(payload)
            s.close()
        except: pass

    # --- ADMIN ---
    def get_admin_stats(self):
        node_stats = []
        total_used_network = 0
        all_node_ids = sorted(list(set(list(self.active_nodes.keys()) + list(self.node_processes.keys()))), key=lambda x: int(x))
        for nid in all_node_ids:
            is_online = nid in self.active_nodes
            chunks_count = 0
            bytes_used = 0
            for fhash, meta in self.file_map.items():
                for c in meta.get('chunks', []):
                    if str(c['node_id']) == str(nid):
                        chunks_count += 1
                        bytes_used += CHUNK_SIZE
            pid = 0
            if nid in self.node_processes:
                proc = self.node_processes[nid]
                if proc.poll() is None: pid = proc.pid
            node_stats.append({
                "node_id": nid, "status": "Online" if is_online else "Offline", "ip": "127.0.0.1",
                "port": self.active_nodes[nid]['port'] if is_online else 0, "total_space": PARTITION_SIZE,
                "used_space": bytes_used, "chunk_count": chunks_count, "pid": pid
            })
            total_used_network += bytes_used
        return node_stats, total_used_network

    def toggle_node(self, node_id, action):
        if action == "STOP":
            if node_id in self.node_processes:
                print(f"🛑 Stopping Node {node_id}...")
                self.node_processes[node_id].terminate()
                if node_id in self.active_nodes: del self.active_nodes[node_id]
                return "Stopped"
        elif action == "START":
            print(f"🚀 Starting Node {node_id}...")
            cmd = f"python storage_virtual_node.py {node_id}"
            self.node_processes[node_id] = subprocess.Popen(cmd, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
            return "Started"
        return "Failed"

    def add_node(self):
        existing = [int(k) for k in self.node_processes.keys()] + [int(k) for k in self.active_nodes.keys()]
        next_id = str(max(existing) + 1 if existing else 1)
        return self.toggle_node(next_id, "START")

    def remove_node(self, node_id):
        self.toggle_node(node_id, "STOP")
        if node_id in self.node_processes: del self.node_processes[node_id]
        return "Deleted"

    def get_node_files(self, node_id):
        details = []
        for fhash, meta in self.file_map.items():
            for chunk in meta['chunks']:
                if str(chunk['node_id']) == str(node_id):
                    details.append({ "filename": meta['filename'], "chunk_id": chunk['chunk_id'], "chunk_index": chunk['index'], "size": CHUNK_SIZE })
        return details

    # --- STORAGE ---
    def distribute_file(self, file_data, filename):
        file_hash = hashlib.sha256(file_data).hexdigest()
        chunks = [file_data[i:i+CHUNK_SIZE] for i in range(0, len(file_data), CHUNK_SIZE)]
        chunk_map = []
        active_ids = list(self.active_nodes.keys())
        if not active_ids: raise Exception("No Nodes Online")

        for index, chunk in enumerate(chunks):
            node_id = active_ids[index % len(active_ids)]
            node = self.active_nodes[node_id]
            chunk_id = f"{file_hash}_{index}"
            if self.send_chunk_to_node(node, chunk_id, chunk):
                chunk_map.append({ "chunk_id": chunk_id, "node_id": node_id, "index": index })
        
        self.file_map[file_hash] = { 'chunks': chunk_map, 'filename': filename }
        return file_hash

    def send_chunk_to_node(self, node, chunk_id, data):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((node['ip'], node['port']))
            payload = json.dumps({"command": "WRITE", "chunk_id": chunk_id, "data": base64.b64encode(data).decode()}).encode()
            s.send(struct.pack('>I', len(payload)))
            s.send(payload)
            s.recv(1024)
            s.close()
            return True
        except: return False

    def retrieve_file(self, ipfs_hash):
        if ipfs_hash not in self.file_map: return None, None
        meta = self.file_map[ipfs_hash]
        chunk_map = sorted(meta['chunks'], key=lambda x: x['index'])
        full_data = b""
        for chunk_meta in chunk_map:
            node = self.active_nodes.get(chunk_meta['node_id'])
            if node:
                data = self.get_chunk_from_node(node, chunk_meta['chunk_id'])
                if data: full_data += data
        return full_data, meta['filename']

    def get_chunk_from_node(self, node, chunk_id):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((node['ip'], node['port']))
            payload = json.dumps({"command": "READ", "chunk_id": chunk_id}).encode()
            s.send(struct.pack('>I', len(payload)))
            s.send(payload)
            raw_len = s.recv(4)
            if not raw_len: return None
            msg_len = struct.unpack('>I', raw_len)[0]
            data = b""
            while len(data) < msg_len:
                packet = s.recv(msg_len - len(data))
                if not packet: break
                data += packet
            s.close()
            return base64.b64decode(json.loads(data.decode())['data'])
        except: return None

    # --- AUTH ---
    def initiate_registration(self, u, e, p): 
        self.pending_registrations[e] = {'username': u, 'password': p, 'otp': generate_otp()}
        send_otp_email(e, self.pending_registrations[e]['otp'])
        return True, "OTP sent"
    def verify_registration_otp(self, e, otp):
        if e in self.pending_registrations and self.pending_registrations[e]['otp'] == otp:
            rec = self.pending_registrations[e]
            with open('ids', 'a') as f: f.write(f"\n{rec['username']},{e},{rec['password']}")
            process_ids_file()
            self.load_credentials()
            del self.pending_registrations[e]
            return True, "Success"
        return False, "Invalid OTP"
    def verify_login(self, u, p):
        import bcrypt
        return u in self.credentials and bcrypt.checkpw(p.encode(), self.credentials[u])
    def start_nodes(self):
        subprocess.call("taskkill /F /IM python.exe /FI \"WINDOWTITLE eq CivicNode*\"", shell=True)
        time.sleep(1)
        for i in range(1, NODE_COUNT + 1):
            cmd = f"python storage_virtual_node.py {i}"
            self.node_processes[str(i)] = subprocess.Popen(cmd, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)

# === SERVICER ===
class CivicCloudServicer(cloud_pb2_grpc.CivicCloudServiceServicer):
    def __init__(self, manager): self.manager = manager
    def GetAdminStats(self, r, c):
        n, u = self.manager.get_admin_stats()
        return cloud_pb2.AdminStatsResponse(total_users=len(self.manager.credentials), total_files=len(self.manager.file_map), total_network_storage=TOTAL_DISK_SIZE, used_network_storage=u, nodes=[cloud_pb2.NodeDetail(**x) for x in n])
    def ToggleNode(self, r, c): return cloud_pb2.Response(result=self.manager.toggle_node(r.node_id, r.action))
    def AddNode(self, r, c): return cloud_pb2.Response(result=self.manager.add_node())
    def RemoveNode(self, r, c): return cloud_pb2.Response(result=self.manager.remove_node(r.node_id))
    def GetNodeFiles(self, r, c):
        f = self.manager.get_node_files(r.node_id)
        return cloud_pb2.NodeFilesResponse(node_id=r.node_id, chunks=[cloud_pb2.FileChunkDetail(**x) for x in f])
    def Login(self, r, c):
        if self.manager.verify_login(r.login, r.password):
            self.manager.otps[r.login] = generate_otp()
            send_otp_email(self.manager.user_emails[r.login], self.manager.otps[r.login])
            return cloud_pb2.Response(result="OTP sent")
        return cloud_pb2.Response(result="Fail")
    def VerifyOTP(self, r, c):
        return cloud_pb2.TokenResponse(token="tok", user_id=r.login) if self.manager.otps.get(r.login) == r.otp else cloud_pb2.TokenResponse()
    def RegisterInit(self, r, c): return cloud_pb2.Response(result=self.manager.initiate_registration(r.username, r.email, r.password)[1])
    def RegisterVerify(self, r, c): return cloud_pb2.Response(result=self.manager.verify_registration_otp(r.email, r.otp)[1])
    
    # ✅ STREAMING HANDLER
    def StoreProjectDocument(self, request_iterator, context):
        try:
            full_data = bytearray()
            metadata = {}
            print("📥 Stream started...")
            for req in request_iterator:
                if not metadata:
                    metadata = {'filename': req.filename, 'proposer': req.proposer_wallet}
                full_data.extend(req.data)
            
            print(f"✅ Stream Finished. Size: {len(full_data)} bytes. Distributing...")
            h = self.manager.distribute_file(bytes(full_data), metadata['filename'])
            return cloud_pb2.StoreProjectDocumentResponse(ipfs_hash=h, result="Success")
        except Exception as e:
            print(f"❌ Stream Error: {e}")
            return cloud_pb2.StoreProjectDocumentResponse(result="Failed")

    def GetProjectDocument(self, r, c):
        d, f = self.manager.retrieve_file(r.ipfs_hash)
        return cloud_pb2.GetProjectDocumentResponse(data=d, filename=f) if d else cloud_pb2.GetProjectDocumentResponse()

if __name__ == '__main__':
    manager = CivicCloudManager()
    manager.start_nodes()
    # ✅ LIMIT SET TO 2GB FOR WINDOWS (Streaming bypasses this for file content)
    MAX = 2147483647 
    server = grpc.server(futures.ThreadPoolExecutor(10), options=[('grpc.max_receive_message_length', MAX), ('grpc.max_send_message_length', MAX)])
    cloud_pb2_grpc.add_CivicCloudServiceServicer_to_server(CivicCloudServicer(manager), server)
    server.add_insecure_port(f'0.0.0.0:{GRPC_PORT}')
    print(f"☁️  CivicChain Cloud LIVE on {GRPC_PORT} (Streaming Mode)")
    server.start()
    server.wait_for_termination()