import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signOut();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/daily-digest', icon: '📊', label: 'Daily Digest' },
    { path: '/clients', icon: '👥', label: 'Clients' },
    { path: '/tasks', icon: '✓', label: 'Tasks' },
    { path: '/calendar', icon: '📅', label: 'Calendar' },
    { path: '/invoices', icon: '💰', label: 'Invoices' },
    { path: '/payments', icon: '💳', label: 'Payments' },
    { path: '/analytics', icon: '📊', label: 'Analytics' },
    { path: '/all-documents', icon: '📁', label: 'All Documents' },
    { path: '/document-generation', icon: '📄', label: 'Document Generation' },
    { path: '/court-calculator', icon: '🧮', label: 'Court Calculator' },
    { path: '/kanban', icon: '📋', label: 'Kanban Board' },
    { path: '/fire-litigation', icon: '🔥', label: 'Fire Litigation' },
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
      
      {/* User Info */}
      {!collapsed && currentUser && (
        <div className="sidebar-user">
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <div className="user-email">{currentUser.email}</div>
          </div>
        </div>
      )}
      
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

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button 
          className="logout-btn"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
        >
          <span style={{fontSize: '20px'}}>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
