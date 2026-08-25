import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Mic, Users, Users2, Clock, BarChart } from 'lucide-react';
import './DashboardPage.css'; // Reuse container and card panels
import './PageStubs.css'; // Reuse button sizing

function PracticePage() {
  const navigate = useNavigate();

  const activeModes = [
    {
      id: 'interview',
      title: 'Mock Interview',
      desc: 'Simulate full professional job interviews tailored to your targeted role and background. The AI Coach will ask realistic behavioral and technical questions, adapt based on your answers, and follow up dynamically.',
      metrics: ['Answer Structure (STAR)', 'Technical Depth', 'Clarity & Confidence', 'Pace & Filler Words'],
      duration: '10–15 min',
      icon: <Briefcase size={22} />,
      glowClass: 'purple-glow',
      path: '/practice/interview'
    },
    {
      id: 'speech',
      title: '2-Minute Speech',
      desc: 'Master spontaneous speaking and eliminate filler words. Select a topic category or get a random prompt, take 30 seconds to prepare, and speak for 2 full minutes while the coach tracks your real-time speech analytics.',
      metrics: ['Fluency & Flow', 'Filler Word Frequency', 'Vocabulary Variety', 'Pacing Consistency'],
      duration: '3–5 min',
      icon: <Mic size={22} />,
      glowClass: 'cyan-glow',
      path: '/practice/speech'
    },
    {
      id: 'client',
      title: 'Client Communication',
      desc: 'Navigate difficult client relationships and project standups. Practice delivering code delays, explaining architectural tradeoffs, negotiating features, or addressing server outages with an demanding, realistic client persona.',
      metrics: ['Diplomacy & Empathy', 'Professional Tone', 'Active Listening', 'Relevance & Depth'],
      duration: '8–10 min',
      icon: <Users size={22} />,
      glowClass: 'emerald-glow',
      path: '/practice/client'
    }
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: '960px' }}>
      
      <header className="dashboard-header">
        <h1 className="dashboard-title">Choose a Practice Mode</h1>
        <p className="dashboard-subtitle">Select the format that fits your communication goals. Each mode features custom AI coaching agents.</p>
      </header>

      <div className="practice-detail-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
        
        {/* Active Practice Modes */}
        {activeModes.map((mode) => (
          <div key={mode.id} className="mode-detail-row card-panel" style={{ display: 'flex', gap: '24px', position: 'relative' }}>
            <div className="mode-left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              
              <div className="mode-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`mode-icon-wrapper ${mode.glowClass}`} style={{ width: '44px', height: '44px', borderRadius: '10px' }}>
                  {mode.icon}
                </div>
                <h2 className="mode-card-title" style={{ fontSize: '18px' }}>{mode.title}</h2>
              </div>

              <p className="mode-card-desc" style={{ fontSize: '14px', lineHeight: '1.6' }}>{mode.desc}</p>

              <div className="mode-meta-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '8px' }}>
                <div className="meta-footer-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Clock size={15} />
                  <span>{mode.duration}</span>
                </div>
                <div className="meta-footer-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <BarChart size={15} />
                  <span>Interactive Real-time Feedback</span>
                </div>
              </div>

            </div>

            <div className="mode-right-panel" style={{ width: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px', flexShrink: 0 }}>
              
              <div className="eval-metrics-group">
                <span className="section-heading-label" style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>Tracks</span>
                <ul className="eval-metrics-list" style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {mode.metrics.map((metric, idx) => (
                    <li key={idx} style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={() => navigate(mode.path)}
                style={{ width: '100%', marginTop: '16px' }}
              >
                Start Practice
              </button>

            </div>
          </div>
        ))}

        {/* Coming Soon Mode */}
        <div className="mode-detail-row card-panel mode-card-coming-soon" style={{ display: 'flex', gap: '24px', opacity: 0.5 }}>
          <div className="mode-left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div className="mode-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="mode-icon-wrapper gray-glow" style={{ width: '44px', height: '44px', borderRadius: '10px' }}>
                <Users2 size={22} />
              </div>
              <h2 className="mode-card-title" style={{ fontSize: '18px' }}>Group Discussion</h2>
            </div>
            <p className="mode-card-desc" style={{ fontSize: '14px', lineHeight: '1.6' }}>Participate in team mock meetings, architectural standups, or hot debates. Learn to present ideas structured under group pressure, interrupt politely, and handle conflicts.</p>
          </div>
          <div className="mode-right-panel" style={{ width: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px', flexShrink: 0 }}>
            <span className="coming-soon-badge" style={{ alignSelf: 'center', fontSize: '12px', padding: '6px 12px' }}>Coming Soon</span>
          </div>
        </div>

      </div>

      {/* Responsive overrides block */}
      <style>{`
        @media (max-width: 768px) {
          .mode-detail-row {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .mode-right-panel {
            width: 100% !important;
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid var(--border-color) !important;
            padding-top: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PracticePage;
