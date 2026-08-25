import React from 'react';
import './HowItWorks.css';

/**
 * HowItWorks Component
 * Explains the step-by-step cycle of SpeakForge.
 * Simple, linear structure using visual numbering.
 */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "You Speak",
      description: "Answer realistic prompts or conduct mock interviews by speaking naturally into your microphone."
    },
    {
      num: "02",
      title: "AI Listens",
      description: "Our system captures raw verbal delivery: tracking filler-word usage, speaking pace, pauses, and content."
    },
    {
      num: "03",
      title: "AI Responds",
      description: "The coach replies dynamically—redirecting you if you ramble, prompting for examples, or asking tough follow-ups."
    },
    {
      num: "04",
      title: "You Improve",
      description: "Instantly analyze metrics, review feedback excerpts, and trace your progress trend week-over-week."
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works-section section">
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header reveal">
          <span className="section-tag">The Loop</span>
          <h2 className="section-title">How SpeakForge works</h2>
          <p className="section-subtitle">
            A continuous loop of practice, assessment, and adjustment built to mimic human-to-human coaching.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="steps-grid grid-4">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step-item reveal delay-${index + 1}`}
            >
              <div className="step-num-wrapper">
                <span className="step-number gradient-text">{step.num}</span>
                <span className="step-dot"></span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;
