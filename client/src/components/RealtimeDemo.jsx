import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import './RealtimeDemo.css';

/**
 * RealtimeDemo Component
 * Demonstrates the core real-time voice interface design.
 * Teaches React state, events, and dynamic list rendering.
 */
function RealtimeDemo() {
  const personalities = [
    {
      id: "friendly",
      name: "Friendly Coach",
      description: "Supportive, encouraging, and patient. Focuses on base confidence.",
      prompt: '"Take your time. Let\'s start with your background—what got you into this field, and what projects are you most proud of?"',
      status: "Listening patiently...",
      statusColor: "#22C55E"
    },
    {
      id: "professional",
      name: "Professional Interviewer",
      description: "Structured, realistic, and objective. Simulates typical corporate screenings.",
      prompt: '"Please walk me through your professional background, focusing on the roles and technical challenges that prepare you for this role."',
      status: "Awaiting response...",
      statusColor: "#F59E0B"
    },
    {
      id: "strict",
      name: "Strict Interviewer",
      description: "Direct, time-conscious, and less forgiving. Mimics stress screenings.",
      prompt: '"Introduce yourself. Keep your answer under two minutes, focusing strictly on direct metrics and project impacts."',
      status: "Evaluating response length...",
      statusColor: "#EF4444"
    }
  ];

  // React State to track which personality is currently active/selected by the user
  const [activeId, setActiveId] = useState("friendly");

  // Retrieve the selected personality object
  const activeCoach = personalities.find(p => p.id === activeId);

  return (
    <section id="demo" className="demo-section section">
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header reveal">
          <span className="section-tag">Interactive Preview</span>
          <h2 className="section-title">Experience realtime coaching</h2>
          <p className="section-subtitle">
            Toggle between different coach personalities below to see how they adapt their prompts and behavior.
          </p>
        </div>

        {/* Demo Grid Layout */}
        <div className="demo-grid grid-2">
          
          {/* Left Column: Personality Selector list */}
          <div className="personality-selector reveal delay-1">
            <h3 className="selector-title">Select a Coach Personality</h3>
            <div className="personality-list">
              {personalities.map((coach) => (
                <button
                  key={coach.id}
                  className={`personality-btn card ${activeId === coach.id ? 'active' : ''}`}
                  onClick={() => setActiveId(coach.id)}
                >
                  <div className="selector-btn-header">
                    <span className="coach-name">{coach.name}</span>
                    {activeId === coach.id && <span className="active-dot"></span>}
                  </div>
                  <p className="coach-desc">{coach.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Simulated Voice Console */}
          <div className="voice-console-wrapper reveal delay-2">
            <div className="voice-console glass-panel">
              
              {/* Console Header */}
              <div className="console-header">
                <span 
                  className="status-indicator"
                  style={{ 
                    backgroundColor: activeCoach.statusColor,
                    boxShadow: `0 0 10px ${activeCoach.statusColor}`
                  }}
                ></span>
                <span className="status-text">{activeCoach.status}</span>
              </div>

              {/* Dynamic Waveform Graphic */}
              <div className="console-visualizer">
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
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </div>
              </div>

              {/* Dynamic Coach Text Prompt */}
              <div className="console-dialogue">
                <span className="speaker-tag">{activeCoach.name}</span>
                <p className="dialogue-bubble">{activeCoach.prompt}</p>
              </div>

              {/* Controls Footer */}
              <div className="console-footer">
                <div className="mic-button-mock">
                  <Mic size={16} style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }} />
                  Click and Speak (Marketing preview)
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default RealtimeDemo;
