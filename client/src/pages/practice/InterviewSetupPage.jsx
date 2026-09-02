import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Zap, Loader2, AlertTriangle,
  Target, Code, Layers, Users, Shuffle, HeartHandshake, Flame, BookOpen
} from 'lucide-react';
import { createSession } from '../../services/sessionService';
import api from '../../services/api';
import './SetupPages.css';

const INTERVIEW_TYPES = [
  { value: 'behavioral',   label: 'Behavioral',   icon: Target },
  { value: 'technical',    label: 'Technical',     icon: Code },
  { value: 'system-design',label: 'System Design', icon: Layers },
  { value: 'hr',           label: 'HR Round',      icon: Users },
  { value: 'mixed',        label: 'Mixed',         icon: Shuffle },
];

const DIFFICULTIES = [
  { value: 'beginner',     label: 'Beginner',      desc: 'Foundational' },
  { value: 'intermediate', label: 'Intermediate',   desc: 'Industry standard' },
  { value: 'advanced',     label: 'Advanced',       desc: 'High challenge' },
];

const COACHES = [
  { value: 'professional', label: 'Professional',  icon: Briefcase },
  { value: 'friendly',     label: 'Supportive',    icon: HeartHandshake },
  { value: 'challenging',  label: 'Challenging',   icon: Flame },
  { value: 'mentor',       label: 'Mentor',        icon: BookOpen },
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();

  const [role,           setRole]      = useState('');
  const [interviewType,  setType]      = useState('behavioral');
  const [difficulty,     setDiff]      = useState('intermediate');
  const [coach,          setCoach]     = useState('professional');
  const [userSettings,   setUserSettings] = useState(null);
  const [loading,        setLoading]   = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      const s = res.data?.data;
      setUserSettings(s || {});
      if (s?.preferences?.difficulty) {
        setDiff(s.preferences.difficulty);
      }
    }).catch(() => {});
  }, []);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);

    const provider = userSettings?.ai_provider || 'groq';
    const activeRole = role.trim() || `${interviewType} Interview`;

    try {
      const session = await createSession({
        mode:              'interview',
        role:              activeRole,
        coach_personality: coach,
        difficulty
      });

      navigate(`/session/${session.id}`, {
        state: { provider, topic: activeRole, scenario: null }
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
          Practice realistic, adaptive interview conversations with real-time coaching.
        </p>
      </div>

      <div className="setup-form-card">

        {/* Role */}
        <div className="setup-field-section">
          <label className="setup-field-label">Target Role / Specialization</label>
          <input
            type="text"
            className="setup-text-input"
            placeholder="e.g. Senior Frontend Engineer, Product Manager, Data Analyst..."
            value={role}
            onChange={e => setRole(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Interview Type */}
        <div className="setup-field-section">
          <label className="setup-field-label">Interview Format</label>
          <div className="options-grid">
            {INTERVIEW_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  className={`option-pill ${interviewType === t.value ? 'selected' : ''}`}
                  onClick={() => setType(t.value)}
                  type="button"
                >
                  <Icon size={18} className="option-pill-icon" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div className="setup-field-section">
          <label className="setup-field-label">Difficulty Level</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                className={`option-pill ${difficulty === d.value ? 'selected' : ''}`}
                onClick={() => setDiff(d.value)}
                type="button"
              >
                <span style={{ fontSize: '11px', color: 'inherit', opacity: 0.75 }}>{d.desc}</span>
                <strong>{d.label}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Coach Personality */}
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
          {loading ? <Loader2 size={18} className="spin" /> : <Zap size={18} />}
          {loading ? 'Starting Interview...' : 'Start Mock Interview'}
        </button>

      </div>
    </div>
  );
}
