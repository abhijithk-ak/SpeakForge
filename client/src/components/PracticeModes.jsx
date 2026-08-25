import React from 'react';
import { Briefcase, Clock, MessageSquare, Users, Handshake } from 'lucide-react';
import './PracticeModes.css';

/**
 * PracticeModes Component
 * Lists the current and future conversational modes of SpeakForge.
 * Teaches modular rendering and conditional styling for tags (e.g., active vs coming soon).
 */
function PracticeModes() {
  const modes = [
    {
      title: "Mock Interview",
      tag: "Active",
      isComingSoon: false,
      icon: <Briefcase className="mode-icon-svg" strokeWidth={1.8} />,
      description: "Practice structured answers for HR, behavioral, or role-based prompts. Handles unexpected follow-ups."
    },
    {
      title: "2-Minute Speech",
      tag: "Active",
      isComingSoon: false,
      icon: <Clock className="mode-icon-svg" strokeWidth={1.8} />,
      description: "Receive a random prompt, prepare for 60 seconds, and deliver a clean 2-minute speech on structure and fluency."
    },
    {
      title: "Communication Practice",
      tag: "Active",
      isComingSoon: false,
      icon: <MessageSquare className="mode-icon-svg" strokeWidth={1.8} />,
      description: "Tackle opinion questions, situational queries, or explain technical topics to absolute beginners."
    },
    {
      title: "Group Discussion",
      tag: "Coming Soon",
      isComingSoon: true,
      icon: <Users className="mode-icon-svg" strokeWidth={1.8} />,
      description: "Navigate discussions alongside multiple AI entities with distinct temperaments (contrarian, aggresive, passive)."
    },
    {
      title: "Client Communication",
      tag: "Coming Soon",
      isComingSoon: true,
      icon: <Handshake className="mode-icon-svg" strokeWidth={1.8} />,
      description: "Practice explaining project delays, handling upset feedback, or setting technical expectations."
    }
  ];

  return (
    <section id="modes" className="modes-section section">
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header reveal">
          <span className="section-tag">Modes</span>
          <h2 className="section-title">Designed for every scenario</h2>
          <p className="section-subtitle">
            Whether preparing for a job interview, delivering a public speech, or presenting to a difficult client.
          </p>
        </div>

        {/* Modes Grid */}
        <div className="modes-grid grid-3">
          {modes.map((mode, index) => (
            <div 
              key={index} 
              className={`mode-card card reveal-scale delay-${(index % 3) + 1} ${mode.isComingSoon ? 'coming-soon' : ''}`}
            >
              <div className="mode-card-header">
                <span className="mode-icon">{mode.icon}</span>
                <span className={`mode-tag ${mode.isComingSoon ? 'tag-soon' : 'tag-active'}`}>
                  {mode.tag}
                </span>
              </div>
              <h3 className="mode-title">{mode.title}</h3>
              <p className="mode-desc">{mode.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default PracticeModes;
