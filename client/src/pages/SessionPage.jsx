import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Square, Briefcase, Mic2, Users, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { startSession, sendTurn, endSession, createEvaluation } from '../services/sessionService';
import './SessionPage.css';

// ─── Browser Speech Recognition ─────────────────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const MODE_ICONS = {
  interview: Briefcase,
  speech:    Mic2,
  client:    Users
};

const MODE_LABELS = {
  interview: 'Mock Interview',
  speech:    'Speech Practice',
  client:    'Client Comm'
};

// State machine: starting → ready → listening → processing → speaking → ended
const STATES = {
  STARTING:   'starting',
  READY:      'ready',
  LISTENING:  'listening',
  PROCESSING: 'processing',
  SPEAKING:   'speaking',
  ENDED:      'ended',
  ERROR:      'error'
};

function cleanForSpeech(raw) {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function SessionPage() {
  const { id }         = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();
  const { provider = 'groq', topic = null, scenario = null, client_personality = null }
    = location.state || {};

  // State
  const [phase,         setPhase]         = useState(STATES.STARTING);
  const [mode,          setMode]          = useState('interview');
  const [errorMsg,      setErrorMsg]      = useState('');
  const [turns,         setTurns]         = useState([]);
  const [liveText,      setLiveText]      = useState('');
  const [isMicOn,       setIsMicOn]       = useState(false);
  const [elapsed,       setElapsed]       = useState(0);
  const [turnNumber,    setTurnNumber]    = useState(1);
  const [browserCompat, setBrowserCompat] = useState(true);

  // Refs
  const recognitionRef  = useRef(null);
  const synthRef        = useRef(window.speechSynthesis);
  const transcriptRef   = useRef('');
  const silenceTimerRef = useRef(null);
  const timerRef        = useRef(null);
  const turnRef         = useRef(turnNumber);
  const transcriptAreaRef = useRef(null);
  const isListeningRef  = useRef(false);
  const phaseRef        = useRef(phase);

  turnRef.current  = turnNumber;
  phaseRef.current = phase;

  // ── Timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === STATES.READY || phase === STATES.LISTENING ||
        phase === STATES.PROCESSING || phase === STATES.SPEAKING) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Auto-scroll transcript ─────────────────────────────────────────
  useEffect(() => {
    if (transcriptAreaRef.current) {
      transcriptAreaRef.current.scrollTop = transcriptAreaRef.current.scrollHeight;
    }
  }, [turns]);

  // Forward declaration for recursion
  const startListening = useCallback(() => {}, []);

  // ── TTS — speak AI response ────────────────────────────────────────
  const speakText = useCallback((text) => {
    const synth = synthRef.current;
    if (!synth) return;

    // Stop any current speech
    synth.cancel();

    const spokenText = cleanForSpeech(text);
    if (!spokenText) {
      setPhase(STATES.READY);
      return;
    }

    const utt = new SpeechSynthesisUtterance(spokenText);
    utt.rate   = 1.05; // Slightly natural conversation speed
    utt.pitch  = 1.0;
    utt.volume = 1.0;

    const voices = synth.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'))
    );
    if (preferred) utt.voice = preferred;

    utt.onstart = () => {
      setPhase(STATES.SPEAKING);
    };

    utt.onend = () => {
      if (phaseRef.current === STATES.SPEAKING) {
        setPhase(STATES.READY);
        // Auto-resume microphone listening for natural hands-free conversation
        setTimeout(() => {
          if (phaseRef.current === STATES.READY) {
            startListeningInternal();
          }
        }, 300);
      }
    };

    utt.onerror = () => {
      if (phaseRef.current === STATES.SPEAKING) {
        setPhase(STATES.READY);
      }
    };

    synth.speak(utt);
  }, []);

  // ── Process user utterance ────────────────────────────────────────
  const processTurnText = useCallback(async (text) => {
    if (!text.trim()) return;

    // Clear timers and state
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setLiveText('');
    setPhase(STATES.PROCESSING);

    // Add user bubble
    setTurns(prev => [...prev, { role: 'user', content: text.trim() }]);

    try {
      const { response } = await sendTurn(id, {
        transcript:         text.trim(),
        provider,
        turnNumber:         turnRef.current,
        topic,
        scenario,
        client_personality
      });

      setTurnNumber(n => n + 1);

      // Add AI bubble
      setTurns(prev => [...prev, { role: 'ai', content: response }]);

      // Speak response
      speakText(response);
    } catch (err) {
      console.error('Turn processing error:', err);
      setPhase(STATES.READY);
    }
  }, [id, provider, topic, scenario, client_personality, speakText]);

  // ── STT Setup ──────────────────────────────────────────────────────
  const startListeningInternal = useCallback(() => {
    if (!SpeechRecognition) {
      setBrowserCompat(false);
      return;
    }

    // Interruption / Barge-In check: If AI is speaking, cut it off immediately!
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
    }

    // Stop existing instance if active
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';

    transcriptRef.current = '';
    setLiveText('');

    recognition.onresult = (event) => {
      // Barge-in check: If AI starts speaking while result arrives, kill TTS
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }

      let interim = '';
      let final   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript + ' ';
        } else {
          interim += item[0].transcript;
        }
      }

      if (final) {
        transcriptRef.current = (transcriptRef.current + ' ' + final).trim();
      }

      const combined = (transcriptRef.current + ' ' + interim).trim();
      setLiveText(combined);

      // Auto-send silence timer (1.1s silence detection for real-time feel)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (combined.length > 2) {
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = (transcriptRef.current + ' ' + interim).trim();
          if (textToSend) {
            try { recognition.stop(); } catch {}
            setIsMicOn(false);
            isListeningRef.current = false;
            processTurnText(textToSend);
          }
        }, 1100);
      }
    };

    recognition.onend = () => {
      setIsMicOn(false);
      isListeningRef.current = false;
      const captured = transcriptRef.current.trim();
      if (captured && phaseRef.current === STATES.LISTENING) {
        processTurnText(captured);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('STT error:', event.error);
      }
      setIsMicOn(false);
      isListeningRef.current = false;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsMicOn(true);
      isListeningRef.current = true;
      setPhase(STATES.LISTENING);
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }, [processTurnText]);

  // ── Toggle Microphone Button ───────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
    }

    if (isMicOn || isListeningRef.current) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognitionRef.current?.stop(); } catch {}
      setIsMicOn(false);
      isListeningRef.current = false;
      const captured = transcriptRef.current.trim();
      if (captured) {
        processTurnText(captured);
      } else {
        setPhase(STATES.READY);
      }
    } else {
      startListeningInternal();
    }
  }, [isMicOn, processTurnText, startListeningInternal]);

  // ── Keyboard shortcut — Space to toggle mic ────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleMic();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleMic]);

  // ── Initialize session ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { opening } = await startSession(id, {
          provider,
          topic,
          scenario,
          client_personality
        });

        if (cancelled) return;

        setTurns([{ role: 'ai', content: opening }]);
        setPhase(STATES.READY);

        // Speak opening
        speakText(opening);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.response?.data?.error?.message || 'Failed to start session. Check your API key in Settings.');
          setPhase(STATES.ERROR);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [id, provider, topic, scenario, client_personality, speakText]);

  // ── End session ────────────────────────────────────────────────────
  const handleEndSession = async () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    synthRef.current?.cancel();
    try { recognitionRef.current?.abort(); } catch {}
    clearInterval(timerRef.current);

    setPhase(STATES.ENDED);
    setIsMicOn(false);

    try {
      await endSession(id);
      createEvaluation(id, provider).catch(() => {});
    } catch (err) {
      console.error('End session error:', err);
    }

    navigate(`/results/${id}`);
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      synthRef.current?.cancel();
      try { recognitionRef.current?.abort(); } catch {}
      clearInterval(timerRef.current);
    };
  }, []);

  const ModeIcon = MODE_ICONS[mode] || Briefcase;

  const orbClass =
    phase === STATES.LISTENING  ? 'orb-listening'  :
    phase === STATES.PROCESSING ? 'orb-processing'  :
    phase === STATES.SPEAKING   ? 'orb-speaking'    : 'orb-idle';

  const stateText =
    phase === STATES.STARTING   ? 'Connecting to AI...'      :
    phase === STATES.LISTENING  ? 'Listening (Speak now)...'  :
    phase === STATES.PROCESSING ? 'AI thinking...'           :
    phase === STATES.SPEAKING   ? 'AI speaking (Speak to interrupt)' :
    phase === STATES.READY      ? 'Listening ready — speak anytime'  :
    phase === STATES.ENDED      ? 'Session ended'            :
    phase === STATES.ERROR      ? 'Error'                    : '';

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="session-page">

      {/* TOP BAR */}
      <div className="session-topbar">
        <div className="session-topbar-left">
          <span className="session-mode-badge">
            <ModeIcon size={12} />
            {MODE_LABELS[mode] || 'Practice'}
          </span>
          <span className="session-timer">{formatTime(elapsed)}</span>
        </div>
        <button className="session-end-btn" onClick={handleEndSession}>
          <Square size={14} /> End Session
        </button>
      </div>

      {/* LOADING / ERROR OVERLAY */}
      {(phase === STATES.STARTING || phase === STATES.ERROR) && (
        <div className="session-overlay">
          {phase === STATES.STARTING ? (
            <>
              <Loader2 size={40} className="spin" style={{ color: 'var(--primary)' }} />
              <p className="session-overlay-title">Connecting to AI Coach...</p>
              <p className="session-overlay-desc">
                Starting real-time {MODE_LABELS[mode]} session via {provider}.
              </p>
            </>
          ) : (
            <>
              <AlertCircle size={40} style={{ color: 'var(--error)' }} />
              <p className="session-overlay-title">Session Error</p>
              <p className="session-overlay-desc">{errorMsg}</p>
              <button className="btn btn-secondary" onClick={() => navigate('/practice')}>
                Back to Practice
              </button>
            </>
          )}
        </div>
      )}

      {/* MAIN AREA */}
      <div className="session-main">

        {/* State Orb */}
        <div className="state-orb-wrap">
          <div className={`state-orb ${orbClass}`} onClick={toggleMic} style={{ cursor: 'pointer' }}>
            {phase === STATES.PROCESSING ? (
              <Loader2 size={36} className="orb-icon spin" />
            ) : phase === STATES.LISTENING ? (
              <Mic size={36} className="orb-icon" />
            ) : phase === STATES.SPEAKING ? (
              <Volume2 size={36} className="orb-icon" />
            ) : (
              <Mic size={36} className="orb-icon" />
            )}
          </div>
          <span className="state-label">{stateText}</span>
        </div>

        {/* Transcript */}
        {turns.length > 0 && (
          <div className="transcript-area" ref={transcriptAreaRef}>
            {turns.map((t, i) => (
              <div key={i} className={`transcript-bubble ${t.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                <div className="bubble-speaker">{t.role === 'user' ? 'You' : 'Coach'}</div>
                {t.content}
              </div>
            ))}
          </div>
        )}

        {/* Live STT */}
        {(phase === STATES.LISTENING || (liveText && phase !== STATES.PROCESSING)) && (
          <div className={`live-transcript ${liveText ? 'has-content' : ''}`}>
            {liveText || 'Listening for your voice...'}
          </div>
        )}

      </div>

      {/* BROWSER COMPAT WARNING */}
      {!browserCompat && (
        <div className="compat-notice">
          Your browser does not support the Web Speech API. Please use Chrome or Edge for voice interaction.
        </div>
      )}

      {/* BOTTOM CONTROLS */}
      {phase !== STATES.STARTING && phase !== STATES.ERROR && phase !== STATES.ENDED && (
        <div className="session-controls">
          <div className="mic-hint">
            {phase === STATES.LISTENING
              ? 'Pause speaking to auto-send, or tap mic'
              : phase === STATES.PROCESSING
              ? 'AI is responding...'
              : phase === STATES.SPEAKING
              ? 'Start speaking anytime to interrupt the AI'
              : 'Tap mic or press Space to speak'}
          </div>
          <button
            className={`session-mic-btn ${isMicOn ? 'mic-active' : ''}`}
            onClick={toggleMic}
            disabled={phase === STATES.PROCESSING}
            aria-label={isMicOn ? 'Stop recording' : 'Start recording'}
          >
            {isMicOn ? <MicOff size={26} /> : <Mic size={26} />}
          </button>
          <div style={{ width: '120px' }} />
        </div>
      )}

    </div>
  );
}
