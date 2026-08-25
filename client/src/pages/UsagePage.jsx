import React, { useState, useEffect } from 'react';
import { Zap, CreditCard, Clock, History, Loader, AlertCircle } from 'lucide-react';
import { getUsage } from '../services/usageService';
import './UsagePage.css';

function UsagePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setIsLoading(true);
        const data = await getUsage();
        setUsage(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load usage quotas. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsageData();
  }, []);

  if (isLoading) {
    return (
      <div className="usage-container">
        <div className="skeleton skeleton-header" style={{ width: '150px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '220px', marginTop: '16px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usage-container usage-error-state">
        <AlertCircle size={40} className="error-icon" />
        <h2>Failed to load details</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const planType = usage?.plan_type || 'free';
  const limitToday = usage?.daily_limit_minutes || 10;
  const remainingToday = usage?.remaining_today_minutes ?? 10;
  const usedToday = usage?.used_today_seconds ? Math.round(usage.used_today_seconds / 60) : 0;
  const usagePercentage = Math.min(100, Math.round((usedToday / limitToday) * 100));

  return (
    <div className="usage-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Usage & Quotas</h1>
        <p className="dashboard-subtitle">Track your remaining AI coaching minutes and review session stats.</p>
      </header>

      <div className="usage-sections-layout">
        
        {/* Row 1: Plan Details + Current Stats */}
        <div className="usage-summary-grid">
          
          {/* Plan Info */}
          <section className="usage-card card-panel">
            <div className="usage-card-header">
              <Zap size={20} className="usage-icon purple" />
              <h2 className="usage-card-title">Current Plan</h2>
            </div>
            
            <div className="usage-plan-details">
              <span className="plan-type-badge">{planType.toUpperCase()}</span>
              <div className="plan-meta-row">
                <span className="plan-meta-label">Daily Allowance:</span>
                <span className="plan-meta-value">{limitToday} minutes / day</span>
              </div>
              <div className="plan-meta-row">
                <span className="plan-meta-label">Cost:</span>
                <span className="plan-meta-value">$0 (Free Tier)</span>
              </div>
            </div>
          </section>

          {/* Today's Progress */}
          <section className="usage-card card-panel">
            <div className="usage-card-header">
              <Clock size={20} className="usage-icon cyan" />
              <h2 className="usage-card-title">Today's Usage</h2>
            </div>

            <div className="usage-progress-details">
              <div className="usage-text-row">
                <span>{usedToday} minutes used today</span>
                <span>{remainingToday} minutes remaining</span>
              </div>

              <div className="usage-progress-track">
                <div 
                  className="usage-progress-bar" 
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>

              <p className="usage-renewal-notice">
                Your daily allowance resets every day at midnight (UTC).
              </p>
            </div>
          </section>

        </div>

        {/* Row 2: Purchase more (Placeholder) */}
        <section className="usage-card card-panel purchase-time-card">
          <div className="usage-card-header">
            <CreditCard size={20} className="usage-icon" />
            <h2 className="usage-card-title">Need more practice time?</h2>
          </div>
          <p className="purchase-desc">
            Upgrade to a premium plan or purchase additional coaching minutes. Custom packages will be available to let you conduct unlimited sessions.
          </p>
          <div className="purchase-placeholder-badge">
            Purchasing AI minutes is coming soon
          </div>
        </section>

        {/* Row 3: History (Future Placeholder) */}
        <section className="usage-card card-panel history-placeholder-card">
          <div className="usage-card-header">
            <History size={20} className="usage-icon muted" />
            <h2 className="usage-card-title">Usage History</h2>
          </div>
          <p className="purchase-desc" style={{ color: 'var(--text-secondary)' }}>
            Detailed breakdown of audio usage, session lengths, and token consumption logs.
          </p>
          <div className="history-placeholder-badge">
            Detailed usage history coming soon
          </div>
        </section>

      </div>
    </div>
  );
}

export default UsagePage;
