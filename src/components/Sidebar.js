import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Scale
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Scale size={24} />
          {!collapsed && <span>LawManager</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
