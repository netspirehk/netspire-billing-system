import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  CreditCard, 
  BarChart3 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/reports', icon: BarChart3, label: 'Reports' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Netspire Billing</h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;