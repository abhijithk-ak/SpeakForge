import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AudioLines, Sun, Moon, Menu, X } from 'lucide-react';
import './Navbar.css';

/**
 * Redesigned Navbar Component
 * 
 * Props:
 * - theme: 'light' | 'dark' (inherited from App.jsx)
 * - onToggleTheme: Function (inherited from App.jsx)
 */
function Navbar({ theme, onToggleTheme }) {
  // Local state to manage the mobile menu open/closed state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header glass-panel">
      <div className="container navbar-container">
        
        {/* LEFT: Refined Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <AudioLines className="logo-icon-svg" strokeWidth={2} />
          <span className="logo-text">
            Speak<span className="gradient-text">Forge</span>
          </span>
        </Link>

        {/* CENTER: Controlled Navigation (Desktop only) */}
        <nav className="navbar-nav-center">
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#modes" className="nav-link">Practice</a>
          <a href="#progress" className="nav-link">Progress</a>
        </nav>

        {/* RIGHT: Actions + Theme Toggle (Desktop only) */}
        <div className="navbar-actions-right">
          <Link to="/login" className="btn-login">
            Login
          </Link>
          <Link to="/signup" className="btn btn-primary btn-cta">
            Start Free
          </Link>
          
          {/* Minimalist Theme Toggle Icon Button */}
          <button 
            onClick={onToggleTheme} 
            className="theme-toggle-icon-btn"
            aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === 'light' ? (
              <Moon className="toggle-icon-svg" strokeWidth={1.8} />
            ) : (
              <Sun className="toggle-icon-svg" strokeWidth={1.8} />
            )}
          </button>
        </div>

        {/* MOBILE CONTROLS: Sun/Moon + Menu Toggler */}
        <div className="mobile-navbar-controls">
          {/* Theme Switcher on Mobile (shows directly in bar for accessibility) */}
          <button 
            onClick={onToggleTheme} 
            className="theme-toggle-icon-btn mobile-theme-btn"
            aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === 'light' ? (
              <Moon className="toggle-icon-svg" strokeWidth={1.8} />
            ) : (
              <Sun className="toggle-icon-svg" strokeWidth={1.8} />
            )}
          </button>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={toggleMobileMenu}
            className="mobile-menu-toggle-btn"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="menu-icon-svg" strokeWidth={1.8} />
            ) : (
              <Menu className="menu-icon-svg" strokeWidth={1.8} />
            )}
          </button>
        </div>

      </div>

      {/* MOBILE DROPDOWN OVERLAY */}
      <div className={`mobile-menu-overlay glass-panel ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-links">
          <a href="#how-it-works" className="mobile-nav-link" onClick={closeMobileMenu}>
            How It Works
          </a>
          <a href="#modes" className="mobile-nav-link" onClick={closeMobileMenu}>
            Practice
          </a>
          <a href="#progress" className="mobile-nav-link" onClick={closeMobileMenu}>
            Progress
          </a>
          
          <hr className="mobile-menu-divider" />
          
          <div className="mobile-menu-actions">
            <Link to="/login" className="mobile-btn-login" onClick={closeMobileMenu}>
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary mobile-btn-cta" onClick={closeMobileMenu}>
              Start Free
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
