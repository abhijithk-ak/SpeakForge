import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sun, Moon, Lock, Trash2, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import './SettingsPage.css';

function SettingsPage() {
  // Grab theme toggle handler from AppLayout Outlet Context
  const { theme, onToggleTheme } = useOutletContext();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', msg: '' });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: '', msg: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'All password fields are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }

    // For now: show "Change password coming soon" message
    setPasswordFeedback({ 
      type: 'info', 
      msg: 'Change password functionality is coming soon in Phase 3.' 
    });
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.'
    );
    if (confirmDelete) {
      alert('Account deletion is coming soon in Phase 3.');
    }
  };

  return (
    <div className="settings-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Settings</h1>
        <p className="dashboard-subtitle">Configure application appearances, privacy, and account settings.</p>
      </header>

      <div className="settings-sections-layout">
        
        {/* 1. APPEARANCE SECTION */}
        <section className="settings-section-card card-panel">
          <h2 className="settings-section-title">Appearance</h2>
          <p className="settings-section-desc">Change the interface color theme.</p>
          
          <div className="theme-toggle-row">
            <span className="theme-status-label">
              Current Theme: <strong>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</strong>
            </span>
            <button 
              onClick={onToggleTheme} 
              className="btn btn-secondary theme-toggle-btn"
              aria-label="Toggle visual theme"
            >
              {theme === 'light' ? (
                <><Moon size={16} /> Switch to Dark</>
              ) : (
                <><Sun size={16} /> Switch to Light</>
              )}
            </button>
          </div>
        </section>

        {/* 2. ACCOUNT SECURITY SECTION */}
        <section className="settings-section-card card-panel">
          <h2 className="settings-section-title">Change Password</h2>
          <p className="settings-section-desc">Update your login security credentials.</p>

          {passwordFeedback.msg && (
            <div className={`settings-alert alert-${passwordFeedback.type === 'error' ? 'error' : 'success'}`} role="alert">
              {passwordFeedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span>{passwordFeedback.msg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="settings-password-form">
            <div className="form-field-group">
              <label htmlFor="currentPass" className="form-field-label">Current Password</label>
              <input
                type="password"
                id="currentPass"
                className="form-field-input"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-fields-grid" style={{ marginTop: '0px' }}>
              <div className="form-field-group">
                <label htmlFor="newPass" className="form-field-label">New Password</label>
                <input
                  type="password"
                  id="newPass"
                  className="form-field-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label htmlFor="confirmPass" className="form-field-label">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPass"
                  className="form-field-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary settings-submit-btn">
              <Lock size={16} /> Update Password
            </button>
          </form>
        </section>

        {/* 3. DANGER ZONE */}
        <section className="settings-section-card card-panel danger-zone-card">
          <div className="danger-zone-header-row">
            <ShieldAlert size={20} className="danger-icon" />
            <h2 className="settings-section-title danger-title">Danger Zone</h2>
          </div>
          <p className="settings-section-desc" style={{ color: 'var(--text-secondary)' }}>
            Permanently delete your account, session records, resume documents, and all evaluation histories. This is irreversible.
          </p>
          
          <button 
            type="button" 
            className="btn btn-danger delete-account-btn"
            onClick={handleDeleteAccount}
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </section>

      </div>
    </div>
  );
}

export default SettingsPage;
