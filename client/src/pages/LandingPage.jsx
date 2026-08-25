import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProblemSection from '../components/ProblemSection';
import HowItWorks from '../components/HowItWorks';
import PracticeModes from '../components/PracticeModes';
import RealtimeDemo from '../components/RealtimeDemo';
import CommunicationAnalysis from '../components/CommunicationAnalysis';
import ProgressPreview from '../components/ProgressPreview';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

/**
 * LandingPage Page Component
 * Renders the main marketing landing view of SpeakForge.
 * 
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: Function
 */
function LandingPage({ theme, onToggleTheme }) {
  
  useEffect(() => {
    // intersection observer configurations
    const observerOptions = {
      root: null, // relative to the viewport
      rootMargin: '0px 0px -50px 0px', // Trigger slightly before crossing into viewport
      threshold: 0.05 // Responsive lower threshold for snappier mobile reveals
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add 'visible' class to trigger CSS reveal transition
          entry.target.classList.add('visible');
          // Once animated, we don't need to observe it again
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Grab all elements with the 'reveal' or 'reveal-scale' class
    const elementsToReveal = document.querySelectorAll('.reveal, .reveal-scale');
    elementsToReveal.forEach((el) => observer.observe(el));

    // Cleanup observer on component unmount to prevent leaks
    return () => {
      elementsToReveal.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page-wrapper">
      {/* Top sticky Navbar */}
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />

      {/* Main Landing Sections */}
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <PracticeModes />
      <RealtimeDemo />
      <CommunicationAnalysis />
      <ProgressPreview />
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
