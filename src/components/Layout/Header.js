import React from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import './Header.css';

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search customers, invoices..."
            className="search-input"
          />
        </div>
      </div>
      <div className="header-right">
        <button className="header-btn">
          <Bell size={20} />
        </button>
        <div className="user-info">
          <button className="header-btn user-btn">
            <User size={20} />
            <span>{user?.name || 'Admin'}</span>
          </button>
          <button className="header-btn logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;