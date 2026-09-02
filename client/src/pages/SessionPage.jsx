import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Square, Pause, Play, AlertCircle, Loader2,
  Briefcase, Mic2, Users, Send, CheckCircle
} from 'lucide-react';
import { startSession, endSession, createEvaluation } from '../services/sessionService';
import api from '../services/api';
import './SessionPage.css';

// ─── Browser SpeechRecognition Check ─────────────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

// ─── State Machine States ───────────────────────────────────────────
const SESSION_STATES = {
  IDLE:       'idle',
  PREPARING:  'preparing', // for speech mode 3-2-1
  LISTENING:  'listening',
  THINKING:   'thinking',
  SPEAKING:   'speaking',
  PAUSED:     'paused',
  ENDED:      'ended',
  ERROR:      'error'
};

const MODE_META = {
  interview: { label: 'Mock Interview', icon: Briefcase },
  speech:    { label: '2-Minute Speech', icon: Mic2 },
  client:    { label: 'Client Communication', icon: Users }
};

/**
 * Load browser voices reliably with voiceschanged listener (BUG 2 fix)
 */
function loadVoices() {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve([]);
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) return resolve(voices);
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
  });
}

export default function SessionPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    provider = 'groq',
    topic = null,
    scenario = null,
    client_personality = null,
    durationSeconds = 120
  } = location.state || {};

  // Core State
  const [sessionState, setSessionState] = useState(SESSION_STATES.IDLE);
  const [mode, setMode] = useState('interview');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeModel, setActiveModel] = useState('');

  // Conversation & History
  const [turns, setTurns] = useState([]); // [{ role: 'user'|'assistant', content: string, interrupted?: boolean }]
  const [liveTranscript, setLiveTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  // Timers & Metrics
  const [elapsed, setElapsed] = useState(0);
  const [remainingTime, setRemainingTime] = useState(durationSeconds);
  const [prepCountdown, setPrepCountdown] = useState(3);
  const [turnCount, setTurnCount] = useState(0);
  const [browserCompat, setBrowserCompat] = useState(true);

  // Audio & Waveform
  const [volumeLevel, setVolumeLevel] = useState(0);
  const canvasRef = useRef(null);

  // Stable references for state machine and locks
  const stateRef = useRef(sessionState);
  stateRef.current = sessionState;

  const recognitionRef = useRef(null);
  const selectedVoiceRef = useRef(null);
  const ttsQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const isSubmittingRef = useRef(false); // Submission lock to prevent duplicate turns (BUG 1 fix)
  const fullTranscriptSpeechRef = useRef(''); // Accumulates speech in 2-minute speech mode
  const historyRef = useRef([]); // Master conversation context array (BUG 3 fix)
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const transcriptAreaRef = useRef(null);
  const userSettingsRef = useRef({ voiceRate: 1.0, voicePitch: 1.0 });

  // ── Load User Settings & Lock Stable Voice (BUG 2 fix) ─────────────
  useEffect(() => {
    api.get('/settings').then(res => {
      const s = res.data?.data;
      if (s) {
        userSettingsRef.current = {
          voiceRate: parseFloat(s.voice_rate) || 1.0,
          voicePitch: parseFloat(s.voice_pitch) || 1.0,
          voiceName: s.voice_name
        };
      }
    }).catch(() => {});

    loadVoices().then(voices => {
      if (voices.length > 0) {
        // Preferred: natural english voice or user-saved voice
        const savedName = userSettingsRef.current.voiceName;
        const matchingSaved = savedName ? voices.find(v => v.name === savedName) : null;
        const naturalEn = voices.find(v =>
          v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        );
        const anyEn = voices.find(v => v.lang.startsWith('en'));

        selectedVoiceRef.current = matchingSaved || naturalEn || anyEn || voices[0];
      }
    });
  }, []);

  // ── Setup Audio Waveform Analyser (Web Audio API) ──────────────────
  const setupAudioAnalyser = useCallback(async () => {
    try {
      if (audioContextRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawWave = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const norm = Math.min(Math.round((avg / 128) * 100), 100);
        setVolumeLevel(norm);

        // Draw animated bars on canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / bufferLength) * 2;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = stateRef.current === SESSION_STATES.LISTENING ? '#7c3aed' : '#06b6d4';
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
          }
        }

        animFrameRef.current = requestAnimationFrame(drawWave);
      };

      drawWave();
    } catch (err) {
      console.warn('Audio analyser setup error (mic permission):', err);
    }
  }, []);

  // ── Auto-scroll transcript ─────────────────────────────────────────
  useEffect(() => {
    if (transcriptAreaRef.current) {
      transcriptAreaRef.current.scrollTop = transcriptAreaRef.current.scrollHeight;
    }
  }, [turns, liveTranscript]);

  // ── Session Timer ──────────────────────────────────────────────────
  useEffect(() => {
    let interval = null;
    if (sessionState === SESSION_STATES.LISTENING ||
        sessionState === SESSION_STATES.THINKING ||
        sessionState === SESSION_STATES.SPEAKING) {
      interval = setInterval(() => {
        setElapsed(e => e + 1);
        if (mode === 'speech') {
          setRemainingTime(r => {
            if (r <= 1) {
              clearInterval(interval);
              handleEndSession();
              return 0;
            }
            return r - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState, mode]);

  // ── Format helpers ─────────────────────────────────────────────────
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── TTS Pipeline: Drain Queue with Sentence Chunks (Pillar 1) ──────
  const drainQueue = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (ttsQueueRef.current.length === 0) {
      isSpeakingRef.current = false;
      if (stateRef.current !== SESSION_STATES.ENDED && stateRef.current !== SESSION_STATES.PAUSED) {
        setSessionState(SESSION_STATES.LISTENING);
        startListening();
      }
      return;
    }

    isSpeakingRef.current = true;
    setSessionState(SESSION_STATES.SPEAKING);

    const sentence = ttsQueueRef.current.shift();
    const utterance = new SpeechSynthesisUtterance(sentence);
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }
    utterance.rate = userSettingsRef.current.voiceRate;
    utterance.pitch = userSettingsRef.current.voicePitch;

    utterance.onend = () => drainQueue();
    utterance.onerror = () => drainQueue();

    window.speechSynthesis.speak(utterance);
  }, []);

  const enqueueSentence = useCallback((sentenceText) => {
    if (!sentenceText || !sentenceText.trim()) return;
    ttsQueueRef.current.push(sentenceText.trim());
    if (!isSpeakingRef.current) {
      drainQueue();
    }
  }, [drainQueue]);

  // ── Trigger AI Conversational Turn via Streaming SSE (Pillars 1 & 2)
  const triggerUserTurn = useCallback(async (userSpeech) => {
    if (!userSpeech || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Check for verbal exit intent
    const lower = userSpeech.toLowerCase().trim();
    if (lower === 'end session' || lower === 'stop session' || lower === 'that is all' || lower === 'we are done') {
      handleEndSession();
      return;
    }

    // Stop recognition before sending to AI (BUG 1 fix)
    try { recognitionRef.current?.stop(); } catch {}

    setLiveTranscript('');
    setSessionState(SESSION_STATES.THINKING);

    // Update frontend transcript and conversation history (BUG 3 fix)
    setTurns(prev => [...prev, { role: 'user', content: userSpeech }]);
    const updatedHistory = [...historyRef.current, { role: 'user', content: userSpeech }];
    historyRef.current = updatedHistory;

    ttsQueueRef.current = [];
    isSpeakingRef.current = false;

    let aiFullResponse = '';

    try {
      const response = await fetch(`/api/sessions/${id}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          transcript: userSpeech,
          messages: updatedHistory,
          provider,
          turnNumber: turnCount + 1,
          topic,
          scenario,
          client_personality
        })
      });

      if (!response.ok) throw new Error(`Stream HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      // Add placeholder AI turn to state
      setTurns(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n\n');
        streamBuffer = lines.pop(); // keep remainder

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'sentence') {
              aiFullResponse += (aiFullResponse ? ' ' : '') + parsed.text;
              enqueueSentence(parsed.text);

              // Update displayed AI bubble
              setTurns(prev => {
                const copy = [...prev];
                const lastIdx = copy.length - 1;
                if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
                  copy[lastIdx] = { ...copy[lastIdx], content: aiFullResponse };
                }
                return copy;
              });
            } else if (parsed.type === 'done') {
              aiFullResponse = parsed.fullText || aiFullResponse;
            }
          } catch {}
        }
      }

      setTurnCount(c => c + 1);
      historyRef.current = [...updatedHistory, { role: 'assistant', content: aiFullResponse }];
    } catch (err) {
      console.error('Turn streaming error:', err);
      // Fallback: recover state
      setSessionState(SESSION_STATES.LISTENING);
      startListening();
    } finally {
      isSubmittingRef.current = false;
    }
  }, [id, provider, topic, scenario, client_personality, turnCount, enqueueSentence]);

  // ── Speech Recognition Lifecycle (Pillar 2 VAD & Barge-in) ────────
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setBrowserCompat(false);
      return;
    }
    if (stateRef.current === SESSION_STATES.ENDED || stateRef.current === SESSION_STATES.PAUSED) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } catch {}

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let lastFinalTranscript = '';

    recognition.onresult = (event) => {
      // ── BARGE-IN INTERRUPTION (Pillar 3) ──────────────────────────
      // If user starts speaking while AI is speaking, interrupt AI immediately!
      if (stateRef.current === SESSION_STATES.SPEAKING) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        ttsQueueRef.current = [];
        isSpeakingRef.current = false;
        setSessionState(SESSION_STATES.LISTENING);

        // Mark interrupted on the last AI turn
        setTurns(prev => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
            copy[lastIdx] = { ...copy[lastIdx], interrupted: true };
          }
          return copy;
        });
      }

      let interim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          currentFinal += res[0].transcript + ' ';
        } else {
          interim += res[0].transcript;
        }
      }

      // 2-Minute Speech Mode: Silent evaluation, no AI interruptions
      if (mode === 'speech') {
        if (currentFinal) {
          fullTranscriptSpeechRef.current += currentFinal;
        }
        setLiveTranscript(fullTranscriptSpeechRef.current + (interim ? ' ' + interim : ''));
        return;
      }

      // Conversational Mode: VAD 800ms silence detection after speech
      if (currentFinal) {
        lastFinalTranscript = (lastFinalTranscript + ' ' + currentFinal).trim();
      }

      const displayPrompt = (lastFinalTranscript + ' ' + interim).trim();
      setLiveTranscript(displayPrompt);

      if (displayPrompt.length > 2) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const textToSubmit = (lastFinalTranscript + ' ' + interim).trim();
          if (textToSubmit && !isSubmittingRef.current) {
            triggerUserTurn(textToSubmit);
            lastFinalTranscript = '';
          }
        }, 800); // 800ms silence detection threshold
      }
    };

    recognition.onend = () => {
      // Auto-restart if in listening state and not submitting
      if (stateRef.current === SESSION_STATES.LISTENING && !isSubmittingRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Recognition error:', event.error);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setSessionState(SESSION_STATES.LISTENING);
    } catch (err) {
      console.warn('Failed to start recognition:', err);
    }
  }, [mode, triggerUserTurn]);

  // ── Initialize Session ─────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const init = async () => {
      setupAudioAnalyser();

      // Check session mode from API or state
      let detectedMode = 'interview';
      try {
        const sRes = await api.get(`/sessions/${id}`);
        const sData = sRes.data?.data;
        if (sData?.mode) {
          detectedMode = sData.mode;
          setMode(detectedMode);
        }
      } catch {}

      // ── Speech Mode Setup: 3-2-1 Countdown ──
      if (detectedMode === 'speech') {
        setSessionState(SESSION_STATES.PREPARING);
        let count = 3;
        const prepTimer = setInterval(() => {
          count -= 1;
          setPrepCountdown(count);
          if (count <= 0) {
            clearInterval(prepTimer);
            if (active) {
              setSessionState(SESSION_STATES.LISTENING);
              startListening();
            }
          }
        }, 1000);
        return;
      }

      // ── Conversational Mode Setup: AI Greeting ──
      setSessionState(SESSION_STATES.THINKING);

      try {
        const { opening, model: mId } = await startSession(id, {
          provider,
          topic,
          scenario,
          client_personality
        });

        if (!active) return;
        if (mId) setActiveModel(mId);

        setTurns([{ role: 'assistant', content: opening }]);
        historyRef.current = [{ role: 'assistant', content: opening }];

        // Speak opening greeting with stable voice reference
        enqueueSentence(opening);
      } catch (err) {
        if (active) {
          setErrorMsg(err.response?.data?.error?.message || 'Failed to start session. Check your AI Provider settings.');
          setSessionState(SESSION_STATES.ERROR);
        }
      }
    };

    init();

    return () => {
      active = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      try { recognitionRef.current?.abort(); } catch {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [id, provider, topic, scenario, client_personality, setupAudioAnalyser, enqueueSentence, startListening]);

  // ── End Session & Trigger Evaluation ──────────────────────────────
  const handleEndSession = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    try { recognitionRef.current?.abort(); } catch {}
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setSessionState(SESSION_STATES.ENDED);

    try {
      // If speech mode, save full speech transcript turn
      if (mode === 'speech' && fullTranscriptSpeechRef.current.trim()) {
        await api.post(`/sessions/${id}/turn`, {
          transcript: fullTranscriptSpeechRef.current.trim(),
          provider
        });
      }

      await endSession(id);
      createEvaluation(id, provider).catch(() => {});
    } catch (err) {
      console.warn('End session completion error:', err);
    }

    navigate(`/results/${id}`);
  };

  // ── Text input fallback handler ────────────────────────────────────
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || sessionState === SESSION_STATES.THINKING) return;
    const submitted = textInput.trim();
    setTextInput('');
    triggerUserTurn(submitted);
  };

  // ── Visual Orb Class ───────────────────────────────────────────────
  const getOrbClass = () => {
    if (sessionState === SESSION_STATES.LISTENING) return 'orb-listening';
    if (sessionState === SESSION_STATES.THINKING) return 'orb-thinking';
    if (sessionState === SESSION_STATES.SPEAKING) return 'orb-speaking';
    return 'orb-idle';
  };

  const getStatusText = () => {
    if (sessionState === SESSION_STATES.PREPARING) return `Get ready... ${prepCountdown}`;
    if (sessionState === SESSION_STATES.LISTENING) return mode === 'speech' ? 'Speaking uninterrupted...' : 'Listening (Speak naturally)';
    if (sessionState === SESSION_STATES.THINKING) return 'AI is thinking...';
    if (sessionState === SESSION_STATES.SPEAKING) return 'AI is speaking (Speak anytime to interrupt)';
    if (sessionState === SESSION_STATES.PAUSED) return 'Session paused';
    if (sessionState === SESSION_STATES.ENDED) return 'Session complete';
    return 'Connecting...';
  };

  const ModeIcon = MODE_META[mode]?.icon || Briefcase;

  return (
    <div className="session-page">

      {/* TOP STATUS BAR */}
      <header className="session-topbar">
        <div className="session-topbar-left">
          <span className="session-mode-badge">
            <ModeIcon size={14} />
            {MODE_META[mode]?.label || 'Practice'}
          </span>
          <span className="session-timer">
            {mode === 'speech' ? `${formatTime(remainingTime)} remaining` : formatTime(elapsed)}
          </span>
          {activeModel && <span className="active-model-tag">{activeModel}</span>}
        </div>

        <button className="session-end-btn" onClick={handleEndSession}>
          <Square size={14} /> End Session
        </button>
      </header>

      {/* ERROR OVERLAY */}
      {sessionState === SESSION_STATES.ERROR && (
        <div className="session-overlay">
          <AlertCircle size={44} style={{ color: 'var(--error)' }} />
          <h2 className="session-overlay-title">Connection Error</h2>
          <p className="session-overlay-desc">{errorMsg}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/practice')}>
            Back to Practice
          </button>
        </div>
      )}

      {/* MAIN VIEW */}
      <main className="session-main">

        {/* 2-MINUTE SPEECH MODE VIEW */}
        {mode === 'speech' ? (
          <div className="speech-stage-wrap">
            <div className="speech-topic-card">
              <span className="speech-topic-badge">Your Topic</span>
              <h2 className="speech-topic-title">"{topic || 'A topic of your choice'}"</h2>
            </div>

            <div className="speech-timer-display">
              <span className="timer-large">{formatTime(remainingTime)}</span>
              <span className="timer-sub">/ {formatTime(durationSeconds)}</span>
            </div>

            {/* Live speech visualizer */}
            <canvas ref={canvasRef} className="audio-visualizer-canvas" width={280} height={48} />

            <div className="speech-status-banner">
              {sessionState === SESSION_STATES.PREPARING ? (
                <span className="prep-pulse">Starting in {prepCountdown}...</span>
              ) : (
                <span className="speech-recording-indicator">
                  <span className="rec-dot" /> Speak continuously without interruptions
                </span>
              )}
            </div>

            {liveTranscript && (
              <div className="speech-live-text-box">
                {liveTranscript}
              </div>
            )}
          </div>
        ) : (
          /* CONVERSATIONAL MODES VIEW (Interview & Client) */
          <>
            {/* AI PRESENCE ORB */}
            <div className="state-orb-wrap">
              <div className={`state-orb ${getOrbClass()}`}>
                <div className="orb-inner-glow" />
              </div>
              <span className="state-label">{getStatusText()}</span>
              {/* Real-time audio canvas */}
              <canvas ref={canvasRef} className="audio-visualizer-canvas" width={200} height={32} />
            </div>

            {/* CONVERSATION TRANSCRIPT */}
            <div className="transcript-area" ref={transcriptAreaRef}>
              {turns.map((t, idx) => (
                <div
                  key={idx}
                  className={`transcript-bubble ${t.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}
                >
                  <div className="bubble-speaker">
                    {t.role === 'user' ? 'You' : 'Coach'}
                    {t.interrupted && <span className="interrupted-tag">✦ Interrupted</span>}
                  </div>
                  <div className="bubble-content">{t.content}</div>
                </div>
              ))}

              {sessionState === SESSION_STATES.THINKING && (
                <div className="transcript-bubble bubble-ai thinking-bubble">
                  <div className="bubble-speaker">Coach</div>
                  <div className="thinking-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            {/* LIVE STT PREVIEW */}
            {liveTranscript && (
              <div className="live-transcript has-content">
                {liveTranscript}
              </div>
            )}
          </>
        )}

      </main>

      {/* BOTTOM CONTROLS BAR */}
      <footer className="session-controls">
        <div className="mic-hint">
          {mode === 'speech'
            ? 'Deliver your speech freely. Your complete transcript will be evaluated at the end.'
            : sessionState === SESSION_STATES.SPEAKING
            ? 'Speaking anytime will naturally interrupt the coach.'
            : 'Speak naturally — your turn auto-detects when you pause.'}
        </div>

        {/* Text fallback toggle */}
        <div className="controls-right-group">
          <button
            type="button"
            className="text-toggle-btn"
            onClick={() => setShowTextInput(!showTextInput)}
            title="Type response instead of speaking"
          >
            {showTextInput ? 'Voice mode' : 'Text mode'}
          </button>
        </div>
      </footer>

      {/* OPTIONAL TEXT FALLBACK DRAWER */}
      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="text-fallback-form">
          <input
            type="text"
            className="text-fallback-input"
            placeholder="Type your response and press Enter..."
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            disabled={sessionState === SESSION_STATES.THINKING}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!textInput.trim() || sessionState === SESSION_STATES.THINKING}
          >
            <Send size={14} /> Send
          </button>
        </form>
      )}

    </div>
  );
}
