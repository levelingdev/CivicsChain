import React from 'react';
import { useCivicChain } from '../hooks/useCivicChain';
import '../components/Dashboard'; // Reusing dashboard styles

export const Treasury = () => {
  const { stats } = useCivicChain();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Treasury Management</h1>
        <p className="dashboard-subtitle">Monitor and allocate community funds</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green" style={{gridColumn: "span 2"}}>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats?.treasuryTokens || 0} CIVIC</h3>
            <p className="stat-title">Total Liquid Assets</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <h3 className="stat-value">0.00</h3>
            <p className="stat-title">Pending Grants</p>
          </div>
        </div>
      </div>

      {/* Mock Transaction History */}
      <div style={{background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0'}}>
        <h3 style={{marginBottom: '1.5rem', color: '#1e293b'}}>Recent Transactions</h3>
        <div style={{color: '#64748b', textAlign: 'center', padding: '2rem'}}>
          No transactions recorded on-chain yet.
        </div>
      </div>
    </div>
  );
};