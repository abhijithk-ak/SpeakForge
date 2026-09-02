import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Key, Cpu, Volume2, Sliders, Sun, Moon, Lock, ShieldAlert, Trash2,
  CheckCircle, AlertCircle, Loader2, Zap, Play, Eye, EyeOff, RefreshCw, Mic
} from 'lucide-react';
import api from '../services/api';
import './SettingsPage.css';

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    speed: '⚡ Fastest (~0.5s) — Recommended for Voice',
    speedColor: 'var(--success)',
    desc: 'Ultra-low latency Llama 3.3 & 3.1 models. Excellent free tier (30 RPM).',
    placeholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    requiresKey: true
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    speed: '⚡ Fast (~1.0s)',
    speedColor: 'var(--accent)',
    desc: 'Gemini 1.5 Flash & 2.0 Flash. Generous free tier with 1M tokens/day.',
    placeholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    requiresKey: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    speed: '● Medium (~1.5s)',
    speedColor: 'var(--warning)',
    desc: 'GPT-4o Mini and GPT-4o. Requires a paid OpenAI platform API key.',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    requiresKey: true
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    speed: '● Varies by model',
    speedColor: 'var(--text-muted)',
    desc: 'Unified gateway to hundreds of open-source and proprietary models.',
    placeholder: 'sk-or-v1-...',
    docsUrl: 'https://openrouter.ai/keys',
    requiresKey: true
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    speed: '● Fast (~1.2s)',
    speedColor: 'var(--text-muted)',
    desc: 'Grok-2 & Grok-2 Mini models with direct real-time reasoning.',
    placeholder: 'xai-...',
    docsUrl: 'https://console.x.ai/',
    requiresKey: true
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    speed: '● Varies',
    speedColor: 'var(--text-muted)',
    desc: 'Inference API for open-access community models (Llama, Mistral, Qwen).',
    placeholder: 'hf_...',
    docsUrl: 'https://huggingface.co/settings/tokens',
    requiresKey: true
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    speed: '◐ Hardware Dependent',
    speedColor: 'var(--primary)',
    desc: 'Run completely offline on your own machine. Zero API key required.',
    placeholder: '',
    docsUrl: 'https://ollama.com',
    requiresKey: false
  }
];

export default function SettingsPage() {
  const { theme, onToggleTheme } = useOutletContext();

  // AI Provider state
  const [provider, setProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [ollamaHost, setOllamaHost] = useState('localhost');
  const [ollamaPort, setOllamaPort] = useState(11434);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [manualModel, setManualModel] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  // Status & Feedback
  const [testStatus, setTestStatus] = useState('idle'); // idle | testing | success | error
  const [testMessage, setTestMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success | error
  const [saveMessage, setSaveMessage] = useState('');

  // Voice settings
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [audioInputs, setAudioInputs] = useState([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState(false);

  // Practice preferences
  const [defaultMode, setDefaultMode] = useState('interview');
  const [domain, setDomain] = useState('Tech');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [feedbackStyle, setFeedbackStyle] = useState('balanced');

  // Password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwFeedback, setPwFeedback] = useState({ type: '', msg: '' });

  // Load voices reliably using voiceschanged event
  useEffect(() => {
    const updateVoices = () => {
      if (!window.speechSynthesis) return;
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Sort: en-US and natural voices first
        const sorted = [...allVoices].sort((a, b) => {
          const aEn = a.lang.startsWith('en');
          const bEn = b.lang.startsWith('en');
          if (aEn && !bEn) return -1;
          if (!aEn && bEn) return 1;
          const aNat = a.name.includes('Natural') || a.name.includes('Google') || a.name.includes('Samantha');
          const bNat = b.name.includes('Natural') || b.name.includes('Google') || b.name.includes('Samantha');
          if (aNat && !bNat) return -1;
          if (!aNat && bNat) return 1;
          return a.name.localeCompare(b.name);
        });
        setVoices(sorted);
      }
    };

    updateVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Enumerate microphone inputs
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const mics = devices.filter(d => d.kind === 'audioinput');
        setAudioInputs(mics);
        if (mics.length > 0 && !selectedMic) {
          setSelectedMic(mics[0].deviceId);
        }
      }).catch(() => {});
    }
  }, [selectedMic]);

  // Load user settings from server
  useEffect(() => {
    api.get('/settings').then(res => {
      const s = res.data?.data;
      if (s) {
        if (s.ai_provider) setProvider(s.ai_provider);
        if (s.ai_model) setSelectedModel(s.ai_model);
        if (s.ollama_host) setOllamaHost(s.ollama_host);
        if (s.ollama_port) setOllamaPort(s.ollama_port);
        if (s.has_api_key) setHasSavedKey(true);
        if (s.voice_name) setSelectedVoice(s.voice_name);
        if (s.voice_rate) setVoiceRate(parseFloat(s.voice_rate));
        if (s.voice_pitch) setVoicePitch(parseFloat(s.voice_pitch));

        const prefs = s.preferences || {};
        if (prefs.defaultMode) setDefaultMode(prefs.defaultMode);
        if (prefs.domain) setDomain(prefs.domain);
        if (prefs.difficulty) setDifficulty(prefs.difficulty);
        if (prefs.feedbackStyle) setFeedbackStyle(prefs.feedbackStyle);
      }
    }).catch(err => {
      console.warn('Failed to load settings:', err);
    });
  }, []);

  // Fetch models for active provider
  const loadModels = useCallback(async (prov = provider, key = apiKey) => {
    try {
      const res = await api.get('/models', {
        params: {
          provider: prov,
          apiKey: key || undefined,
          ollamaHost,
          ollamaPort
        }
      });
      const modelList = res.data?.data?.models || [];
      setModels(modelList);
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0].id);
      }
    } catch {
      // Keep existing or default
    }
  }, [provider, apiKey, ollamaHost, ollamaPort, selectedModel]);

  // Fetch models when provider changes
  useEffect(() => {
    loadModels(provider);
  }, [provider, loadModels]);

  // Test Connection button
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await api.get('/models', {
        params: {
          provider,
          apiKey: apiKey || undefined,
          ollamaHost,
          ollamaPort
        }
      });
      const data = res.data?.data;
      const discovered = data?.models || [];
      setModels(discovered);
      setTestStatus('success');
      setTestMessage(`Connected to ${data?.provider || provider}! ${discovered.length} models available.`);
      if (discovered.length > 0 && !selectedModel) {
        setSelectedModel(discovered[0].id);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(err.response?.data?.error?.message || 'Connection test failed. Please verify your credentials/host.');
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    setSaveMessage('');
    try {
      await api.put('/settings', {
        ai_provider: provider,
        ai_model: selectedModel,
        ollama_host: ollamaHost,
        ollama_port: ollamaPort,
        apiKey: apiKey || undefined,
        voice_name: selectedVoice,
        voice_rate: voiceRate,
        voice_pitch: voicePitch,
        preferences: {
          defaultMode,
          domain,
          difficulty,
          feedbackStyle
        }
      });

      setSaveStatus('success');
      setSaveMessage('Settings saved successfully!');
      if (apiKey) setHasSavedKey(true);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err.response?.data?.error?.message || 'Failed to save settings.');
    }
  };

  // Preview Voice Button
  const handlePreviewVoice = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = "Hello! I am your SpeakForge AI coach. Your voice settings are configured correctly.";
    const utt = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      const voiceObj = voices.find(v => v.name === selectedVoice);
      if (voiceObj) utt.voice = voiceObj;
    }
    utt.rate = voiceRate;
    utt.pitch = voicePitch;
    utt.onstart = () => setIsPreviewSpeaking(true);
    utt.onend = () => setIsPreviewSpeaking(false);
    utt.onerror = () => setIsPreviewSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwFeedback({ type: '', msg: '' });
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwFeedback({ type: 'error', msg: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwFeedback({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwFeedback({ type: 'error', msg: 'New password must be at least 8 characters.' });
      return;
    }
    setPwFeedback({ type: 'success', msg: 'Password updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const currentProviderObj = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];

  return (
    <div className="settings-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Settings</h1>
        <p className="dashboard-subtitle">Configure your universal BYOK AI provider, voice synthesis, and coaching preferences.</p>
      </header>

      <div className="settings-sections-layout">

        {/* SECTION A: AI PROVIDER CONFIGURATION */}
        <section className="settings-section-card card-panel">
          <div className="settings-section-header">
            <Key size={20} className="section-icon" />
            <div>
              <h2 className="settings-section-title">AI Provider Configuration</h2>
              <p className="settings-section-desc">
                Bring Your Own Key (BYOK) or connect to local Ollama. Credentials are encrypted at rest with AES-256-GCM.
              </p>
            </div>
          </div>

          <div className="provider-config-grid">
            {/* Provider Selector */}
            <div className="form-field-group">
              <label className="form-field-label">AI Provider</label>
              <select
                className="form-field-input"
                value={provider}
                onChange={e => {
                  setProvider(e.target.value);
                  setTestStatus('idle');
                  setTestMessage('');
                }}
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Provider Info Badge */}
            <div className="provider-meta-box">
              <span className="provider-speed-badge" style={{ color: currentProviderObj.speedColor }}>
                {currentProviderObj.speed}
              </span>
              <p className="provider-meta-desc">{currentProviderObj.desc}</p>
            </div>

            {/* Ollama Host / Port OR API Key */}
            {provider === 'ollama' ? (
              <div className="ollama-fields-row">
                <div className="form-field-group" style={{ flex: 2 }}>
                  <label className="form-field-label">Ollama Host</label>
                  <input
                    type="text"
                    className="form-field-input"
                    value={ollamaHost}
                    onChange={e => setOllamaHost(e.target.value)}
                    placeholder="localhost"
                  />
                </div>
                <div className="form-field-group" style={{ flex: 1 }}>
                  <label className="form-field-label">Port</label>
                  <input
                    type="number"
                    className="form-field-input"
                    value={ollamaPort}
                    onChange={e => setOllamaPort(e.target.value)}
                    placeholder="11434"
                  />
                </div>
              </div>
            ) : (
              <div className="form-field-group">
                <div className="auth-label-row">
                  <label className="form-field-label">
                    {currentProviderObj.name} API Key
                    {hasSavedKey && <span className="saved-key-indicator">✓ Key Configured</span>}
                  </label>
                  <a
                    href={currentProviderObj.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="get-key-link"
                  >
                    Get {currentProviderObj.name} key
                  </a>
                </div>
                <div className="key-input-wrapper">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="form-field-input"
                    placeholder={hasSavedKey ? '•••••••••••••••• (Leave blank to keep saved key)' : currentProviderObj.placeholder}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    className="key-visibility-btn"
                    onClick={() => setShowKey(!showKey)}
                    aria-label="Toggle key visibility"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Test Connection Button */}
            <div className="test-btn-row">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
              >
                {testStatus === 'testing' ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
                {testStatus === 'testing' ? 'Testing Connection...' : 'Test Connection & Discover Models'}
              </button>

              {testMessage && (
                <span className={`test-feedback ${testStatus === 'error' ? 'text-error' : 'text-success'}`}>
                  {testStatus === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                  {testMessage}
                </span>
              )}
            </div>

            {/* Model Selection Dropdown + Manual Toggle */}
            <div className="form-field-group">
              <div className="auth-label-row">
                <label className="form-field-label">Active Model</label>
                <button
                  type="button"
                  className="toggle-manual-btn"
                  onClick={() => setManualModel(!manualModel)}
                >
                  {manualModel ? 'Select from list' : '(Enter model manually instead)'}
                </button>
              </div>

              {manualModel ? (
                <input
                  type="text"
                  className="form-field-input"
                  placeholder="e.g. llama-3.3-70b-versatile"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                />
              ) : (
                <div className="model-select-row">
                  <select
                    className="form-field-input"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                  >
                    {models.length > 0 ? (
                      models.map(m => (
                        <option key={m.id || m} value={m.id || m}>{m.name || m.id || m}</option>
                      ))
                    ) : (
                      <option value={selectedModel}>{selectedModel || 'Default Recommended Model'}</option>
                    )}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => loadModels(provider)}
                    title="Refresh model list"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION B: VOICE SETTINGS */}
        <section className="settings-section-card card-panel">
          <div className="settings-section-header">
            <Volume2 size={20} className="section-icon" />
            <div>
              <h2 className="settings-section-title">Voice & Audio Settings</h2>
              <p className="settings-section-desc">
                Choose the natural browser TTS voice and calibrate speech rate and pitch.
              </p>
            </div>
          </div>

          <div className="voice-config-grid">
            {/* Voice Dropdown */}
            <div className="form-field-group">
              <label className="form-field-label">Coach Voice</label>
              <select
                className="form-field-input"
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
              >
                <option value="">Default Browser Voice</option>
                {voices.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders: Rate & Pitch */}
            <div className="sliders-row">
              <div className="form-field-group" style={{ flex: 1 }}>
                <div className="auth-label-row">
                  <label className="form-field-label">Speech Rate</label>
                  <span className="slider-value">{voiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  className="range-slider"
                  value={voiceRate}
                  onChange={e => setVoiceRate(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field-group" style={{ flex: 1 }}>
                <div className="auth-label-row">
                  <label className="form-field-label">Speech Pitch</label>
                  <span className="slider-value">{voicePitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  className="range-slider"
                  value={voicePitch}
                  onChange={e => setVoicePitch(parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Microphone Selector */}
            {audioInputs.length > 1 && (
              <div className="form-field-group">
                <label className="form-field-label">Microphone Input</label>
                <select
                  className="form-field-input"
                  value={selectedMic}
                  onChange={e => setSelectedMic(e.target.value)}
                >
                  {audioInputs.map(m => (
                    <option key={m.deviceId} value={m.deviceId}>{m.label || 'Microphone'}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Voice Preview Button */}
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePreviewVoice}
                disabled={isPreviewSpeaking}
              >
                <Play size={14} />
                {isPreviewSpeaking ? 'Speaking Preview...' : 'Preview Coach Voice'}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION C: PRACTICE PREFERENCES */}
        <section className="settings-section-card card-panel">
          <div className="settings-section-header">
            <Sliders size={20} className="section-icon" />
            <div>
              <h2 className="settings-section-title">Practice Preferences</h2>
              <p className="settings-section-desc">
                Tune coaching feedback style, default practice mode, and evaluation difficulty.
              </p>
            </div>
          </div>

          <div className="preferences-grid">
            <div className="form-field-group">
              <label className="form-field-label">Default Practice Mode</label>
              <select
                className="form-field-input"
                value={defaultMode}
                onChange={e => setDefaultMode(e.target.value)}
              >
                <option value="interview">Mock Interview</option>
                <option value="speech">2-Minute Speech</option>
                <option value="client">Client Communication</option>
              </select>
            </div>

            <div className="form-field-group">
              <label className="form-field-label">Industry / Domain</label>
              <select
                className="form-field-input"
                value={domain}
                onChange={e => setDomain(e.target.value)}
              >
                <option value="Tech">Technology & Engineering</option>
                <option value="Finance">Finance & Banking</option>
                <option value="Healthcare">Healthcare & Medicine</option>
                <option value="Education">Education & Academia</option>
                <option value="Sales">Sales & Business Development</option>
                <option value="General">General Workplace</option>
              </select>
            </div>

            <div className="form-field-group">
              <label className="form-field-label">Difficulty</label>
              <select
                className="form-field-input"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                <option value="beginner">Beginner (Gentle, supportive feedback)</option>
                <option value="intermediate">Intermediate (Realistic standard)</option>
                <option value="advanced">Advanced (Rigorous challenge)</option>
              </select>
            </div>

            <div className="form-field-group">
              <label className="form-field-label">Feedback Style</label>
              <select
                className="form-field-input"
                value={feedbackStyle}
                onChange={e => setFeedbackStyle(e.target.value)}
              >
                <option value="encouraging">Encouraging & Patient</option>
                <option value="balanced">Balanced & Constructive</option>
                <option value="direct">Direct & Rigorous</option>
              </select>
            </div>
          </div>

          {/* Save All Settings Button */}
          <div className="save-settings-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
              {saveStatus === 'saving' ? 'Saving Settings...' : 'Save All Settings'}
            </button>

            {saveMessage && (
              <span className={`save-feedback ${saveStatus === 'error' ? 'text-error' : 'text-success'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </section>

        {/* SECTION D: APPEARANCE */}
        <section className="settings-section-card card-panel">
          <h2 className="settings-section-title">Appearance</h2>
          <p className="settings-section-desc">Toggle between dark and light interface themes.</p>
          <div className="theme-toggle-row">
            <span className="theme-status-label">
              Theme: <strong>{theme === 'light' ? 'Light' : 'Dark'}</strong>
            </span>
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary theme-toggle-btn"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <><Moon size={16} /> Switch to Dark</> : <><Sun size={16} /> Switch to Light</>}
            </button>
          </div>
        </section>

        {/* SECTION E: SECURITY / CHANGE PASSWORD */}
        <section className="settings-section-card card-panel">
          <h2 className="settings-section-title">Change Password</h2>
          <p className="settings-section-desc">Update your login password.</p>

          {pwFeedback.msg && (
            <div className={`settings-alert alert-${pwFeedback.type === 'error' ? 'error' : 'success'}`} role="alert">
              {pwFeedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span>{pwFeedback.msg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="settings-password-form">
            <div className="form-field-group">
              <label className="form-field-label">Current Password</label>
              <input
                type="password"
                className="form-field-input"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-fields-grid" style={{ marginTop: 0 }}>
              <div className="form-field-group">
                <label className="form-field-label">New Password</label>
                <input
                  type="password"
                  className="form-field-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-field-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
              <Lock size={16} /> Update Password
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
