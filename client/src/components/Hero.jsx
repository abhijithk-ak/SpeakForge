import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Play, ArrowRight, Mic } from 'lucide-react';
import './Hero.css';

/**
 * Cinematic Hero Component - Refined Layout & Scaling
 * 
 * Implements a content-driven responsive layout:
 * - Desktop: Compact visual capsule (reduced footprint by ~20%) positioned next to the content.
 * - Mobile: Large visual hidden; replaced with a compact horizontal status bar below the CTA.
 * - Staggered entrance transitions triggered on mount using CSS classes.
 * - Structurally correct curved transition at the absolute bottom of the container.
 */
function Hero() {
  const [coachState, setCoachState] = useState('listening'); // 'listening' | 'thinking' | 'speaking'
  const [activePrompt, setActivePrompt] = useState('Tell me about yourself.');
  const [animateLoad, setAnimateLoad] = useState(false);

  // Trigger loading sequence animations shortly after mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateLoad(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Cycle through mock states to demonstrate visual reactions
  useEffect(() => {
    const stateCycle = [
      { state: 'listening', prompt: 'Tell me about yourself.' },
      { state: 'thinking', prompt: 'Analyzing structure...' },
      { state: 'speaking', prompt: 'Can you provide a metric-driven example?' }
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % stateCycle.length;
      setCoachState(stateCycle[currentIndex].state);
      setActivePrompt(stateCycle[currentIndex].prompt);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={`hero-section ${animateLoad ? 'animate-load' : ''}`}>
      {/* 1. Background Layers */}
      <div className="hero-bg-grid"></div>
      <div className="hero-glow-purple"></div>
      <div className="hero-glow-cyan"></div>

      {/* 2. Main Hero Content Layout */}
      <div className="container hero-container">
        
        {/* Left Side: Typography Content */}
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Sparkles className="eyebrow-icon" size={13} />
            <span>AI-POWERED VOICE COACH PLATFORM</span>
          </div>

          <h1 className="hero-headline">
            Speak with confidence.<br />
            <span className="gradient-text">Under pressure.</span>
          </h1>

          <p className="hero-supporting">
            Practice real conversations with an AI coach that listens, responds, and redirects you in real time. Master interviews, public speaking, and client calls.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary btn-hero-cta">
              Start Practicing <ArrowRight size={15} style={{ marginLeft: '6px' }} />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-hero-secondary">
              <Play size={12} fill="currentColor" style={{ marginRight: '6px' }} /> See how it works
            </a>
          </div>

          {/* Mobile-Only: Compact horizontal status visualizer */}
          <div className={`mobile-voice-status-bar ${coachState}`}>
            <div className="mobile-badge-wrapper">
              <span className="mobile-badge-pulse"></span>
              <span className="mobile-status-label">AI COACH: {coachState}</span>
            </div>
            
            <div className="mobile-waveform-mini">
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
              <div className="waveform-bar"></div>
            </div>

            <div className="mobile-prompt-container">
              <span className="mobile-dialogue-prompt">"{activePrompt}"</span>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Capsule (Desktop/Tablet only) */}
        <div className="hero-visual-container">
          <div className={`spatial-visualizer-capsule ${coachState}`}>
            {/* Ambient dashed outer line */}
            <div className="capsule-particle-ring"></div>
            
            {/* Holographic state orb */}
            <div className="capsule-core">
              <div className="core-orb">
                <Mic size={18} className="core-mic-svg" />
              </div>
              <div className="pulse-ripple ripple-1"></div>
              <div className="pulse-ripple ripple-2"></div>
              <div className="pulse-ripple ripple-3"></div>
            </div>

            {/* Coach data indicators */}
            <div className="capsule-info">
              <div className="capsule-header">
                <span className="capsule-badge-pulse"></span>
                <span className="capsule-status-text">AI COACH • {coachState}</span>
              </div>

              {/* Waveform */}
              <div className="capsule-waveform">
                <div className="waveform-container">
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </div>
              </div>

              {/* Prompts bubble */}
              <div className="capsule-dialogue-bubble">
                <p className="dialogue-prompt">{activePrompt}</p>
              </div>

              <div className="capsule-footer-coach">
                <span className="footer-personality-label">Interactive Preview</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Transition: Curved double-arc horizon SVG */}
      <div className="hero-transition">
        <svg className="hero-horizon-svg" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,150 Q360,60 720,60 T1440,150" stroke="url(#waveGrad)" strokeWidth="2.5" fill="none" />
          <path d="M0,160 Q360,90 720,90 T1440,160" stroke="url(#waveGrad2)" strokeWidth="1.2" fill="none" />
          <path d="M0,170 Q360,120 720,120 T1440,170" stroke="url(#waveGrad3)" strokeWidth="0.8" fill="none" strokeDasharray="5 5" />
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0"/>
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.75"/>
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0"/>
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0"/>
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 4. Minimal Scroll Indicator */}
      <div className="hero-scroll-indicator">
        <span className="scroll-text">Scroll to explore</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  );
}

export default Hero;
