import React from 'react';
import './ProgressPreview.css';

/**
 * ProgressPreview Component
 * Displays long-term improvement metrics and a lightweight SVG line graph.
 * Teaches:
 * - Embedding styled SVGs for lightweight charting
 * - Presenting structured metrics comparison
 */
function ProgressPreview() {
  const metrics = [
    {
      label: "Clarity",
      initial: 61,
      current: 74,
      diff: "+13",
      description: "Better articulation, fewer trailing sentences."
    },
    {
      label: "Fluency",
      initial: 58,
      current: 69,
      diff: "+11",
      description: "Reduced filler word usage and natural pausing."
    },
    {
      label: "Structure",
      initial: 52,
      current: 73,
      diff: "+21",
      description: "Better response sequencing (Situation, Action, Result)."
    }
  ];

  return (
    <section id="progress" className="progress-section section">
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header reveal">
          <span className="section-tag">Long-Term Impact</span>
          <h2 className="section-title">Track your growth over time</h2>
          <p className="section-subtitle">
            Consistent practice translates to permanent changes. Watch your core metrics climb as your habits transform.
          </p>
        </div>

        {/* Dashboard Preview Layout */}
        <div className="progress-grid grid-2">
          
          {/* Left Column: List of Improving Metrics */}
          <div className="metrics-comparison-panel reveal delay-1">
            <h3 className="comparison-title">Core Competencies</h3>
            
            <div className="comparison-list">
              {metrics.map((m, idx) => (
                <div key={idx} className="comparison-card card">
                  <div className="comp-card-header">
                    <span className="comp-label">{m.label}</span>
                    <span className="comp-diff">{m.diff}</span>
                  </div>
                  
                  <div className="comp-flow">
                    <span className="comp-val val-initial">{m.initial}</span>
                    <span className="comp-arrow">➔</span>
                    <span className="comp-val val-current gradient-text">{m.current}</span>
                  </div>
                  
                  <p className="comp-desc">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Chart View Mockup */}
          <div className="chart-preview-card card reveal-scale delay-2">
            <div className="chart-header">
              <span className="chart-title">Session-over-Session Performance</span>
              <span className="chart-tag">Last 10 sessions</span>
            </div>
            
            {/* Inline SVG Chart */}
            <div className="chart-body">
              <svg viewBox="0 0 400 180" className="trend-svg" aria-label="Line chart showing progress trend">
                <defs>
                  {/* Gradient Area Fill */}
                  <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="0" y1="36" x2="400" y2="36" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="144" x2="400" y2="144" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Shaded Area Under Line */}
                <path 
                  d="M 10 144 Q 50 140, 90 120 T 170 95 T 250 72 T 330 46 L 390 36 L 390 180 L 10 180 Z" 
                  fill="url(#chartAreaGrad)" 
                />

                {/* Line Path */}
                <path 
                  d="M 10 144 Q 50 140, 90 120 T 170 95 T 250 72 T 330 46 L 390 36" 
                  fill="none" 
                  stroke="var(--primary)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                />

                {/* Highlight Data Points */}
                <circle cx="90" cy="120" r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2.5" />
                <circle cx="250" cy="72" r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2.5" />
                <circle cx="390" cy="36" r="6" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Chart Legend */}
            <div className="chart-footer">
              <div className="legend-item">
                <span className="legend-dot color-initial"></span>
                <span>Session 1 (Baseline)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot color-current"></span>
                <span>Session 10 (Current)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default ProgressPreview;
