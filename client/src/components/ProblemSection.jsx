import React from 'react';
import { Brain, Hourglass, MessageSquare, AlertTriangle } from 'lucide-react';
import './ProblemSection.css';

/**
 * ProblemSection Component
 * Highlights the main struggles SpeakForge helps users overcome.
 * Demonstrates value through relatable user communication friction points.
 */
function ProblemSection() {
  const problems = [
    {
      icon: <Brain className="problem-icon-svg" strokeWidth={1.8} />,
      title: "The Mind Blank",
      quote: '"I know the answer, but under pressure, I just can\'t find the words."',
      description: "When stress rises, recall slows. You know the concepts, but your vocabulary fails to align in real time."
    },
    {
      icon: <Hourglass className="problem-icon-svg" strokeWidth={1.8} />,
      title: "The Ramble",
      quote: '"I start explaining, but I lose structure and don\'t know how to conclude."',
      description: "You speak without a mental map, repeating points and diluting your message instead of being concise."
    },
    {
      icon: <MessageSquare className="problem-icon-svg" strokeWidth={1.8} />,
      title: "The Filler Loop",
      quote: '"My pauses are filled with \'umm\', \'like\', and \'actually\' instead of confident silence."',
      description: "Filler words creep in to mask natural planning pauses, signaling anxiety to listeners."
    },
    {
      icon: <AlertTriangle className="problem-icon-svg" strokeWidth={1.8} />,
      title: "The Follow-Up Panic",
      quote: '"I prepare standard answers but freeze when challenged with unexpected questions."',
      description: "You rely on scripted responses. When interviewers probe deeper or disagree, you struggle to adapt."
    }
  ];

  return (
    <section id="problem" className="problem-section section">
      <div className="container">
        
        {/* Section Title */}
        <div className="section-header reveal">
          <span className="section-tag">The Friction</span>
          <h2 className="section-title">
            Interviews aren't just about what you know.
          </h2>
          <p className="section-subtitle">
            They're about how you communicate under pressure. SpeakForge targets the exact points where your delivery breaks down.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="problems-grid grid-2">
          {problems.map((prob, index) => (
            <div 
              key={index} 
              className={`problem-card card reveal-scale delay-${(index % 2) + 1}`}
            >
              <div className="problem-icon">{prob.icon}</div>
              <h3 className="problem-title">{prob.title}</h3>
              <blockquote className="problem-quote">{prob.quote}</blockquote>
              <p className="problem-desc">{prob.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default ProblemSection;
