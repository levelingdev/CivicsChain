import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom'; 
import './Sidebar.css';

export const Sidebar = ({ onLogout }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if the current user is 'admin'
    const userStr = sessionStorage.getItem('civic_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.login === 'admin') {
        setIsAdmin(true);
      }
    }
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-circle">C</div>
        <p>CIVIC CHAIN</p>
      </div>

      <nav className="sidebar-nav">
        {/* === PUBLIC AREA (For Everyone) === */}
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span className="nav-icon">📊</span>
          <span className="nav-text">Dashboard</span>
        </NavLink>
        
        <NavLink to="/proposals" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span className="nav-icon">📜</span>
          <span className="nav-text">Proposals</span>
        </NavLink>

        <NavLink to="/treasury" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span className="nav-icon">💰</span>
          <span className="nav-text">Treasury</span>
        </NavLink>

        {/* === RESTRICTED AREA (Admin Only) === */}
        {isAdmin && (
          <>
            <div className="sidebar-divider">ADMINISTRATION</div>
            
            <NavLink to="/members" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="nav-icon">👥</span>
              <span className="nav-text">Citizens Registry</span>
            </NavLink>
            
            <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-item active admin-link" : "nav-item admin-link"}>
              <span className="nav-icon">⚡</span>
              <span className="nav-text">Command Center</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* === FOOTER === */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          🚪 Sign Out
        </button>

        <div className="system-status">
          <span className="status-dot"></span>
          <span>System Operational</span>
        </div>
      </div>
    </aside>
  );
};