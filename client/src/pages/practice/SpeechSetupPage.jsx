import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mic, Zap, Loader2, AlertTriangle, Cpu, Globe,
  FlaskConical, Briefcase, Compass, Landmark, Dices, Sparkles, Check
} from 'lucide-react';
import { createSession } from '../../services/sessionService';
import api from '../../services/api';
import './SetupPages.css';

const CATEGORIES = [
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'society', label: 'Society & Culture', icon: Globe },
  { id: 'science', label: 'Science', icon: FlaskConical },
  { id: 'business', label: 'Business & Career', icon: Briefcase },
  { id: 'philosophy', label: 'Life & Philosophy', icon: Compass },
  { id: 'india', label: 'India & Emerging Markets', icon: Landmark }
];

const DURATIONS = [
  { value: 60, label: '1 Minute' },
  { value: 120, label: '2 Minutes' },
  { value: 180, label: '3 Minutes' }
];

export default function SpeechSetupPage() {
  const navigate = useNavigate();

  const [category, setCategory] = useState('technology');
  const [selectedTopic, setSelectedTopic] = useState('Should AI development be regulated by international treaties?');
  const [customTopic, setCustomTopic] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [duration, setDuration] = useState(120);

  // Slot machine animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelWords, setReelWords] = useState([
    'AI Ethics', 'Quantum Computing', 'Remote Work', 'Cybersecurity', 'Open Source', 'Space Exploration', 'Nuclear Fusion', 'Data Privacy'
  ]);

  // Provider state
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      setUserSettings(res.data?.data || {});
    }).catch(() => {});
  }, []);

  // Spin Random Topic
  const handleRandomTopic = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsCustom(false);

    try {
      const res = await api.get('/topics/random', { params: { category } });
      const data = res.data?.data;
      if (data?.reelWords) {
        setReelWords(data.reelWords);
      }

      // Slot machine animation stops after 1.5s
      setTimeout(() => {
        if (data?.topic) {
          setSelectedTopic(data.topic);
        }
        setIsSpinning(false);
      }, 1500);
    } catch {
      setTimeout(() => {
        setIsSpinning(false);
      }, 1200);
    }
  };

  const activeTopic = isCustom ? customTopic.trim() : selectedTopic;

  const handleStart = async () => {
    if (!activeTopic || loading) return;
    setLoading(true);

    const provider = userSettings?.ai_provider || 'groq';

    try {
      const session = await createSession({
        mode: 'speech',
        role: activeTopic,
        coach_personality: 'professional',
        difficulty: 'intermediate'
      });

      navigate(`/session/${session.id}`, {
        state: {
          provider,
          topic: activeTopic,
          durationSeconds: duration
        }
      });
    } catch (err) {
      console.error('Failed to create speech session:', err);
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
          <Mic size={14} /> 2-Minute Speech
        </div>
        <h1 className="setup-title">Prepare Your Speech</h1>
        <p className="setup-subtitle">
          Practice uninterrupted speech delivery on engaging, structured topics.
        </p>
      </div>

      <div className="setup-form-card">

        {/* Category Filter */}
        <div className="setup-field-section">
          <label className="setup-field-label">Topic Domain</label>
          <div className="domain-chips-grid">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`domain-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setCategory(cat.id);
                    setIsCustom(false);
                  }}
                >
                  <Icon size={16} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot Machine Reel / Topic Box */}
        <div className="setup-field-section">
          <div className="auth-label-row">
            <label className="setup-field-label">Speech Prompt</label>
            <button
              type="button"
              className="toggle-custom-link"
              onClick={() => setIsCustom(!isCustom)}
            >
              {isCustom ? 'Pick from topics' : 'Write my own topic'}
            </button>
          </div>

          {isCustom ? (
            <input
              type="text"
              className="setup-text-input"
              placeholder="Enter your speech topic or question..."
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="topic-display-box">
              <div className="slot-machine-frame">
                {isSpinning ? (
                  <div className="topic-reel-container">
                    <div className="topic-reel reel-1">
                      {reelWords.slice(0, 8).map((w, idx) => (
                        <div key={idx} className="reel-item">{w}</div>
                      ))}
                    </div>
                    <div className="topic-reel reel-2">
                      {reelWords.slice(4, 12).map((w, idx) => (
                        <div key={idx} className="reel-item">{w}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="topic-text-active">"{selectedTopic}"</p>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary random-spin-btn"
                onClick={handleRandomTopic}
                disabled={isSpinning}
              >
                <Dices size={16} className={isSpinning ? 'spin' : ''} />
                {isSpinning ? 'Discovering Topic...' : 'Random Topic'}
              </button>
            </div>
          )}
        </div>

        {/* Duration Selection */}
        <div className="setup-field-section">
          <label className="setup-field-label">Target Duration</label>
          <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {DURATIONS.map(d => (
              <button
                key={d.value}
                type="button"
                className={`option-pill ${duration === d.value ? 'selected' : ''}`}
                onClick={() => setDuration(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          className="btn setup-start-btn"
          onClick={handleStart}
          disabled={loading || !activeTopic}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Mic size={18} />}
          {loading ? 'Starting Speech...' : `Begin ${duration / 60}-Minute Speech`}
        </button>

      </div>
    </div>
  );
}
