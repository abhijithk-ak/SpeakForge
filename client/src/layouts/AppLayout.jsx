// Authenticated app shell.
// Separate from the marketing Navbar — this is the product UI.
// Desktop: sidebar + main content
// Mobile: top bar + bottom navigation

import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Mic, TrendingUp, User,
  Settings, LogOut, Menu, X, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUsage } from '../services/usageService';
import './AppLayout.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/practice', icon: Mic, label: 'Practice' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const AppLayout = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [remainingMinutes, setRemainingMinutes] = useState(10);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const usageData = await getUsage();
        setRemainingMinutes(usageData.remaining_today_minutes);
      } catch (err) {
        console.error('Failed to fetch sidebar usage:', err);
      }
    };
    fetchUsage();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getBadgeClass = () => {
    if (remainingMinutes < 2) return 'usage-badge usage-danger';
    if (remainingMinutes > 5) return 'usage-badge usage-success';
    return 'usage-badge';
  };

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>

      {/* Sidebar — desktop */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">SpeakForge</span>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/settings" className="sidebar-nav-item">
            <Settings size={18} aria-hidden="true" />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>
          <button
            className="sidebar-nav-item sidebar-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={18} aria-hidden="true" />
            {sidebarOpen && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="app-main">
        <header className="app-topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-right">
            <div className={getBadgeClass()} title="AI minutes remaining today">
              <Zap size={14} aria-hidden="true" />
              <span>{remainingMinutes} min remaining</span>
            </div>
            <span className="topbar-user-email">{user?.email}</span>
          </div>
        </header>

        <main className="app-content">
          <Outlet context={{ theme, onToggleTheme }} />
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <nav className="app-bottom-nav" aria-label="Mobile navigation">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
