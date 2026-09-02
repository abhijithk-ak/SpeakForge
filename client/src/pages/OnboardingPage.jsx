import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Briefcase, Sparkles, Rocket, RefreshCw,
  CheckCircle, ArrowLeft, ArrowRight, Mic, Volume2, Loader, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { completeOnboarding } from '../services/profileService';
import './OnboardingPage.css';

const ROLES = [
  { id: 'school_student', label: 'School Student', icon: GraduationCap },
  { id: 'college_student', label: 'College / University Student', icon: GraduationCap },
  { id: 'working_professional', label: 'Working Professional', icon: Briefcase },
  { id: 'fresher', label: 'Fresher / Recent Graduate', icon: Sparkles },
  { id: 'entrepreneur', label: 'Entrepreneur / Founder', icon: Rocket },
  { id: 'career_switcher', label: 'Career Switcher', icon: RefreshCw },
];

const FIELDS = [
  'Technology', 'Engineering', 'Finance', 'Healthcare', 'Law',
  'Marketing', 'Design', 'Education', 'Sales', 'Other'
];

const GOALS = [
  'Job Interviews', 'Client Meetings', 'Public Speaking',
  'Presentations', 'English Fluency', 'Confidence', 'Technical Explanation'
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Just starting out, learning the fundamentals' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with basic conversations, looking to sharpen delivery' },
  { id: 'advanced', label: 'Advanced', desc: 'Experienced communicator looking for rigorous feedback and mastery' },
];

export default function OnboardingPage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [fields, setFields] = useState([]);
  const [goals, setGoals] = useState([]);
  const [experience, setExperience] = useState('intermediate');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micWorking, setMicWorking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Toggle multi-select chips
  const toggleChip = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Test microphone audio level with Web Audio API
  const testMicrophone = async () => {
    try {
      setIsTestingMic(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(Math.round((average / 128) * 100), 100);
        setAudioLevel(normalized);
        if (normalized > 10) {
          setMicWorking(true);
        }
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();

      // Play AI voice sample
      if (window.speechSynthesis) {
        const utt = new SpeechSynthesisUtterance("Welcome to SpeakForge. I am your voice coach. Speak a sentence to test your microphone.");
        utt.rate = 1.0;
        window.speechSynthesis.speak(utt);
      }
    } catch (err) {
      console.warn('Mic check error:', err);
      setIsTestingMic(false);
      setMicWorking(true); // Don't block user if permission dismissed
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    try {
      await completeOnboarding({
        role,
        fields,
        goals,
        experience,
        experience_level: experience,
        primary_goal: goals[0] || 'Confidence',
        industry: fields[0] || 'General'
      });

      updateUser({ onboarding_completed: true });
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding save failed:', err);
      updateUser({ onboarding_completed: true });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboard-page">
      <div className="onboard-card">

        {/* Progress Header */}
        <div className="onboard-progress-header">
          <span className="progress-text">Step {step} of 5</span>
          <div className="progress-dots-row">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`progress-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="onboard-skip-top-btn"
            onClick={handleFinish}
          >
            Skip to Dashboard
          </button>
        </div>

        {error && (
          <div className="onboard-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Who are you? */}
        {step === 1 && (
          <div className="onboard-step-body">
            <h1 className="onboard-step-title">Who are you?</h1>
            <p className="onboard-step-subtitle">This helps your AI coach calibrate scenario context and tone.</p>

            <div className="onboard-options-grid">
              {ROLES.map(r => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`onboard-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setRole(r.id)}
                  >
                    <Icon size={20} className="option-card-icon" />
                    <span className="option-label-text">{r.label}</span>
                    {isSelected && <CheckCircle size={18} className="option-selected-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Field */}
        {step === 2 && (
          <div className="onboard-step-body">
            <h1 className="onboard-step-title">What is your field?</h1>
            <p className="onboard-step-subtitle">Select all industries or domains relevant to your practice.</p>

            <div className="onboard-chips-wrap">
              {FIELDS.map(f => {
                const isSelected = fields.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    className={`onboard-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleChip(fields, setFields, f)}
                  >
                    {f}
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Goals */}
        {step === 3 && (
          <div className="onboard-step-body">
            <h1 className="onboard-step-title">What do you want to improve?</h1>
            <p className="onboard-step-subtitle">Pick the areas you want to prioritize in your coaching.</p>

            <div className="onboard-chips-wrap">
              {GOALS.map(g => {
                const isSelected = goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    className={`onboard-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleChip(goals, setGoals, g)}
                  >
                    {g}
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Experience Level */}
        {step === 4 && (
          <div className="onboard-step-body">
            <h1 className="onboard-step-title">Your experience level?</h1>
            <p className="onboard-step-subtitle">Your coach will match vocabulary complexity and challenge depth.</p>

            <div className="onboard-options-list">
              {EXPERIENCE_LEVELS.map(lvl => {
                const isSelected = experience === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    className={`onboard-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setExperience(lvl.id)}
                  >
                    <div className="option-label-group">
                      <span className="option-label-text">{lvl.label}</span>
                      <span className="option-desc-text">{lvl.desc}</span>
                    </div>
                    {isSelected && <CheckCircle size={18} className="option-selected-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Voice & Mic Check */}
        {step === 5 && (
          <div className="onboard-step-body">
            <h1 className="onboard-step-title">Quick voice check</h1>
            <p className="onboard-step-subtitle">Ensure your microphone and browser audio are ready for live voice coaching.</p>

            <div className="voice-check-container">
              {!isTestingMic ? (
                <button
                  type="button"
                  className="btn btn-primary mic-test-start-btn"
                  onClick={testMicrophone}
                >
                  <Mic size={18} /> Test Microphone & Voice
                </button>
              ) : (
                <div className="mic-live-meter-wrap">
                  <div className="meter-visual">
                    <div
                      className="meter-bar-fill"
                      style={{ width: `${Math.max(audioLevel, 8)}%` }}
                    />
                  </div>
                  <div className="meter-status">
                    {micWorking ? (
                      <span className="meter-status-ok"><CheckCircle size={16} /> Microphone is working!</span>
                    ) : (
                      <span>Speak into your microphone now...</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="onboard-footer-actions">
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-secondary onboard-back-btn"
              onClick={() => setStep(step - 1)}
              disabled={isLoading}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div className="back-btn-spacer" />}

          {step < 5 ? (
            <button
              type="button"
              className="btn btn-primary onboard-next-btn"
              onClick={() => setStep(step + 1)}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary onboard-submit-btn"
              onClick={handleFinish}
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader size={16} className="spin" /> Setting up coach...</>
              ) : (
                <>Start Practicing <ArrowRight size={16} /></>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
