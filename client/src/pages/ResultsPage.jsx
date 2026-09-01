import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TrendingUp, CheckCircle, AlertCircle, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { getEvaluation, createEvaluation } from '../services/sessionService';
import { getSession } from '../services/sessionService';
import './ResultsPage.css';

const METRIC_LABELS = {
  clarity_score:     'Clarity',
  fluency_score:     'Fluency',
  confidence_score:  'Confidence',
  structure_score:   'Structure',
  vocabulary_score:  'Vocabulary',
  relevance_score:   'Relevance',
  filler_word_score: 'Filler Words'
};

function ScoreCircle({ score }) {
  const deg = (score / 100) * 360;
  return (
    <div
      className="score-circle"
      style={{ '--score-deg': `${deg}deg` }}
    >
      <div className="score-number">
        {Math.round(score)}
        <span className="score-max">/100</span>
      </div>
    </div>
  );
}

function MetricCard({ label, score }) {
  return (
    <div className="metric-card reveal">
      <span className="metric-label">{label}</span>
      <span className="metric-score">{Math.round(score)}</span>
      <div className="metric-bar-bg">
        <div
          className="metric-bar-fill"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();

  const [evaluation, setEvaluation] = useState(null);
  const [session,    setSession]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [polling,    setPolling]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    let attempts = 0;
    const MAX = 10;

    const fetchEval = async () => {
      try {
        const [evalData, sessionData] = await Promise.all([
          getEvaluation(id).catch(() => null),
          getSession(id).catch(() => null)
        ]);

        if (sessionData) setSession(sessionData);

        if (evalData) {
          setEvaluation(evalData);
          setLoading(false);
          setPolling(false);
          return;
        }

        // Evaluation not ready yet — poll
        attempts++;
        if (attempts < MAX) {
          setPolling(true);
          setTimeout(fetchEval, 2500);
        } else {
          setError('Evaluation is taking longer than expected. Please check back in a moment.');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to load results. The session may still be processing.');
        setLoading(false);
      }
    };

    fetchEval();
  }, [id]);

  if (loading) {
    return (
      <div className="results-page">
        <div className="results-skeleton">
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary)' }} />
          <p className="results-title" style={{ fontSize: 24 }}>
            {polling ? 'Generating your evaluation...' : 'Loading results...'}
          </p>
          <p className="skeleton-text">
            Your AI coach is analysing the conversation.<br />This usually takes 5-10 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="results-page">
        <div className="results-skeleton">
          <AlertCircle size={40} style={{ color: 'var(--warning)' }} />
          <p className="results-title" style={{ fontSize: 24 }}>Results Pending</p>
          <p className="skeleton-text">{error || 'Your evaluation is being generated.'}</p>
          <div className="results-actions">
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              <RotateCcw size={16} /> Refresh
            </button>
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const metrics = Object.entries(METRIC_LABELS).map(([key, label]) => ({
    label,
    score: evaluation[key] || 0
  }));

  const strengths    = evaluation.strengths    || [];
  const improvements = evaluation.improvements || [];

  const parsedStrengths = typeof strengths === 'string'
    ? JSON.parse(strengths) : strengths;
  const parsedImprovements = typeof improvements === 'string'
    ? JSON.parse(improvements) : improvements;

  return (
    <div className="results-page">

      {/* Header */}
      <div className="results-header">
        <div className="results-mode-badge">
          <TrendingUp size={12} /> Session Complete
        </div>
        <h1 className="results-title">Your Performance Report</h1>
        <p className="results-subtitle">
          AI-generated evaluation based on your full conversation transcript.
        </p>
      </div>

      {/* Overall Score */}
      <div className="overall-score-section">
        <div className="overall-score-card">
          <ScoreCircle score={evaluation.overall_score || 0} />
          <p className="score-label">Overall Score</p>
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="metrics-grid">
        {metrics.map(m => (
          <MetricCard key={m.label} label={m.label} score={m.score} />
        ))}
        {evaluation.filler_word_count !== undefined && (
          <div className="metric-card reveal">
            <span className="metric-label">Filler Words</span>
            <span className="metric-score">{evaluation.filler_word_count}</span>
            <div className="metric-bar-bg">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${Math.min(evaluation.filler_word_count * 5, 100)}%`,
                  background: 'var(--warning)'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Summary */}
      {evaluation.specific_feedback && (
        <div className="results-summary-card reveal">
          <p className="results-summary-text">{evaluation.specific_feedback}</p>
        </div>
      )}

      {/* Strengths + Improvements */}
      <div className="results-feedback-grid">
        <div className="feedback-card reveal">
          <h3 className="feedback-card-title strengths-title">
            <CheckCircle size={16} /> Strengths
          </h3>
          <ul className="feedback-list strengths-list">
            {parsedStrengths.length > 0
              ? parsedStrengths.map((s, i) => <li key={i}>{s}</li>)
              : <li>Keep practicing to build your strengths.</li>
            }
          </ul>
        </div>

        <div className="feedback-card reveal">
          <h3 className="feedback-card-title improvements-title">
            <AlertCircle size={16} /> Areas to Improve
          </h3>
          <ul className="feedback-list improvements-list">
            {parsedImprovements.length > 0
              ? parsedImprovements.map((s, i) => <li key={i}>{s}</li>)
              : <li>Great work — keep going!</li>
            }
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <Link to="/practice" className="btn btn-secondary">
          <RotateCcw size={16} /> Practice Again
        </Link>
        <Link to="/progress" className="btn btn-secondary">
          View Progress
        </Link>
        <Link to="/dashboard" className="btn btn-primary">
          Dashboard <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
}
