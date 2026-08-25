import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordLongEnough = password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordLongEnough) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
      navigate('/onboarding');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start practicing. It's free.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
            <label htmlFor="password" className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="password"
                type="password"
                className="auth-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                disabled={isLoading}
              />
              {passwordLongEnough && (
                <Check size={14} className="auth-input-check" aria-hidden="true" />
              )}
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password" className="auth-label">Confirm password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="confirm-password"
                type="password"
                className="auth-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
                disabled={isLoading}
              />
              {passwordsMatch && (
                <Check size={14} className="auth-input-check" aria-hidden="true" />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading || !email || !passwordLongEnough || !passwordsMatch}
          >
            {isLoading
              ? <><Loader size={16} className="spin" /> Creating account...</>
              : 'Create account'
            }
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
