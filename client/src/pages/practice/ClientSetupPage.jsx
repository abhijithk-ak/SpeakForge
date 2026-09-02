import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Zap, Loader2, AlertTriangle,
  Clock, FileText, Bug, AlertOctagon, Smile, Gauge, AlertCircle, Briefcase, HeartHandshake, BookOpen
} from 'lucide-react';
import { createSession } from '../../services/sessionService';
import api from '../../services/api';
import './SetupPages.css';

const SCENARIOS = [
  { value: 'deadline',  label: 'Missed Deadline',      icon: Clock, desc: 'Explaining a project delay to an expectant client' },
  { value: 'feature',   label: 'Scope Creep',          icon: FileText, desc: 'Client requesting out-of-scope urgent features' },
  { value: 'bug',       label: 'Critical Bug',         icon: Bug, desc: 'Major production issue impacting the client team' },
  { value: 'outage',    label: 'Service Outage',        icon: AlertOctagon, desc: 'System is down and client is demanding resolution' },
];

const CLIENT_PERSONALITIES = [
  { value: 'calm',      label: 'Calm',       icon: Smile, desc: 'Reasonable, professional' },
  { value: 'demanding', label: 'Demanding',  icon: Gauge, desc: 'High expectations, urgent' },
  { value: 'frustrated',label: 'Frustrated', icon: AlertCircle, desc: 'Upset, demanding immediate accountability' },
];

const COACHES = [
  { value: 'professional', label: 'Professional', icon: Briefcase },
  { value: 'friendly',     label: 'Supportive',   icon: HeartHandshake },
  { value: 'mentor',       label: 'Mentor',       icon: BookOpen },
];

export default function ClientSetupPage() {
  const navigate = useNavigate();

  const [scenario,           setScenario]    = useState('deadline');
  const [clientPersonality,  setClientPers]  = useState('demanding');
  const [coach,              setCoach]       = useState('professional');
  const [userSettings,       setUserSettings] = useState(null);
  const [loading,            setLoading]     = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      setUserSettings(res.data?.data || {});
    }).catch(() => {});
  }, []);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);

    const provider = userSettings?.ai_provider || 'groq';

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
          Practice high-stakes stakeholder and client conversations with adaptive roleplay.
        </p>
      </div>

      <div className="setup-form-card">

        {/* Scenario */}
        <div className="setup-field-section">
          <label className="setup-field-label">Scenario</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {SCENARIOS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.value}
                  className={`option-pill ${scenario === s.value ? 'selected' : ''}`}
                  onClick={() => setScenario(s.value)}
                  type="button"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '14px 16px' }}
                >
                  <Icon size={20} className="option-pill-icon" style={{ marginBottom: '4px' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{s.label}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{s.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Client Personality */}
        <div className="setup-field-section">
          <label className="setup-field-label">Client Persona</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {CLIENT_PERSONALITIES.map(c => {
              const Icon = c.icon;
              return (
                <button
                  key={c.value}
                  className={`option-pill ${clientPersonality === c.value ? 'selected' : ''}`}
                  onClick={() => setClientPers(c.value)}
                  type="button"
                >
                  <Icon size={18} className="option-pill-icon" />
                  <span style={{ fontWeight: 600 }}>{c.label}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{c.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coach Style */}
        <div className="setup-field-section">
          <label className="setup-field-label">Coach Persona</label>
          <div className="options-grid">
            {COACHES.map(c => {
              const Icon = c.icon;
              return (
                <button
                  key={c.value}
                  className={`option-pill ${coach === c.value ? 'selected' : ''}`}
                  onClick={() => setCoach(c.value)}
                  type="button"
                >
                  <Icon size={18} className="option-pill-icon" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          className="btn setup-start-btn"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Users size={18} />}
          {loading ? 'Starting Session...' : 'Start Client Practice'}
        </button>

      </div>
    </div>
  );
}
