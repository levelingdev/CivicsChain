import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CivicChainProvider } from './context/CivicChainContext'; 
import { Layout } from './components/Layout';
import { Login } from './components/Login';

// Pages
import { Dashboard } from './components/Dashboard';
import { Proposals } from './components/Governance/Proposals';
import { Treasury } from './components/Treasury';
import { Members } from './components/Members';
import { AdminDashboard } from './components/Admin/AdminDashboard'; // ✅ New Admin Page

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check Session Storage (Temporary) instead of Local Storage (Permanent)
    // This ensures the user is logged out when they close the browser tab.
    const token = sessionStorage.getItem('civic_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    // 🛡️ Context Provider allows Wallet & Blockchain data to be shared everywhere
    <CivicChainProvider>
      <Router>
        <div className="App">
          {!isAuthenticated ? (
            // Show Login Screen if not authenticated
            <Login onLoginSuccess={() => setIsAuthenticated(true)} />
          ) : (
            // Show Main App Layout if logged in
            <Layout onLogout={() => {
              // Clear session and state to log out
              sessionStorage.clear();
              setIsAuthenticated(false);
            }}>
              <Routes>
                {/* General Pages */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/proposals" element={<Proposals />} />
                <Route path="/governance" element={<Navigate to="/proposals" />} />
                <Route path="/treasury" element={<Treasury />} />
                <Route path="/members" element={<Members />} />
                
                {/* ⚡ Admin Command Center */}
                <Route path="/admin" element={<AdminDashboard />} />
                
                {/* Fallback for unknown URLs */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          )}
        </div>
      </Router>
    </CivicChainProvider>
  );
}

export default App;