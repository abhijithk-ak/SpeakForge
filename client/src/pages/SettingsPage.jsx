import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Sun, Moon, Lock, Trash2, ShieldAlert, CheckCircle,
  AlertCircle, Key, Zap, Loader2, Check, X, Eye, EyeOff,
  Cpu, RefreshCw
} from 'lucide-react';
import { getKeys, saveKey, deleteKey, testKey, selectModel, fetchModels } from '../services/apiKeyService';
import './SettingsPage.css';

const PROVIDERS = [
  {
    id:          'groq',
    name:        'Groq',
    badge:       'Fastest Free Tier',
    badgeColor:  'var(--success)',
    description: 'Recommended for best price:performance ratio: LLaMA 3.1 & 3.3 inference for real-time practice. Free tier: 30 RPM.',
    placeholder: 'gsk_...',
    docsUrl:     'https://console.groq.com/keys'
  },
  {
    id:          'gemini',
    name:        'Google Gemini',
    badge:       'Generous Free Tier',
    badgeColor:  'var(--accent)',
    description: 'Recommended for voice: Gemini 1.5 Flash & Pro. Free tier: 15 RPM, 1M tokens/day.',
    placeholder: 'AIza...',
    docsUrl:     'https://aistudio.google.com/app/apikey'
  },
  {
    id:          'openai',
    name:        'OpenAI',
    badge:       'Paid',
    badgeColor:  'var(--warning)',
    description: 'Recommended for best context understanding:GPT-4o Mini & GPT-4o. Requires a paid OpenAI API key.',
    placeholder: 'sk-...',
    docsUrl:     'https://platform.openai.com/api-keys'
  }
];

function ProviderCard({ provider, savedKey, onSave, onDelete }) {
  const [inputKey, setInputKey]             = useState('');
  const [showKey, setShowKey]               = useState(false);
  const [status, setStatus]                 = useState('idle'); // idle | saving | testing | connected | error
  const [message, setMessage]               = useState('');
  const [isExpanded, setExpanded]           = useState(false);
  const [models, setModels]                 = useState([]);
  const [modelsLoading, setModelsLoading]   = useState(false);
  const [selectedModel, setSelectedModel]   = useState(savedKey?.selectedModel || savedKey?.defaultModel || '');

  const isSaved = !!savedKey;

  // Keep selectedModel state in sync when savedKey prop updates
  useEffect(() => {
    if (savedKey?.selectedModel) {
      setSelectedModel(savedKey.selectedModel);
    }
  }, [savedKey]);

  // Load available models for configured provider
  const loadModels = useCallback(async () => {
    if (!isSaved) return;
    setModelsLoading(true);
    try {
      const res = await fetchModels(provider.id);
      if (res?.models && res.models.length > 0) {
        setModels(res.models);
        if (res.selectedModel) setSelectedModel(res.selectedModel);
      }
    } catch {
      // Fallback options
      if (provider.id === 'groq') {
        setModels(['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it']);
      } else if (provider.id === 'gemini') {
        setModels(['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite']);
      } else {
        setModels(['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'o3-mini']);
      }
    } finally {
      setModelsLoading(false);
    }
  }, [isSaved, provider.id]);

  useEffect(() => {
    if (isSaved) {
      loadModels();
    }
  }, [isSaved, loadModels]);

  const handleSave = async () => {
    if (!inputKey.trim()) return;
    setStatus('saving');
    setMessage('');
    try {
      await onSave(provider.id, inputKey.trim(), selectedModel);
      setStatus('connected');
      setMessage(`${provider.name} key saved successfully.`);
      setInputKey('');
      setExpanded(false);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error?.message || 'Failed to save key. Please try again.');
    }
  };

  const handleModelChange = async (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    if (!isSaved) return;

    try {
      await selectModel(provider.id, newModel);
      // Run quick test with new model to verify
      setStatus('testing');
      setMessage(`Testing ${newModel}...`);
      await testKey(provider.id, newModel);
      setStatus('connected');
      setMessage(`Selected model set to ${newModel} & verified.`);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error?.message || `Model ${newModel} health check failed.`);
    }
  };

  const handleTest = async () => {
    setStatus('testing');
    setMessage('');
    try {
      const res = await testKey(provider.id, selectedModel);
      setStatus('connected');
      if (res?.availableModels && res.availableModels.length > 0) {
        setModels(res.availableModels);
      }
      setMessage(`${provider.name} (${res.model || selectedModel}) connected and verified!`);
    } catch (err) {
      setStatus('error');
      const errDetail = err.response?.data?.error?.message || `${provider.name} health check failed.`;
      setMessage(errDetail);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove your ${provider.name} API key?`)) return;
    try {
      await onDelete(provider.id);
      setStatus('idle');
      setMessage('');
      setModels([]);
    } catch {
      setStatus('error');
      setMessage('Failed to remove key.');
    }
  };

  return (
    <div className={`provider-card ${isSaved ? 'provider-saved' : ''}`}>
      <div className="provider-card-header">
        <div className="provider-info">
          <div className="provider-name-row">
            <span className="provider-name">{provider.name}</span>
            <span className="provider-badge" style={{ color: provider.badgeColor }}>
              {provider.badge}
            </span>
          </div>
          <p className="provider-desc">{provider.description}</p>
        </div>
        <div className="provider-status">
          {isSaved ? (
            status === 'error' ? (
              <span className="status-pill status-error">
                <AlertCircle size={12} /> Health Error
              </span>
            ) : (
              <span className="status-pill status-connected">
                <Check size={12} /> Connected
              </span>
            )
          ) : (
            <span className="status-pill status-missing">
              <X size={12} /> Not set
            </span>
          )}
        </div>
      </div>

      {isSaved && !isExpanded && (
        <>
          {/* Active Model Selector */}
          <div className="provider-model-row">
            <div className="model-row-header">
              <span className="model-label">
                <Cpu size={14} style={{ color: 'var(--primary)' }} /> Active Model
              </span>
              <button
                className="model-refresh-btn"
                onClick={loadModels}
                title="Refresh available models list"
                disabled={modelsLoading}
              >
                <RefreshCw size={12} className={modelsLoading ? 'spin' : ''} />
              </button>
            </div>
            <div className="model-select-wrapper">
              <select
                className="model-select"
                value={selectedModel}
                onChange={handleModelChange}
                disabled={status === 'testing' || modelsLoading}
              >
                {models.length > 0 ? (
                  models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))
                ) : (
                  <option value={selectedModel}>{selectedModel || 'Default Model'}</option>
                )}
              </select>
            </div>
          </div>

          <div className="provider-actions-row">
            <span className="key-preview">{savedKey.keyPreview}</span>
            <div className="provider-btns">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleTest}
                disabled={status === 'testing'}
              >
                {status === 'testing' ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
                {status === 'testing' ? 'Testing...' : 'Test Health'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(true)}>
                <Key size={14} /> Replace Key
              </button>
              <button className="btn btn-danger-sm" onClick={handleDelete} title="Remove API key">
                <X size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {(!isSaved || isExpanded) && (
        <div className="provider-input-area">
          <div className="key-input-wrapper">
            <input
              type={showKey ? 'text' : 'password'}
              className="form-field-input"
              placeholder={provider.placeholder}
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button
              className="key-visibility-btn"
              onClick={() => setShowKey(v => !v)}
              type="button"
              aria-label="Toggle key visibility"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="provider-input-actions">
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="get-key-link"
            >
              Get {provider.name} API key
            </a>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isExpanded && (
                <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(false)}>
                  Cancel
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={!inputKey.trim() || status === 'saving'}
              >
                {status === 'saving' ? <Loader2 size={14} className="spin" /> : <Key size={14} />}
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`provider-msg ${status === 'error' ? 'msg-error' : 'msg-success'}`}>
          {status === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  const { theme, onToggleTheme } = useOutletContext();

  const [savedKeys, setSavedKeys]             = useState([]);
  const [keysLoading, setKeysLoading]         = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', msg: '' });

  const loadKeys = useCallback(async () => {
    try {
      const data = await getKeys();
      setSavedKeys(data);
    } catch {
      // silently fail — user may not have keys yet
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleSaveKey = async (provider, apiKey, selectedModel) => {
    await saveKey(provider, apiKey, selectedModel);
    await loadKeys();
  };

  const handleDeleteKey = async (provider) => {
    await deleteKey(provider);
    await loadKeys();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: '', msg: '' });
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', msg: 'New password must be at least 8 characters.' });
      return;
    }
    setPasswordFeedback({ type: 'info', msg: 'Change password coming soon.' });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Permanently delete your account? This cannot be undone.')) {
      alert('Account deletion coming soon.');
    }
  };

  return (
    <div className="settings-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Settings</h1>
        <p className="dashboard-subtitle">Configure your AI provider, active models, appearance, and account security.</p>
      </header>

      <div className="settings-sections-layout">

        {/* AI PROVIDER — BYOK */}
        <section className="settings-section-card card-panel">
          <div className="settings-section-header">
            <Key size={20} className="section-icon" />
            <div>
              <h2 className="settings-section-title">AI Provider & Model Selection</h2>
              <p className="settings-section-desc">
                SpeakForge uses your own API key — your data never touches third-party servers.
                Select your preferred model and run a health check to verify connectivity.
              </p>
            </div>
          </div>

          {keysLoading ? (
            <div className="keys-loading">
              <Loader2 size={20} className="spin" /> Loading configured providers...
            </div>
          ) : (
            <div className="providers-list">
              {PROVIDERS.map(p => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  savedKey={savedKeys.find(k => k.provider === p.id)}
                  onSave={handleSaveKey}
                  onDelete={handleDeleteKey}
                />
              ))}
            </div>
          )}
        </section>

        {/* APPEARANCE */}
        <section className="settings-section-card card-panel">
          <h2 className="settings-section-title">Appearance</h2>
          <p className="settings-section-desc">Change the interface color theme.</p>
          <div className="theme-toggle-row">
            <span className="theme-status-label">
              Current Theme: <strong>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</strong>
            </span>
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary theme-toggle-btn"
              aria-label="Toggle visual theme"
            >
              {theme === 'light' ? <><Moon size={16} /> Switch to Dark</> : <><Sun size={16} /> Switch to Light</>}
            </button>
          </div>
        </section>

        {/* CHANGE PASSWORD */}
        <section className="settings-section-card card-panel">
          <h2 className="settings-section-title">Change Password</h2>
          <p className="settings-section-desc">Update your login security credentials.</p>

          {passwordFeedback.msg && (
            <div className={`settings-alert alert-${passwordFeedback.type === 'error' ? 'error' : 'success'}`} role="alert">
              {passwordFeedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span>{passwordFeedback.msg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="settings-password-form">
            <div className="form-field-group">
              <label htmlFor="currentPass" className="form-field-label">Current Password</label>
              <input type="password" id="currentPass" className="form-field-input"
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="form-fields-grid" style={{ marginTop: '0px' }}>
              <div className="form-field-group">
                <label htmlFor="newPass" className="form-field-label">New Password</label>
                <input type="password" id="newPass" className="form-field-input"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="form-field-group">
                <label htmlFor="confirmPass" className="form-field-label">Confirm New Password</label>
                <input type="password" id="confirmPass" className="form-field-input"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary settings-submit-btn">
              <Lock size={16} /> Update Password
            </button>
          </form>
        </section>

        {/* DANGER ZONE */}
        <section className="settings-section-card card-panel danger-zone-card">
          <div className="danger-zone-header-row">
            <ShieldAlert size={20} className="danger-icon" />
            <h2 className="settings-section-title danger-title">Danger Zone</h2>
          </div>
          <p className="settings-section-desc" style={{ color: 'var(--text-secondary)' }}>
            Permanently delete your account, session records, and all evaluation histories. This is irreversible.
          </p>
          <button type="button" className="btn btn-danger delete-account-btn" onClick={handleDeleteAccount}>
            <Trash2 size={16} /> Delete Account
          </button>
        </section>

      </div>
    </div>
  );
}

export default SettingsPage;
