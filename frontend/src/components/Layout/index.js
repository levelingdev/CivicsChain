import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './Layout.css';

export const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <div className="layout-content">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};