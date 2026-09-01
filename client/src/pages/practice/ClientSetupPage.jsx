import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { createSession } from '../../services/sessionService';
import { getKeys } from '../../services/apiKeyService';
import './SetupPages.css';

const SCENARIOS = [
  { value: 'deadline',  label: 'Missed Deadline',      icon: '⏰', desc: 'Explaining a project delay to a client' },
  { value: 'feature',   label: 'Scope Creep',          icon: '📋', desc: 'Client requesting out-of-scope features' },
  { value: 'bug',       label: 'Critical Bug',         icon: '🐛', desc: 'Production bug affecting the client' },
  { value: 'outage',    label: 'Service Outage',        icon: '🚨', desc: 'System is down — client on the line' },
];

const CLIENT_PERSONALITIES = [
  { value: 'calm',      label: 'Calm',       icon: '😌', desc: 'Reasonable, professional' },
  { value: 'demanding', label: 'Demanding',  icon: '😤', desc: 'High expectations, impatient' },
  { value: 'frustrated',label: 'Frustrated', icon: '😠', desc: 'Upset, looking for accountability' },
];

const COACHES = [
  { value: 'professional', label: 'Professional', icon: '💼' },
  { value: 'friendly',     label: 'Friendly',     icon: '😊' },
  { value: 'mentor',       label: 'Mentor',       icon: '📚' },
];

const PROVIDERS = ['groq', 'gemini', 'openai'];

export default function ClientSetupPage() {
  const navigate = useNavigate();

  const [scenario,           setScenario]    = useState('deadline');
  const [clientPersonality,  setClientPers]  = useState('demanding');
  const [coach,              setCoach]       = useState('professional');
  const [provider,           setProvider]    = useState('groq');
  const [configuredKeys,     setConfigured]  = useState([]);
  const [loading,            setLoading]     = useState(false);
  const [keysLoading,        setKeysLoading] = useState(true);

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

  const handleStart = async () => {
    if (!hasKey || loading) return;
    setLoading(true);
    try {
      const session = await createSession({
        mode:              'client',
        role:              scenario,
        coach_personality: coach,
        difficulty:        'intermediate'
      });
      navigate(`/session/${session.id}`, {
        state: { provider, topic: null, scenario, client_personality: clientPersonality }
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
          <Users size={14} /> Client Communication
        </div>
        <h1 className="setup-title">Configure Your Scenario</h1>
        <p className="setup-subtitle">
          Practice high-stakes client conversations with an AI that plays both roles.
        </p>
      </div>

      <div className="setup-form-card">

        {/* Scenario */}
        <div className="setup-field-section">
          <label className="setup-field-label">Scenario</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {SCENARIOS.map(s => (
              <button
                key={s.value}
                className={`option-pill ${scenario === s.value ? 'selected' : ''}`}
                onClick={() => setScenario(s.value)}
                type="button"
                style={{ flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '14px 16px' }}
              >
                <span style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{s.label}</span>
                <span style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Client Personality */}
        <div className="setup-field-section">
          <label className="setup-field-label">Client Personality</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {CLIENT_PERSONALITIES.map(c => (
              <button
                key={c.value}
                className={`option-pill ${clientPersonality === c.value ? 'selected' : ''}`}
                onClick={() => setClientPers(c.value)}
                type="button"
              >
                <span className="option-pill-icon">{c.icon}</span>
                <span style={{ fontWeight: 600 }}>{c.label}</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>{c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Coach Style */}
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
          disabled={loading || keysLoading || !hasKey}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Users size={18} />}
          {loading ? 'Starting Session...' : 'Start Client Session'}
        </button>

      </div>
    </div>
  );
}
