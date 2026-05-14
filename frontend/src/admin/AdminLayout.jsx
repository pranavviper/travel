import React, { useState } from 'react';
import './admin.css';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Map, Compass, Fuel, GitMerge,
  Bot, Flag, Megaphone, Settings, ScrollText, BarChart3,
  LogOut, ChevronLeft, ChevronRight, Shield, Bell, Search, Sun, Moon
} from 'lucide-react';
import { useAdmin } from './AdminContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Map, label: 'Trips', path: '/admin/trips' },
  { icon: Compass, label: 'Places', path: '/admin/places' },
  { icon: Fuel, label: 'Fuel Prices', path: '/admin/fuel-prices' },
  { icon: GitMerge, label: 'Toll Plazas', path: '/admin/tolls' },
  { icon: Bot, label: 'AI Manager', path: '/admin/ai' },
  { icon: Flag, label: 'Reports', path: '/admin/reports' },
  { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: ScrollText, label: 'Audit Logs', path: '/admin/logs' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function AdminLayout({ children }) {
  const { adminUser, logout } = useAdmin();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = () => { logout(); navigate('/admin'); };

  return (
    <div className={`admin-shell ${darkMode ? 'dark' : 'light'}`}>
      {/* SIDEBAR */}
      <aside className={`admin-sidebar-nav ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-brand">
          <Shield size={24} className="brand-icon" />
          {!collapsed && <span className="brand-text">RoadSage <em>Admin</em></span>}
        </div>

        <nav className="admin-nav-list">
          {navItems.filter(item => {
            if (adminUser?.role === 'superadmin') return true;
            if (adminUser?.role === 'admin') {
              return !['Analytics', 'Audit Logs', 'Settings'].includes(item.label);
            }
            if (adminUser?.role === 'moderator') {
              return ['Dashboard', 'Trips', 'Places', 'Reports'].includes(item.label);
            }
            return false;
          }).map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="admin-nav-item collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
        </button>
      </aside>

      {/* MAIN */}
      <div className="admin-main-area">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="topbar-search">
            <Search size={16} />
            <input placeholder="Search..." />
          </div>
          <div className="topbar-actions">
            <button className="topbar-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle Dark/Light">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="topbar-btn" onClick={() => navigate('/')} title="Switch to User App">
              <Compass size={18} />
            </button>
            <button className="topbar-btn"><Bell size={18} /></button>
            <div className="topbar-profile">
              <img
                src={adminUser?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40'}
                alt={adminUser?.name}
              />
              <div>
                <p className="profile-name">{adminUser?.name}</p>
                <p className="profile-role">{adminUser?.role}</p>
              </div>
              <button className="topbar-btn" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="admin-page-content">
          {children}
        </main>

        <footer className="admin-footer">
          Created by RoadSage Admin · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
