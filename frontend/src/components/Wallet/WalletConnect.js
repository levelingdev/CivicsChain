import React from 'react';
import { useCivicChain } from '../../hooks/useCivicChain';
import './WalletConnect.css';

export const WalletConnect = () => {
  const { account, connectWallet, isConnected, loading } = useCivicChain();

  return (
    <div className="wallet-wrapper">
      {isConnected && account ? (
        <div className="wallet-badge">
          <div className="status-indicator online"></div>
          <div className="wallet-text">
            <span className="wallet-label">Cloud Identity</span>
            <span className="wallet-addr">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </span>
          </div>
        </div>
      ) : (
        <button 
          className="connect-btn" 
          onClick={connectWallet}
          disabled={loading}
          style={{background: loading ? '#94a3b8' : '#2563eb'}}
        >
          {loading ? 'Syncing...' : '🔑 Activate Identity'}
        </button>
      )}
    </div>
  );
};