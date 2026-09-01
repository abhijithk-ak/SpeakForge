import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { createSession } from '../../services/sessionService';
import { getKeys } from '../../services/apiKeyService';
import './SetupPages.css';

const INTERVIEW_TYPES = [
  { value: 'behavioral',   label: 'Behavioral',   icon: '🎯' },
  { value: 'technical',    label: 'Technical',     icon: '💻' },
  { value: 'system-design',label: 'System Design', icon: '🏗️' },
  { value: 'hr',           label: 'HR Round',      icon: '🤝' },
  { value: 'mixed',        label: 'Mixed',         icon: '🔀' },
];

const DIFFICULTIES = [
  { value: 'beginner',     label: 'Beginner',      desc: 'Foundational questions' },
  { value: 'intermediate', label: 'Intermediate',   desc: 'Industry standard' },
  { value: 'hard',         label: 'Hard',           desc: 'FAANG-level' },
];

const COACHES = [
  { value: 'professional', label: 'Professional',  icon: '💼' },
  { value: 'friendly',     label: 'Friendly',      icon: '😊' },
  { value: 'challenging',  label: 'Challenging',   icon: '🔥' },
  { value: 'mentor',       label: 'Mentor',        icon: '📚' },
];

const PROVIDERS = ['groq', 'gemini', 'openai'];

export default function InterviewSetupPage() {
  const navigate = useNavigate();

  const [role,           setRole]      = useState('');
  const [interviewType,  setType]      = useState('behavioral');
  const [difficulty,     setDiff]      = useState('intermediate');
  const [coach,          setCoach]     = useState('professional');
  const [provider,       setProvider]  = useState('groq');
  const [configuredKeys, setConfigured] = useState([]);
  const [loading,        setLoading]   = useState(false);
  const [keysLoading,    setKeysLoading] = useState(true);

  useEffect(() => {
    getKeys()
      .then(keys => {
        setConfigured(keys.map(k => k.provider));
        // Auto-select first available provider
        const first = PROVIDERS.find(p => keys.some(k => k.provider === p));
        if (first) setProvider(first);
      })
      .catch(() => {})
      .finally(() => setKeysLoading(false));
  }, []);

  const hasKey = configuredKeys.includes(provider);

  const handleStart = async () => {
    if (!hasKey || loading) return;
    setLoading(true);
    try {
      const session = await createSession({
        mode:              'interview',
        role:              role.trim() || interviewType,
        coach_personality: coach,
        difficulty
      });
      navigate(`/session/${session.id}`, {
        state: { provider, topic: null, scenario: null }
      });
    } catch (err) {
      console.error('Failed to create session:', err);
      setLoading(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-header">
        <button className="setup-back-btn" onClick={() => navigate('/practice')}>
          <ArrowLeft size={16} /> Back to Practice
        </button>
        <div className="setup-mode-badge">
          <Briefcase size={14} /> Mock Interview
        </div>
        <h1 className="setup-title">Configure Your Interview</h1>
        <p className="setup-subtitle">
          Customise every aspect of your session — role, format, difficulty, and coach style.
        </p>
      </div>

      <div className="setup-form-card">

        {/* Role */}
        <div className="setup-field-section">
          <label className="setup-field-label">Target Role (optional)</label>
          <input
            type="text"
            className="setup-text-input"
            placeholder="e.g. Frontend Engineer, Product Manager, Data Scientist..."
            value={role}
            onChange={e => setRole(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Interview Type */}
        <div className="setup-field-section">
          <label className="setup-field-label">Interview Type</label>
          <div className="options-grid">
            {INTERVIEW_TYPES.map(t => (
              <button
                key={t.value}
                className={`option-pill ${interviewType === t.value ? 'selected' : ''}`}
                onClick={() => setType(t.value)}
                type="button"
              >
                <span className="option-pill-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="setup-field-section">
          <label className="setup-field-label">Difficulty</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                className={`option-pill ${difficulty === d.value ? 'selected' : ''}`}
                onClick={() => setDiff(d.value)}
                type="button"
              >
                <span style={{ fontSize: '12px', color: 'inherit', opacity: 0.8 }}>{d.desc}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coach Personality */}
        <div className="setup-field-section">
          <label className="setup-field-label">Coach Personality</label>
          <div className="options-grid">
            {COACHES.map(c => (
              <button
                key={c.value}
                className={`option-pill ${coach === c.value ? 'selected' : ''}`}
                onClick={() => setCoach(c.value)}
                type="button"
              >
                <span className="option-pill-icon">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider */}
        <div className="setup-field-section">
          <label className="setup-field-label"><Zap size={14} /> AI Provider</label>
          <div className="provider-selector">
            {PROVIDERS.map(p => (
              <button
                key={p}
                className={`provider-select-pill ${provider === p ? 'selected' : ''}`}
                onClick={() => setProvider(p)}
                type="button"
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
                {!keysLoading && !configuredKeys.includes(p) && (
                  <span style={{ marginLeft: 4, opacity: 0.6 }}>✗</span>
                )}
              </button>
            ))}
          </div>
          {!keysLoading && !hasKey && (
            <div className="no-key-warning">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                No {provider} API key configured.{' '}
                <Link to="/settings">Add your key in Settings</Link> to start practicing.
              </span>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          className="btn setup-start-btn"
          onClick={handleStart}
          disabled={loading || keysLoading || !hasKey}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Zap size={18} />}
          {loading ? 'Starting Session...' : 'Start Interview Session'}
        </button>

      </div>
    </div>
  );
}
