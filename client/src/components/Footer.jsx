import React from 'react';
import { AudioLines, ShieldCheck } from 'lucide-react';
import './Footer.css';

/**
 * Footer Component
 * Renders copyright, links, and data privacy notice.
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="container footer-container">
        
        {/* Left Side: Brand & Privacy */}
        <div className="footer-brand-info">
          <div className="footer-logo">
            <AudioLines className="logo-icon-svg" strokeWidth={2} style={{ width: '22px', height: '22px', color: 'var(--primary)', marginRight: '8px' }} />
            <span className="logo-text">Speak<span className="gradient-text">Forge</span></span>
          </div>
          <p className="footer-desc">
            A production-ready voice coaching platform designed to elevate personal communication, mock interview fluency, and situational workplace speaking.
          </p>
          
          {/* Critical Privacy Policy Notice as required by spec */}
          <div className="footer-privacy-note">
            <span className="privacy-note-title">
              <ShieldCheck size={14} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block', color: 'var(--accent)' }} />
              Privacy & Data Isolation
            </span>
            <p>
              Your recordings are processed locally in real time. We do not sell your audio transcripts or training profiles. You retain full control to delete all associated transcripts and account data instantly at any time from your settings page.
            </p>
          </div>
        </div>

        {/* Right Side: Quick Links Lists */}
        <div className="footer-links-grid">
          <div className="footer-links-col">
            <h4 className="links-col-title">Platform</h4>
            <a href="#problem">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#modes">Practice Modes</a>
            <a href="#demo">Realtime Simulator</a>
          </div>
          
          <div className="footer-links-col">
            <h4 className="links-col-title">Resources</h4>
            <a href="#cta">Practice Onboarding</a>
            <a href="#analysis">Assessment metrics</a>
            <a href="#progress">Progress Tracker</a>
          </div>

          <div className="footer-links-col">
            <h4 className="links-col-title">Security</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("SpeakForge uses secure database schemas, session hashes, and environment keys to secure your user profile. Resumes are stored on separate, private layers.")}}>Secured Storage</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("We process real-time voice using encrypted sockets. Local activity detections avoid storing continuous background noise.")}}>Voice Encryption</a>
          </div>
        </div>

      </div>

      {/* Footer Bottom copyright bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <p className="copyright-text">
            &copy; {currentYear} SpeakForge. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service Mockup")}}>Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy Mockup")}}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
