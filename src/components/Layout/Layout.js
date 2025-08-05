import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Header user={user} onLogout={onLogout} />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;