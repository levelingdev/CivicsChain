import React from 'react';
import { useCivicChain } from '../../hooks/useCivicChain';
import './Dashboard.css';

export const Dashboard = () => {
  const { stats, loading, account } = useCivicChain();

  if (loading || !stats) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <h1>Overview</h1>
        <p>Governance status for {new Date().toLocaleDateString()}</p>
      </div>

      <div className="stats-grid">
        {/* Card 1 */}
        <div className="stat-card purple">
          <div className="stat-icon">🗳️</div>
          <div className="stat-info">
            <h3>{stats.totalProposals}</h3>
            <span>Total Proposals</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.activeVoters}</h3>
            <span>Active Voters</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="stat-card green">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <h3>${stats.treasuryUSD}</h3>
            <span>Treasury (USD)</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="stat-card orange">
          <div className="stat-icon">⚖️</div>
          <div className="stat-info">
            <h3>{stats.quorum}%</h3>
            <span>Quorum Req.</span>
          </div>
        </div>
      </div>
    </div>
  );
};