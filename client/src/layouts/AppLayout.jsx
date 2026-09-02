import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Mic, TrendingUp, Activity, User,
  Settings, LogOut, Menu, X, Zap, Sun, Moon, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUsage } from '../services/usageService';
import './AppLayout.css';

// Main practice navigation (top section)
const primaryNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/practice', icon: Mic, label: 'Practice Studio' },
  { to: '/progress', icon: TrendingUp, label: 'Progress & Trends' },
  { to: '/usage', icon: Activity, label: 'History & Usage' },
];

// Bottom account & settings navigation (anchored down)
const bottomNavItems = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings & BYOK' },
];

export default function AppLayout({ theme, onToggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(10);

  useEffect(() => {
    getUsage().then(data => {
      if (data?.remaining_today_minutes !== undefined) {
        setRemainingMinutes(data.remaining_today_minutes);
      }
    }).catch(() => {});
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/practice/interview')) return 'Practice / Mock Interview';
    if (path.startsWith('/practice/speech')) return 'Practice / 2-Minute Speech';
    if (path.startsWith('/practice/client')) return 'Practice / Client Communication';
    if (path.startsWith('/practice')) return 'Practice Studio';
    if (path.startsWith('/progress')) return 'Progress & Analytics';
    if (path.startsWith('/usage')) return 'Session History & Usage';
    if (path.startsWith('/profile')) return 'User Profile';
    if (path.startsWith('/settings')) return 'Settings & BYOK';
    if (path.startsWith('/results')) return 'Session Results';
    return 'SpeakForge';
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>

        {/* Sidebar Brand Header */}
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-brand-link">
            <div className="brand-icon-box">
              <Sparkles size={16} />
            </div>
            {sidebarOpen && <span className="sidebar-logo">SpeakForge</span>}
          </NavLink>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Primary Navigation Items */}
        <div className="sidebar-section-label">
          {sidebarOpen && <span>PRACTICE & STUDIO</span>}
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {primaryNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} className="nav-icon" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section (Profile & Settings anchored down) */}
        <div className="sidebar-bottom-section">
          <div className="sidebar-section-label">
            {sidebarOpen && <span>ACCOUNT & PREFERENCES</span>}
          </div>

          <nav className="sidebar-nav" aria-label="Account Navigation">
            {bottomNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={18} className="nav-icon" />
                {sidebarOpen && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User Profile Card & Quick Actions */}
          <div className="sidebar-user-card">
            <div className="user-avatar-pill">
              {userInitial}
            </div>

            {sidebarOpen && (
              <div className="user-info-text">
                <span className="user-email-display" title={user?.email}>
                  {user?.email?.split('@')[0]}
                </span>
                <span className="user-plan-tag">BYOK Plan</span>
              </div>
            )}

            {sidebarOpen && (
              <div className="user-quick-actions">
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={onToggleTheme}
                  title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                >
                  {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
                </button>
                <button
                  type="button"
                  className="icon-action-btn logout-action"
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

      </aside>

      {/* ── MAIN CONTENT SHELL ── */}
      <div className="app-main">

        {/* Sleek Topbar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            <span className="topbar-breadcrumb">{getPageTitle()}</span>
          </div>

          <div className="topbar-right">
            <div className="topbar-quota-pill" title="Remaining AI coaching time today">
              <Zap size={13} className="quota-icon" />
              <span>{remainingMinutes}m remaining</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm topbar-start-btn"
              onClick={() => navigate('/practice')}
            >
              <Mic size={14} /> Practice Now
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="app-content">
          <Outlet context={{ theme, onToggleTheme }} />
        </main>

      </div>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="app-bottom-nav" aria-label="Mobile Bottom Navigation">
        <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/practice" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Mic size={18} />
          <span>Practice</span>
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <TrendingUp size={18} />
          <span>Progress</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <User size={18} />
          <span>Profile</span>
        </NavLink>
      </nav>

    </div>
  );
}
