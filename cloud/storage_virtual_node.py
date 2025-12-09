import socket
import json
import threading
import struct
import sys
import os
import time
import base64

DISK_FILE = "civic_cloud_disk.vfat"
MANAGER_IP = "127.0.0.1"
MANAGER_UDP_PORT = 9001

class CivicNode:
    def __init__(self, node_id):
        self.id = node_id
        self.ip = "127.0.0.1"
        self.port = 0
        
        # Partition Info
        self.partition_start = 0
        self.partition_size = 0
        self.write_cursor = 0 # Where to write next in my partition
        
        # Local Index (FAT): ChunkID -> Relative Offset
        self.index_file = f"node_{node_id}_index.json"
        self.load_index()

        os.system(f"title CivicNode {self.id}")

    def load_index(self):
        if os.path.exists(self.index_file):
            with open(self.index_file, 'r') as f:
                self.fat = json.load(f)
                # Recover cursor position
                if self.fat:
                    last_chunk = list(self.fat.values())[-1]
                    self.write_cursor = last_chunk['offset'] + last_chunk['size']
        else:
            self.fat = {}

    def save_index(self):
        with open(self.index_file, 'w') as f:
            json.dump(self.fat, f)

    def start_server(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind((self.ip, 0))
        self.port = server.getsockname()[1]
        server.listen(5)
        
        print(f"🟢 Node {self.id} ONLINE | Port: {self.port}")
        
        # Announce existence to Manager
        self.announce()
        
        while True:
            client, addr = server.accept()
            threading.Thread(target=self.handle_request, args=(client,), daemon=True).start()

    def announce(self):
        udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        msg = json.dumps({"type": "join", "id": self.id, "port": self.port})
        udp.sendto(msg.encode(), (MANAGER_IP, MANAGER_UDP_PORT))

    def handle_request(self, client):
        try:
            # Read Length
            raw_len = client.recv(4)
            if not raw_len: return
            msg_len = struct.unpack('>I', raw_len)[0]
            
            # Read Payload
            data = b""
            while len(data) < msg_len:
                packet = client.recv(msg_len - len(data))
                if not packet: break
                data += packet
            
            payload = json.loads(data.decode())
            cmd = payload['command']

            if cmd == 'ASSIGN_PARTITION':
                self.partition_start = payload['offset']
                self.partition_size = payload['size']
                print(f"💾 Partition Assigned: Start={self.partition_start} | Size={self.partition_size/1024/1024}MB")

            elif cmd == 'WRITE':
                chunk_id = payload['chunk_id']
                raw_data = base64.b64decode(payload['data'])
                size = len(raw_data)
                
                # Write to Virtual Disk
                with open(DISK_FILE, 'r+b') as f:
                    # Seek to Absolute Position (Partition Start + Local Cursor)
                    abs_pos = self.partition_start + self.write_cursor
                    f.seek(abs_pos)
                    f.write(raw_data)
                
                # Update Index
                self.fat[chunk_id] = {'offset': self.write_cursor, 'size': size}
                self.write_cursor += size
                self.save_index()
                
                print(f"📝 Wrote {size}b to disk offset {abs_pos}")
                client.send("OK".encode())

            elif cmd == 'READ':
                chunk_id = payload['chunk_id']
                if chunk_id in self.fat:
                    meta = self.fat[chunk_id]
                    
                    with open(DISK_FILE, 'rb') as f:
                        abs_pos = self.partition_start + meta['offset']
                        f.seek(abs_pos)
                        raw_data = f.read(meta['size'])
                    
                    resp = json.dumps({
                        "status": "OK",
                        "data": base64.b64encode(raw_data).decode()
                    })
                    print(f"📖 Read {meta['size']}b from disk offset {abs_pos}")
                else:
                    resp = json.dumps({"status": "ERROR"})
                
                # Send response
                encoded = resp.encode()
                client.send(struct.pack('>I', len(encoded)))
                client.send(encoded)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            client.close()

if __name__ == "__main__":
    node = CivicNode(sys.argv[1])
    node.start_server()