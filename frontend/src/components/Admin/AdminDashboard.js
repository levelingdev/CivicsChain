import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingDeletions, setPendingDeletions] = useState([]);

  // Modal State
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeFiles, setNodeFiles] = useState([]);
  const [inspecting, setInspecting] = useState(false);

  // 🛡️ SECURITY CHECK
  useEffect(() => {
    const userStr = sessionStorage.getItem('civic_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.login !== 'admin') {
        alert("⛔ ACCESS DENIED.");
        navigate('/'); 
      }
    } else {
      navigate('/'); 
    }
  }, [navigate]);

  // 📡 FETCH DATA
  const fetchData = async () => {
    try {
      const statsRes = await fetch('http://localhost:5000/api/auth/admin/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
      setLoading(false);

      const projectsRes = await fetch('http://localhost:5000/api/projects');
      const projectsData = await projectsRes.json();
      setPendingDeletions(projectsData.filter(p => p.deletionRequested));
    } catch (err) { console.error("Admin API Error:", err); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---
  const toggleNode = async (nodeId, currentStatus) => {
    const action = currentStatus === "Online" ? "STOP" : "START";
    setStats(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.node_id === nodeId ? {...n, status: 'Processing...'} : n)
    }));
    try {
      await fetch('http://localhost:5000/api/auth/admin/node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, action })
      });
      setTimeout(fetchData, 1000);
    } catch (err) { alert("Failed"); fetchData(); }
  };

  const addNode = async () => {
    setLoading(true);
    await fetch('http://localhost:5000/api/auth/admin/node/add', { method: 'POST' });
    setTimeout(fetchData, 2000); 
  };

  const deleteNode = async (id) => {
    if(!window.confirm(`⚠️ Permanently DELETE Node ${id}? Data may be lost!`)) return;
    await fetch(`http://localhost:5000/api/auth/admin/node/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const inspectNode = async (nodeId) => {
    setInspecting(true);
    const res = await fetch(`http://localhost:5000/api/auth/admin/node/${nodeId}/files`);
    const data = await res.json();
    setNodeFiles(data.chunks || []);
    setSelectedNode(nodeId);
    setInspecting(false);
  };

  const confirmDeleteProject = async (id) => {
    if(!window.confirm("Permanently delete this project?")) return;
    const token = sessionStorage.getItem('civic_token');
    await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    alert("Project Deleted");
    fetchData();
  };

  if (loading || !stats) return <div className="admin-loading">🚀 Initializing...</div>;

  const totalGB = (stats.total_network_storage / (1024*1024*1024)).toFixed(2);
  const usedMB = (stats.used_network_storage / (1024*1024)).toFixed(2);
  const percentUsed = stats.total_network_storage > 0 ? ((stats.used_network_storage / stats.total_network_storage) * 100).toFixed(2) : 0;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>⚡ CivicChain Command Center</h1>
        <div className="header-actions">
           <button className="add-node-btn" onClick={addNode}>+ NEW NODE</button>
        </div>
      </header>

      {/* STATS */}
      <div className="admin-grid">
         <div className="admin-card neon-blue"><h3>Active Nodes</h3><div className="big-number">{stats.nodes.length}</div></div>
         <div className="admin-card neon-purple"><h3>Total Files</h3><div className="big-number">{stats.total_files}</div></div>
         <div className="admin-card neon-green"><h3>Storage</h3><div className="big-number">{percentUsed}%</div><div className="sub-text">{usedMB} MB Used / {totalGB} GB</div></div>
      </div>

      {/* NODES */}
      <h2 className="section-title">📡 Virtual Node Array Control</h2>
      <div className="nodes-container">
        {stats.nodes.map((node) => {
          const isOnline = node.status === 'Online';
          return (
            <div key={node.node_id} className={`node-row ${node.status.toLowerCase()}`}>
              <div className="node-icon">{isOnline ? '🟢' : '🔴'}</div>
              <div className="node-info"><h4>Node {node.node_id}</h4><p>PID: {node.pid || '---'} | Port: {node.port}</p></div>
              <div className="node-stats">
                 <div className="stat-pill"><span>Chunks:</span><strong>{node.chunk_count}</strong></div>
                 <div className="stat-pill"><span>Usage:</span><strong>{(node.used_space/1024/1024).toFixed(2)} MB</strong></div>
              </div>
              <div className="node-actions">
                  <button className="icon-btn inspect" onClick={() => inspectNode(node.node_id)} title="Inspect">👁️</button>
                  <button className={`node-action-btn ${isOnline ? 'stop' : 'start'}`} onClick={() => toggleNode(node.node_id, node.status)}>
                    {isOnline ? 'SHUTDOWN' : 'BOOT'}
                  </button>
                  <button className="icon-btn delete" onClick={() => deleteNode(node.node_id)} title="Delete">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PENDING DELETIONS */}
      <h2 className="section-title" style={{marginTop: '3rem', borderLeftColor: '#ef4444'}}>🗑️ Pending Deletion Requests</h2>
      <div className="admin-grid">
        {pendingDeletions.length === 0 ? <p style={{color:'#64748b'}}>No requests.</p> : (
            pendingDeletions.map(p => (
                <div key={p._id} className="admin-card" style={{borderColor:'#ef4444', background:'rgba(239, 68, 68, 0.05)'}}>
                    <h4 style={{color:'white'}}>{p.title}</h4>
                    <button onClick={() => confirmDeleteProject(p._id)} style={{marginTop:'10px', background:'#ef4444', color:'white', border:'none', padding:'8px 16px', borderRadius:'5px', cursor:'pointer'}}>Confirm Delete</button>
                </div>
            ))
        )}
      </div>

      {/* INSPECT MODAL */}
      {selectedNode && (
        <div className="modal-overlay" onClick={() => setSelectedNode(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🔍 Inspecting Node {selectedNode}</h3>
            <p className="sub-text">Physical Storage Map</p>
            <div className="file-list">
              {nodeFiles.length === 0 ? <p>No data stored here.</p> : (
                nodeFiles.map((f, i) => (
                  <div key={i} className="file-chunk-row">
                    <span className="file-icon">📄</span>
                    <div className="file-details">
                       <strong>{f.filename}</strong>
                       <span>Chunk Index: {f.chunk_index} | ID: {f.chunk_id.substring(0, 8)}...</span>
                    </div>
                    <span className="file-size">2MB</span>
                  </div>
                ))
              )}
            </div>
            <button className="close-modal" onClick={() => setSelectedNode(null)}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
};