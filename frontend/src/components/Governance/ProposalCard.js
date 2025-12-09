import React, { useState } from 'react';
import './ProposalCard.css';

export const ProposalCard = ({ proposal, onVote }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Calculate Progress
  const total = Number(proposal.votesFor) + Number(proposal.votesAgainst);
  const forPercent = total === 0 ? 0 : Math.round((Number(proposal.votesFor) / total) * 100);
  const againstPercent = total === 0 ? 0 : 100 - forPercent;

  return (
    <div className="proposal-card">
      <div className="card-header">
        <span className="card-id">#{proposal.blockchainId}</span>
        <span className={`status-badge ${proposal.status || 'active'}`}>
          {proposal.status || 'Active'}
        </span>
      </div>

      <h3 className="card-title">{proposal.title}</h3>
      <p className="card-desc">{proposal.description.substring(0, 100)}...</p>

      {/* Visual Progress Bar */}
      <div className="vote-progress-container">
        <div className="progress-labels">
          <span className="text-for">👍 {forPercent}% For</span>
          <span className="text-against">👎 {againstPercent}% Against</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill for" style={{width: `${forPercent}%`}}></div>
          <div className="progress-fill against" style={{width: `${againstPercent}%`}}></div>
        </div>
      </div>

      <div className="card-footer">
        <div className="meta-info">
          <span>🎯 Goal: {proposal.fundingGoal} CIVIC</span>
        </div>
        <button className="vote-action-btn" onClick={() => setShowModal(true)}>
          Cast Vote
        </button>
      </div>

      {/* POPUP MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Vote on #{proposal.blockchainId}</h2>
            <p>Choose your stance for this proposal.</p>
            <div className="modal-actions">
              <button className="btn-for" onClick={() => { onVote(proposal.blockchainId, true); setShowModal(false); }}>
                Vote FOR
              </button>
              <button className="btn-against" onClick={() => { onVote(proposal.blockchainId, false); setShowModal(false); }}>
                Vote AGAINST
              </button>
            </div>
            <button className="btn-close" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};