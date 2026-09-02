// Clean login page that matches the SpeakForge design language.
// No emojis. Lucide icons only. Uses existing CSS variables.
// Includes complete forgot password and reset password flow.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle, Loader, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AuthPages.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Standard Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      navigate(user.onboarding_completed ? '/dashboard' : '/onboarding');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Step 1 — Request Reset Code
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      const data = res.data?.data;
      if (data?.resetCode) {
        // Auto-fill reset code for smooth local experience
        setResetCode(data.resetCode);
      }
      setSuccessMsg(data?.message || 'Reset code generated. Please enter your new password.');
      setView('reset');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to request reset. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Step 2 — Reset Password with Code
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        resetCode,
        newPassword
      });
      setSuccessMsg(res.data?.data?.message || 'Password reset successfully! You can now sign in.');
      setPassword('');
      setView('login');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Reset failed. Please check your reset code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to continue your practice</p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="auth-success-box" role="alert">
                <CheckCircle size={16} aria-hidden="true" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="password" className="auth-label">Password</label>
                  <button
                    type="button"
                    className="auth-forgot-btn"
                    onClick={() => {
                      setError('');
                      setSuccessMsg('');
                      setView('forgot');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="password"
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading || !email || !password}
              >
                {isLoading
                  ? <><Loader size={16} className="spin" /> Signing in...</>
                  : 'Sign in'
                }
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account? <Link to="/signup">Create one</Link>
            </p>
          </>
        )}

        {/* VIEW: FORGOT PASSWORD (REQUEST CODE) */}
        {view === 'forgot' && (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-subtitle">Enter your email to receive a reset code</p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="reset-email" className="auth-label">Account email</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="reset-email"
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading || !email}
              >
                {isLoading
                  ? <><Loader size={16} className="spin" /> Sending code...</>
                  : 'Send reset code'
                }
              </button>
            </form>

            <p className="auth-switch">
              <button
                type="button"
                className="auth-back-link"
                onClick={() => {
                  setError('');
                  setView('login');
                }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </p>
          </>
        )}

        {/* VIEW: RESET PASSWORD (ENTER CODE & NEW PASSWORD) */}
        {view === 'reset' && (
          <>
            <div className="auth-header">
              <h1 className="auth-title">New password</h1>
              <p className="auth-subtitle">Enter the 6-digit code and your new password</p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="auth-success-box" role="alert">
                <CheckCircle size={16} aria-hidden="true" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="reset-code" className="auth-label">Reset code</label>
                <div className="auth-input-wrap">
                  <KeyRound size={16} className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="reset-code"
                    type="text"
                    className="auth-input"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    placeholder="6-digit reset code"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="new-password" className="auth-label">New password</label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="new-password"
                    type="password"
                    className="auth-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isLoading || !resetCode || newPassword.length < 8}
              >
                {isLoading
                  ? <><Loader size={16} className="spin" /> Updating password...</>
                  : 'Save new password'
                }
              </button>
            </form>

            <p className="auth-switch">
              <button
                type="button"
                className="auth-back-link"
                onClick={() => {
                  setError('');
                  setView('login');
                }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
