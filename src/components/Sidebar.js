import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/daily-digest', icon: '📊', label: 'Daily Digest' },
    { path: '/clients', icon: '👥', label: 'Clients' },
    { path: '/tasks', icon: '✓', label: 'Tasks' },
    { path: '/calendar', icon: '📅', label: 'Calendar' },
    { path: '/invoices', icon: '💰', label: 'Invoices' },
    { path: '/payments', icon: '💳', label: 'Payments' },
    { path: '/all-documents', icon: '📁', label: 'All Documents' },
    { path: '/court-calculator', icon: '🧮', label: 'Court Calculator' },
    { path: '/kanban', icon: '📋', label: 'Kanban Board' },
    { path: '/activity-log', icon: '📝', label: 'Activity Log' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span style={{fontSize: '24px'}}>⚖️</span>
          {!collapsed && <span>LawManager</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span style={{fontSize: '20px'}}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;





