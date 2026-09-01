import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Target, Flame, ArrowRight, Loader2, ChevronRight } from 'lucide-react';
import { getSessions } from '../services/sessionService';
import './ProgressPage.css';

const MODE_COLORS = {
  interview: 'var(--primary)',
  speech:    'var(--accent)',
  client:    'var(--warning)'
};

const MODE_LABELS = {
  interview: 'Interview',
  speech:    'Speech',
  client:    'Client'
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="progress-stat-card card-panel">
      <div className="stat-icon" style={{ color }}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

function ScoreBar({ label, score, color }) {
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, background: color || 'var(--gradient-brand)' }}
        />
      </div>
      <span className="score-bar-value">{Math.round(score)}</span>
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getSessions(50, 0)
      .then(data => setSessions(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Aggregate stats
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalMinutes = Math.round(
    completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60
  );
  const averageScore = completedSessions.length
    ? Math.round(
        completedSessions
          .filter(s => s.overall_score)
          .reduce((sum, s) => sum + parseFloat(s.overall_score || 0), 0) /
        (completedSessions.filter(s => s.overall_score).length || 1)
      )
    : 0;

  // Simple streak: count consecutive days with sessions (from today backwards)
  const streak = (() => {
    if (!completedSessions.length) return 0;
    const dates = [...new Set(
      completedSessions.map(s => new Date(s.created_at).toDateString())
    )];
    let count = 0;
    let d = new Date();
    for (let i = 0; i < 30; i++) {
      if (dates.includes(d.toDateString())) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  })();

  if (loading) {
    return (
      <div className="progress-page">
        <div className="progress-loading">
          <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Progress</h1>
        <p className="dashboard-subtitle">Your practice history and performance trends over time.</p>
      </header>

      {/* Stats Row */}
      <div className="progress-stats-grid">
        <StatCard icon={Target}   label="Sessions Done"   value={completedSessions.length}  color="var(--primary)" />
        <StatCard icon={Clock}    label="Minutes Practiced" value={totalMinutes}  sub="total"  color="var(--accent)" />
        <StatCard icon={TrendingUp} label="Avg Score"    value={averageScore > 0 ? `${averageScore}/100` : '—'} color="var(--success)" />
        <StatCard icon={Flame}    label="Day Streak"      value={streak}         sub="days"   color="var(--warning)" />
      </div>

      {/* Session History */}
      <section className="progress-section card-panel">
        <h2 className="progress-section-title">Session History</h2>

        {sessions.length === 0 ? (
          <div className="progress-empty">
            <TrendingUp size={36} style={{ color: 'var(--primary)', opacity: 0.4 }} />
            <p>No sessions yet. Start practicing to see your progress here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/practice')}>
              Start Practicing
            </button>
          </div>
        ) : (
          <div className="session-history-list">
            {sessions.map(s => {
              const date = new Date(s.created_at);
              const score = s.overall_score ? Math.round(parseFloat(s.overall_score)) : null;
              const mins  = s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0;

              return (
                <div
                  key={s.id}
                  className="session-history-row"
                  onClick={() => s.status === 'completed' && navigate(`/results/${s.id}`)}
                  style={{ cursor: s.status === 'completed' ? 'pointer' : 'default' }}
                >
                  <div className="session-hist-left">
                    <div
                      className="session-hist-dot"
                      style={{ background: MODE_COLORS[s.mode] || 'var(--primary)' }}
                    />
                    <div>
                      <span className="session-hist-mode">{MODE_LABELS[s.mode] || s.mode}</span>
                      {s.role && (
                        <span className="session-hist-role"> · {s.role}</span>
                      )}
                      <div className="session-hist-date">
                        {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {mins > 0 && ` · ${mins}m`}
                      </div>
                    </div>
                  </div>
                  <div className="session-hist-right">
                    {score !== null ? (
                      <span
                        className="session-hist-score"
                        style={{
                          color: score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)'
                        }}
                      >
                        {score}
                      </span>
                    ) : (
                      <span className="session-hist-status">{s.status}</span>
                    )}
                    {s.status === 'completed' && <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Score Breakdown (if we have completed sessions with scores) */}
      {completedSessions.filter(s => s.overall_score).length > 0 && (
        <section className="progress-section card-panel">
          <h2 className="progress-section-title">Average Scores by Mode</h2>
          {['interview', 'speech', 'client'].map(mode => {
            const modeSessions = completedSessions.filter(s => s.mode === mode && s.overall_score);
            if (!modeSessions.length) return null;
            const avg = Math.round(
              modeSessions.reduce((sum, s) => sum + parseFloat(s.overall_score), 0) / modeSessions.length
            );
            return (
              <ScoreBar
                key={mode}
                label={`${MODE_LABELS[mode]} (${modeSessions.length} sessions)`}
                score={avg}
                color={MODE_COLORS[mode]}
              />
            );
          })}
        </section>
      )}

    </div>
  );
}
