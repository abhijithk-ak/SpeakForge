import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mic, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { createSession } from '../../services/sessionService';
import { getKeys } from '../../services/apiKeyService';
import './SetupPages.css';

const TOPIC_CATEGORIES = [
  { value: 'technology',    label: 'Technology',    icon: '💻' },
  { value: 'philosophy',    label: 'Philosophy',    icon: '🧠' },
  { value: 'current-events',label: 'Current Events',icon: '🌍' },
  { value: 'leadership',    label: 'Leadership',    icon: '🎯' },
  { value: 'custom',        label: 'Custom Topic',  icon: '✏️' },
];

const DURATIONS = [
  { value: 60,  label: '1 Minute' },
  { value: 120, label: '2 Minutes' },
  { value: 180, label: '3 Minutes' },
];

const COACHES = [
  { value: 'professional', label: 'Professional', icon: '💼' },
  { value: 'friendly',     label: 'Friendly',     icon: '😊' },
  { value: 'challenging',  label: 'Challenging',  icon: '🔥' },
  { value: 'mentor',       label: 'Mentor',       icon: '📚' },
];

const PROVIDERS = ['groq', 'gemini', 'openai'];

export default function SpeechSetupPage() {
  const navigate = useNavigate();

  const [topicCategory, setCategory]  = useState('technology');
  const [customTopic,   setCustom]    = useState('');
  const [duration,      setDuration]  = useState(120);
  const [coach,         setCoach]     = useState('professional');
  const [provider,      setProvider]  = useState('groq');
  const [configuredKeys, setConfigured] = useState([]);
  const [loading,       setLoading]   = useState(false);
  const [keysLoading,   setKeysLoading] = useState(true);

  useEffect(() => {
    getKeys()
      .then(keys => {
        setConfigured(keys.map(k => k.provider));
        const first = PROVIDERS.find(p => keys.some(k => k.provider === p));
        if (first) setProvider(first);
      })
      .catch(() => {})
      .finally(() => setKeysLoading(false));
  }, []);

  const hasKey = configuredKeys.includes(provider);
  const topic  = topicCategory === 'custom' ? customTopic.trim() : topicCategory;

  const handleStart = async () => {
    if (!hasKey || loading) return;
    setLoading(true);
    try {
      const session = await createSession({
        mode:              'speech',
        role:              topic || 'general speech',
        coach_personality: coach,
        difficulty:        'intermediate'
      });
      navigate(`/session/${session.id}`, {
        state: { provider, topic, scenario: null }
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
          <Mic size={14} /> Speech Practice
        </div>
        <h1 className="setup-title">Configure Your Speech</h1>
        <p className="setup-subtitle">
          Build confidence delivering structured, impactful 2-minute speeches.
        </p>
      </div>

      <div className="setup-form-card">

        {/* Topic Category */}
        <div className="setup-field-section">
          <label className="setup-field-label">Topic Category</label>
          <div className="options-grid">
            {TOPIC_CATEGORIES.map(t => (
              <button
                key={t.value}
                className={`option-pill ${topicCategory === t.value ? 'selected' : ''}`}
                onClick={() => setCategory(t.value)}
                type="button"
              >
                <span className="option-pill-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Topic Input */}
        {topicCategory === 'custom' && (
          <div className="setup-field-section">
            <label className="setup-field-label">Your Topic</label>
            <input
              type="text"
              className="setup-text-input"
              placeholder="e.g. The future of renewable energy..."
              value={customTopic}
              onChange={e => setCustom(e.target.value)}
              maxLength={150}
              autoFocus
            />
          </div>
        )}

        {/* Duration */}
        <div className="setup-field-section">
          <label className="setup-field-label">Target Duration</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {DURATIONS.map(d => (
              <button
                key={d.value}
                className={`option-pill ${duration === d.value ? 'selected' : ''}`}
                onClick={() => setDuration(d.value)}
                type="button"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coach Personality */}
        <div className="setup-field-section">
          <label className="setup-field-label">Coach Style</label>
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
          disabled={loading || keysLoading || !hasKey || (topicCategory === 'custom' && !customTopic.trim())}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Mic size={18} />}
          {loading ? 'Starting Session...' : 'Start Speech Session'}
        </button>

      </div>
    </div>
  );
}
