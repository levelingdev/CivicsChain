import React from 'react';
// We reuse the Dashboard CSS so it looks consistent
import './Dashboard/Dashboard.css'; 

export const Members = () => {
  // Mock data for the private cloud members
  const members = [
    { id: 'admin', role: 'Administrator', status: 'Online' },
    { id: 'alice', role: 'Citizen', status: 'Offline' },
    { id: 'bob', role: 'Citizen', status: 'Active' },
    { id: 'charlie', role: 'Citizen', status: 'Active' },
    { id: 'diana', role: 'Citizen', status: 'Offline' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Citizen Registry</h1>
        <p className="dashboard-subtitle">Verified members of the cloud state</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="stat-card" style={{ display: 'block' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem' }}>User ID</th>
                <th style={{ padding: '1rem' }}>Role</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{m.id}</td>
                  <td style={{ padding: '1rem' }}>{m.role}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem',
                      background: m.status === 'Online' ? '#dcfce7' : '#f1f5f9',
                      color: m.status === 'Online' ? '#166534' : '#64748b'
                    }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};