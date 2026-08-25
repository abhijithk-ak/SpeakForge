import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import './FinalCTA.css';

/**
 * FinalCTA Component
 * Renders the bottom conversion banner.
 */
function FinalCTA() {
  return (
    <section id="cta" className="cta-section section">
      <div className="container">
        
        {/* Glow behind the CTA card */}
        <div className="cta-glow"></div>
        
        <div className="cta-card glass-panel reveal">
          <h2 className="cta-title">
            Your next interview <br />
            <span className="gradient-text">shouldn't be your practice session.</span>
          </h2>
          
          <p className="cta-subtitle">
            Practice realistic conversations with structured feedback. Set your baseline profile in under 10 minutes, completely free.
          </p>
          
          <div className="cta-actions">
            <Link to="/signup" className="btn btn-primary btn-cta-main" style={{ textDecoration: 'none' }}>
              Start Practicing For Free
            </Link>
          </div>
          
          <div className="cta-footer-info">
            <span>
              <Check size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: 'var(--success)' }} />
              No credit card required
            </span>
            <span className="divider">•</span>
            <span>
              <Check size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: 'var(--success)' }} />
              5 free practice sessions daily
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

export default FinalCTA;
