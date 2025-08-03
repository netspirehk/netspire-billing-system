import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import './Header.css';

const Header = () => {
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
        <button className="header-btn user-btn">
          <User size={20} />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};

export default Header;