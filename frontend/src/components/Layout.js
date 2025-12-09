import React from 'react';
import { Sidebar } from './Layout/Sidebar';
import './Layout.css';

// ✅ STEP 1: Add 'onLogout' to the props here
export const Layout = ({ children, onLogout }) => {
  return (
    <div className="layout">
      {/* ✅ STEP 2: Pass 'onLogout' to the Sidebar */}
      <Sidebar onLogout={onLogout} /> 
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};