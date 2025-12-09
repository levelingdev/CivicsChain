import React, { useContext, useState } from 'react';
import { CivicChainContext } from '../../context/CivicChainContext';
import { apiService } from '../../services/api';
import { CreateProposal } from './CreateProposal'; // Import the Create Form
import './ProposalCard.css';

export const Proposals = () => {
  const { proposals, vote, isConnected, connectWallet, account } = useContext(CivicChainContext);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleVote = async (proposal, support) => {
    if (!isConnected) return connectWallet();
    const voteId = proposal.blockchainId || proposal.id;
    if (!voteId) return alert("Invalid Proposal ID");
    if(!window.confirm(`Vote ${support ? "YES" : "NO"}?`)) return;
    await vote(voteId, support);
  };

  const handleViewFile = (ipfsHash) => {
    if (!ipfsHash) return alert("No file.");
    window.open(apiService.getFileUrl(ipfsHash), '_blank');
  };

  // ✅ REQUEST DELETE
  const requestDelete = async (id) => {
    if(!window.confirm("Request Admin to delete this proposal?")) return;
    try {
      const token = sessionStorage.getItem('civic_token');
      await fetch(`http://localhost:5000/api/projects/${id}/request-delete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert("Deletion Requested. Admin will review.");
      window.location.reload();
    } catch (err) { alert("Error requesting delete"); }
  };

  return (
    <div className="proposals-container">
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 className="page-title">🗳️ Governance</h1>
        
        {/* ✅ RESTORED CREATE BUTTON */}
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{padding:'10px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}
        >
          {showCreateForm ? "Cancel" : "+ New Proposal"}
        </button>
      </div>

      {showCreateForm && <CreateProposal />}

      <div className="proposals-grid">
        {proposals.map((p) => (
          <div key={p._id} className="proposal-card" style={{opacity: p.deletionRequested ? 0.6 : 1}}>
            <div className="card-header">
              <h3>{p.title} {p.deletionRequested && <span style={{color:'red', fontSize:'0.8rem'}}>(Deletion Pending)</span>}</h3>
              <span className={`status-badge ${p.status}`}>{p.status}</span>
            </div>
            <p className="description">{p.description}</p>
            
            <div className="stats-row">
              <div className="stat"><label>Goal</label><span>{p.fundingGoal} CIVIC</span></div>
              <div className="stat"><label>Deadline</label><span>{new Date(p.deadline * 1000).toLocaleDateString()}</span></div>
            </div>

            <div style={{margin: '15px 0'}}>
              <button onClick={() => handleViewFile(p.ipfsHash)} className="view-file-btn">
                👁️ View Evidence
              </button>
            </div>

            <div className="actions">
              <button className="vote-btn yes" onClick={() => handleVote(p, true)}>✅ Vote FOR</button>
              <button className="vote-btn no" onClick={() => handleVote(p, false)}>❌ Vote AGAINST</button>
            </div>

            {/* ✅ SHOW DELETE REQUEST IF USER IS OWNER (Mock check) */}
            <div style={{marginTop:'10px', textAlign:'right'}}>
               <button 
                 onClick={() => requestDelete(p._id)}
                 style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', textDecoration:'underline'}}
               >
                 Request Deletion
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};