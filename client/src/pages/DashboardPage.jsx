import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, Mic, Users, HelpCircle, ArrowUpRight, 
  ArrowDownRight, Loader, ChevronRight, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUsage } from '../services/usageService';
import { getProgress } from '../services/progressService';
import './DashboardPage.css';

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usageData, progressData] = await Promise.all([
          getUsage(),
          getProgress()
        ]);
        setUsage(usageData);
        setProgress(progressData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Greeting helper based on local time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Subtitle customizer based on onboarding goals
  const getGoalSubtitle = () => {
    const goal = user?.primary_goal || 'communication';
    const goalMap = {
      interviews: 'Ready to prepare for your next job interview?',
      communication: 'Let\'s improve your core communication skills today.',
      confidence: 'Let\'s build up your speaking confidence.',
      client: 'Ready to practice some client scenarios?',
      speaking: 'Ready to polish your public speaking?'
    };
    return goalMap[goal] || 'Ready to level up your speaking skills?';
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        {/* Header Skeleton */}
        <div className="skeleton skeleton-header"></div>
        
        {/* Usage Bar Skeleton */}
        <div className="skeleton skeleton-usage-bar"></div>

        {/* Grid Skeletons */}
        <div className="dashboard-skeleton-grid">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container dashboard-error-state">
        <AlertCircle size={40} className="error-icon" />
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const isNewUser = !progress || progress.sessions_completed === 0;
  const remainingToday = usage?.remaining_today_minutes ?? 10;
  const limitToday = usage?.daily_limit_minutes ?? 10;
  const usedToday = usage?.used_today_seconds ? Math.round(usage.used_today_seconds / 60) : 0;
  const usagePercentage = Math.min(100, Math.round((usedToday / limitToday) * 100));

  return (
    <div className="dashboard-container">
      
      {/* 1. GREETING SECTION */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          {getGreeting()}, {user?.full_name || 'there'}
        </h1>
        <p className="dashboard-subtitle">{getGoalSubtitle()}</p>
      </header>

      {/* 2. USAGE BAR */}
      <section className="dashboard-usage-section card-panel">
        <div className="usage-info-row">
          <span className="usage-label-left">
            <strong>{remainingToday} minutes</strong> remaining today
          </span>
          <span className="usage-label-right">
            {usedToday} / {limitToday} min used
          </span>
        </div>
        <div className="usage-progress-track">
          <div 
            className="usage-progress-bar" 
            style={{ width: `${usagePercentage}%` }}
          ></div>
        </div>
      </section>

      {/* 3. NEW USER VS RETURNING USER STATE */}
      {isNewUser ? (
        <section className="baseline-cta-card card-panel">
          <div className="baseline-content">
            <h2 className="baseline-title">Start your baseline assessment</h2>
            <p className="baseline-desc">
              Complete your first session to establish your communication baseline. The AI Coach will evaluate your pace, clarity, and filler word usage.
            </p>
            <button 
              className="btn btn-primary baseline-btn" 
              onClick={() => navigate('/practice')}
            >
              Start practicing
            </button>
          </div>
        </section>
      ) : (
        /* 4. RETURNING USER METRIC CARDS */
        <section className="dashboard-metrics-section">
          <h2 className="section-heading-label">Performance Averages</h2>
          <div className="metrics-row-grid">
            {/* Metric cards list */}
            {[
              { label: 'Clarity', val: 78, trend: 'up' },
              { label: 'Fluency', val: 72, trend: 'up' },
              { label: 'Confidence', val: 68, trend: 'down' },
              { label: 'Structure', val: 80, trend: 'up' },
              { label: 'Filler Words', val: 85, trend: 'up', inverse: true }
            ].map((m, idx) => (
              <div key={idx} className="metric-score-card card-panel">
                <span className="metric-card-label">{m.label}</span>
                <div className="metric-score-number-row">
                  <span className="metric-score-value">{m.val}%</span>
                  {m.trend === 'up' ? (
                    <ArrowUpRight size={16} className={`metric-trend-icon ${m.inverse ? 'trend-negative' : 'trend-positive'}`} />
                  ) : (
                    <ArrowDownRight size={16} className={`metric-trend-icon ${m.inverse ? 'trend-positive' : 'trend-negative'}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. PRACTICE MODE CARDS */}
      <section className="dashboard-modes-section">
        <h2 className="section-heading-label">Practice Modes</h2>
        <div className="modes-row-grid">
          
          {/* Mock Interview */}
          <div className="mode-selection-card card-panel">
            <div className="mode-card-header">
              <div className="mode-icon-wrapper purple-glow">
                <Briefcase size={18} className="mode-icon-svg" />
              </div>
              <h3 className="mode-card-title">Mock Interview</h3>
            </div>
            <p className="mode-card-desc">Practice realistic job interviews tailored to your targeted industry and resume.</p>
            <button className="btn btn-secondary mode-start-btn" onClick={() => navigate('/practice/interview')}>
              Start
            </button>
          </div>

          {/* 2-Minute Speech */}
          <div className="mode-selection-card card-panel">
            <div className="mode-card-header">
              <div className="mode-icon-wrapper cyan-glow">
                <Mic size={18} className="mode-icon-svg" />
              </div>
              <h3 className="mode-card-title">2-Minute Speech</h3>
            </div>
            <p className="mode-card-desc">Build confidence and fluency by speaking on impromptu, spontaneously chosen topics.</p>
            <button className="btn btn-secondary mode-start-btn" onClick={() => navigate('/practice/speech')}>
              Start
            </button>
          </div>

          {/* Client Communication */}
          <div className="mode-selection-card card-panel">
            <div className="mode-card-header">
              <div className="mode-icon-wrapper emerald-glow">
                <Users size={18} className="mode-icon-svg" />
              </div>
              <h3 className="mode-card-title">Client Communication</h3>
            </div>
            <p className="mode-card-desc">Roleplay challenging client interactions, negotiation scenarios, and code deliveries.</p>
            <button className="btn btn-secondary mode-start-btn" onClick={() => navigate('/practice/client')}>
              Start
            </button>
          </div>

          {/* Group Discussion (Muted coming soon) */}
          <div className="mode-selection-card card-panel mode-card-coming-soon">
            <div className="mode-card-header">
              <div className="mode-icon-wrapper gray-glow">
                <Users size={18} className="mode-icon-svg" />
              </div>
              <h3 className="mode-card-title">Group Discussion</h3>
            </div>
            <p className="mode-card-desc">Practice handling group debates, meetings, and project standups.</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>

        </div>
      </section>

      {/* 6. RECENT SESSIONS */}
      {!isNewUser && progress?.recent_evaluations?.length > 0 && (
        <section className="dashboard-sessions-section">
          <h2 className="section-heading-label">Recent Sessions</h2>
          <div className="recent-sessions-list">
            {progress.recent_evaluations.slice(0, 3).map((s) => {
              const dateStr = new Date(s.started_at || s.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });
              
              const getModeIcon = (mode) => {
                if (mode === 'interview') return <Briefcase size={16} />;
                if (mode === 'speech') return <Mic size={16} />;
                return <Users size={16} />;
              };

              return (
                <Link 
                  key={s.id} 
                  to={`/results/${s.session_id}`} 
                  className="recent-session-row card-panel"
                >
                  <div className="session-left-meta">
                    <div className="session-icon-avatar">
                      {getModeIcon(s.mode)}
                    </div>
                    <div className="session-title-group">
                      <span className="session-mode-name">
                        {s.mode === 'interview' ? 'Mock Interview' : s.mode === 'speech' ? '2-Minute Speech' : 'Client Call'}
                      </span>
                      <span className="session-date-label">{dateStr}</span>
                    </div>
                  </div>
                  <div className="session-right-meta">
                    <div className="session-score-badge">
                      Score: <strong>{Math.round(s.overall_score)}</strong>
                    </div>
                    <ChevronRight size={16} className="row-chevron-icon" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

export default DashboardPage;
