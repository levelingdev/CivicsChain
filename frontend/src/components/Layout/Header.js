import React from 'react';
import { WalletConnect } from '../Wallet/WalletConnect'; // Import the Real Component
import './Header.css';

export const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          {/* Animated Logo Icon */}
          <div className="logo-icon-container">
            <span className="logo-icon">🗳️</span>
          </div>
          <div className="logo-text-group">
            <span className="logo-title">CivicChain</span>
            <span className="logo-subtitle">Secure Cloud DAO</span>
          </div>
        </div>
        
        <div className="header-actions">
          {/* THIS IS THE FIX: Using the actual component */}
          <WalletConnect />
        </div>
      </div>
    </header>
  );
};