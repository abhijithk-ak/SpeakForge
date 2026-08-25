import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { completeOnboarding } from '../services/profileService';
import './OnboardingPage.css';

const STEP_OPTIONS = {
  1: {
    title: "What do you currently do?",
    subtitle: "Select the option that best describes your background.",
    key: "role",
    options: [
      { value: "student", label: "Student" },
      { value: "graduate", label: "Recent graduate" },
      { value: "developer", label: "Software developer" },
      { value: "professional", label: "Other professional" },
      { value: "other", label: "Other" }
    ]
  },
  2: {
    title: "Experience level",
    subtitle: "How long have you worked in your field?",
    key: "experience_level",
    options: [
      { value: "beginner", label: "Beginner", desc: "No professional experience yet" },
      { value: "entry", label: "Entry level", desc: "Less than 1 year of experience" },
      { value: "intermediate", label: "Intermediate", desc: "1–3 years of experience" },
      { value: "experienced", label: "Experienced", desc: "3+ years of experience" }
    ]
  },
  3: {
    title: "Why are you here?",
    subtitle: "Select your primary communication goal.",
    key: "primary_goal",
    options: [
      { value: "interviews", label: "Prepare for job interviews" },
      { value: "communication", label: "Improve communication skills" },
      { value: "confidence", label: "Build speaking confidence" },
      { value: "client", label: "Practice client communication" },
      { value: "speaking", label: "Public speaking improvement" }
    ]
  },
  4: {
    title: "Employment status",
    subtitle: "What is your current work status?",
    key: "employment_status",
    options: [
      { value: "seeking", label: "Currently job seeking" },
      { value: "student", label: "Student" },
      { value: "employed", label: "Employed" },
      { value: "other", label: "Other" }
    ]
  }
};

function OnboardingPage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    role: '',
    experience_level: '',
    primary_goal: '',
    employment_status: '',
    target_role: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectOption = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Complete onboarding via API
      await completeOnboarding({
        role: answers.role,
        experience_level: answers.experience_level,
        primary_goal: answers.primary_goal,
        employment_status: answers.employment_status,
        target_role: answers.target_role || null
      });

      // Update local auth context cache
      updateUser({ onboarding_completed: true });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Onboarding completion failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepConfig = STEP_OPTIONS[step];
  const selectedValue = currentStepConfig ? answers[currentStepConfig.key] : null;
  const isNextDisabled = currentStepConfig && !selectedValue;

  return (
    <div className="onboard-page">
      <div className="onboard-card">
        {/* Progress Tracker */}
        <div className="onboard-progress-header">
          <span className="progress-text">Step {step} of 5</span>
          <div className="progress-dots-row">
            {[1, 2, 3, 4, 5].map(s => (
              <div 
                key={s} 
                className={`progress-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
              ></div>
            ))}
          </div>
        </div>

        {error && (
          <div className="onboard-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Step Content */}
        {step < 5 ? (
          <div className="onboard-step-body">
            <h1 className="onboard-step-title">{currentStepConfig.title}</h1>
            <p className="onboard-step-subtitle">{currentStepConfig.subtitle}</p>

            <div className="onboard-options-grid">
              {currentStepConfig.options.map(opt => {
                const isSelected = selectedValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`onboard-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(currentStepConfig.key, opt.value)}
                  >
                    <div className="option-label-group">
                      <span className="option-label-text">{opt.label}</span>
                      {opt.desc && <span className="option-desc-text">{opt.desc}</span>}
                    </div>
                    {isSelected && <CheckCircle size={18} className="option-selected-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Step 5 - Target Role Text Input */
          <div className="onboard-step-body">
            <div className="step-icon-badge">
              <Sparkles size={24} className="badge-spark-icon" />
            </div>
            <h1 className="onboard-step-title">What role are you targeting?</h1>
            <p className="onboard-step-subtitle">This helps the AI Coach customize interview scenarios and questions for you.</p>

            <form onSubmit={handleSubmit} className="onboard-text-form">
              <div className="text-field-container">
                <input
                  type="text"
                  className="onboard-text-input"
                  placeholder="e.g. Software Engineer, Product Manager"
                  value={answers.target_role}
                  onChange={e => setAnswers(prev => ({ ...prev, target_role: e.target.value }))}
                  disabled={isLoading}
                />
              </div>

              <div className="onboard-footer-actions">
                <button
                  type="button"
                  className="btn btn-secondary onboard-back-btn"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <ArrowLeft size={16} /> Back
                </button>

                <div className="footer-right-actions">
                  <button
                    type="submit"
                    className="btn btn-secondary onboard-skip-btn"
                    disabled={isLoading}
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary onboard-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader size={16} className="spin" /> Submitting...</>
                    ) : (
                      <>Finish <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Global Footer Actions for steps 1-4 */}
        {step < 5 && (
          <div className="onboard-footer-actions">
            {step > 1 ? (
              <button
                type="button"
                className="btn btn-secondary onboard-back-btn"
                onClick={handleBack}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div className="back-btn-spacer"></div>
            )}

            <button
              type="button"
              className="btn btn-primary onboard-next-btn"
              onClick={handleNext}
              disabled={isNextDisabled}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default OnboardingPage;
