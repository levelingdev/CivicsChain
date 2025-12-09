import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { useCivicChain } from '../../hooks/useCivicChain';
import { ethers } from 'ethers';
import { CONTRACTS } from '../../utils/contracts';
import './ProposalCard.css';

export const CreateProposal = () => {
  const { signer } = useCivicChain();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0); // ✅ Progress State
  
  const [formData, setFormData] = useState({ title: '', description: '', fundingGoal: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !signer) return alert("Please connect wallet and select a file");
    
    setLoading(true);
    setStatus("🚀 Starting Upload...");
    setProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('fundingGoal', formData.fundingGoal);
      uploadData.append('proposer', await signer.getAddress());

      // 1. Upload to Cloud (with Progress)
      const response = await apiService.createProposal(uploadData, (percent) => {
          setProgress(percent);
          setStatus(`🚀 Uploading to Cloud: ${percent}%`);
      });
      
      const ipfsHash = response.ipfsHash;
      setStatus("🔗 Confirming on Blockchain...");

      // 2. Blockchain
      const govContract = new ethers.Contract(CONTRACTS.GOVERNANCE.address, CONTRACTS.GOVERNANCE.abi, signer);
      const goalInWei = ethers.parseEther(formData.fundingGoal.toString());
      const durationSeconds = 30 * 24 * 60 * 60; 

      const tx = await govContract.createProject(
        formData.title,
        formData.description,
        ipfsHash, 
        goalInWei,
        durationSeconds 
      );

      setStatus("⏳ Waiting for Block Confirmation...");
      await tx.wait();
      
      alert("✅ Proposal Created!");
      window.location.reload();

    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proposal-card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2>🚀 New Proposal</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Title" className="input-field" onChange={(e) => setFormData({...formData, title: e.target.value})} required style={{padding: '10px'}} />
        <textarea placeholder="Description" className="input-field" onChange={(e) => setFormData({...formData, description: e.target.value})} required style={{padding: '10px'}} />
        <input type="number" placeholder="Funding Goal (CIVIC)" className="input-field" onChange={(e) => setFormData({...formData, fundingGoal: e.target.value})} required style={{padding: '10px'}} />
        
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>📄 Upload Document/Video</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
          <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '5px'}}>Max size: 3GB</p>
        </div>

        {/* ✅ PROGRESS BAR */}
        {loading && (
            <div style={{width:'100%', background:'#e2e8f0', borderRadius:'5px', height:'10px', overflow:'hidden'}}>
                <div style={{width: `${progress}%`, background:'#2563eb', height:'100%', transition:'width 0.2s'}}></div>
            </div>
        )}

        {status && <p style={{color: '#2563eb', fontWeight: 'bold', textAlign: 'center'}}>{status}</p>}
        
        <button type="submit" disabled={loading} style={{padding: '12px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border:'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold'}}>
          {loading ? "Processing..." : "Create Proposal"}
        </button>
      </form>
    </div>
  );
};