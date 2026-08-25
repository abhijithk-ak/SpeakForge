import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import './CommunicationAnalysis.css';

/**
 * CommunicationAnalysis Component
 * The interactive "wow" section showing real-time feedback scores count-up.
 * Teaches:
 * - IntersectionObserver integration for event triggering
 * - Custom React count-up animations using setInterval
 * - Dynamic inline CSS widths for progress bars
 */
function CommunicationAnalysis() {
  // Score states
  const [scores, setScores] = useState({
    clarity: 0,
    fluency: 0,
    structure: 0,
    conciseness: 0
  });
  
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Setup observer to watch when section enters viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateScores();
        }
      },
      { threshold: 0.15 } // Triggers when 15% of the section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hasAnimated]);

  // Interpolate scores from 0 to targets over 1.2 seconds
  const animateScores = () => {
    const targets = { clarity: 78, fluency: 71, structure: 84, conciseness: 62 };
    const duration = 1200; // Total animation length in ms
    const frames = 40; // Number of ticks
    const intervalTime = duration / frames;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      
      setScores({
        clarity: Math.min(Math.round((targets.clarity / frames) * frame), targets.clarity),
        fluency: Math.min(Math.round((targets.fluency / frames) * frame), targets.fluency),
        structure: Math.min(Math.round((targets.structure / frames) * frame), targets.structure),
        conciseness: Math.min(Math.round((targets.conciseness / frames) * frame), targets.conciseness)
      });

      if (frame >= frames) {
        clearInterval(timer);
      }
    }, intervalTime);
  };

  return (
    <section id="analysis" ref={sectionRef} className="analysis-section section">
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header reveal">
          <span className="section-tag">Evaluation</span>
          <h2 className="section-title">See what the coach actually hears</h2>
          <p className="section-subtitle">
            SpeakForge extracts underlying communication signals from your voice feed, mapping them to clear metrics.
          </p>
        </div>

        {/* Main Grid */}
        <div className="analysis-grid grid-2">
          
          {/* Left Column: Simulated Speech feed showing user transcript friction */}
          <div className="sim-speech-box card reveal delay-1">
            <div className="speech-box-header">
              <span className="live-pill"></span>
              <span className="speech-status">Recorded Feed Transcript</span>
            </div>
            
            <div className="speech-content-bubble">
              <p>
                "I think, <span className="highlight-filler">umm</span>, I would make a good candidate because, <span className="highlight-filler">like</span>, I <span className="highlight-filler">actually</span> have three years of React experience... <span className="highlight-pause">[4.2s pause]</span> ...and yeah, that's it."
              </p>
            </div>
            
            <div className="detected-fillers">
              <div className="filler-metric">
                <span className="filler-name">"umm"</span>
                <span className="filler-count">1x</span>
              </div>
              <div className="filler-metric">
                <span className="filler-name">"like"</span>
                <span className="filler-count">1x</span>
              </div>
              <div className="filler-metric">
                <span className="filler-name">"actually"</span>
                <span className="filler-count">1x</span>
              </div>
              <div className="filler-metric highlight-warning">
                <span className="filler-name">Long Pause</span>
                <span className="filler-count">4.2s</span>
              </div>
            </div>
          </div>

          {/* Right Column: Score progress bars + advice */}
          <div className="analysis-metrics-panel card reveal delay-2">
            <h3 className="metrics-panel-title">Session Analysis Metrics</h3>
            
            <div className="metrics-list">
              {/* Clarity */}
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-label">
                    Clarity <span className="label-badge badge-ai" title="AI-Evaluated metric">AI</span>
                  </span>
                  <span className="metric-value">{scores.clarity}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${scores.clarity}%` }}></div>
                </div>
              </div>

              {/* Fluency */}
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-label">
                    Fluency <span className="label-badge badge-direct" title="Directly measured metric">Direct</span>
                  </span>
                  <span className="metric-value">{scores.fluency}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${scores.fluency}%` }}></div>
                </div>
              </div>

              {/* Structure */}
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-label">
                    Structure <span className="label-badge badge-ai" title="AI-Evaluated metric">AI</span>
                  </span>
                  <span className="metric-value">{scores.structure}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${scores.structure}%` }}></div>
                </div>
              </div>

              {/* Conciseness */}
              <div className="metric-row">
                <div className="metric-info">
                  <span className="metric-label">
                    Conciseness <span className="label-badge badge-direct" title="Directly measured metric">Direct</span>
                  </span>
                  <span className="metric-value">{scores.conciseness}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${scores.conciseness}%` }}></div>
                </div>
              </div>
            </div>

            {/* Actionable Coach Advice */}
            <div className="coach-advice-box">
              <span className="advice-title">
                <Sparkles size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: 'var(--accent)' }} />
                Actionable Advice
              </span>
              <p className="advice-text">
                "Try being more concise. Your introduction is 45 seconds longer than average, with trailing arguments. When pausing to think, maintain eye contact and hold a confident silence rather than filling it with 'umm'."
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default CommunicationAnalysis;
