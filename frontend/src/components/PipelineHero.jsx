import React from 'react';
import { FileText, Cpu, BarChart3 } from 'lucide-react';

export default function PipelineHero() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="pipeline-hero-wrap" aria-label="SentimentScope ML processing pipeline diagram">
      <div className="pipeline-container">
        {/* SVG connection beams */}
        <svg className="pipeline-svg" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/http://www.w3.org/2000/svg">
          {/* Paths connecting left to center, center to right */}
          <path
            d="M 60 60 H 340"
            stroke="var(--color-border-strong)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Animated beam overlay */}
          {!prefersReducedMotion && (
            <path
              d="M 60 60 H 340"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              className="pipeline-beam"
            />
          )}
        </svg>

        {/* Node 1: CSV / Review Data */}
        <div className="pipeline-node node-left" title="Input Review CSV">
          <div className="node-icon-container">
            <FileText size={20} strokeWidth={1.75} />
          </div>
          <span className="node-label">Review Data</span>
          <span className="node-sublabel">CSV Format</span>
        </div>

        {/* Node 2: AI / Logistic Regression (Center, large, pulsing) */}
        <div className="pipeline-node node-center" title="SentimentScope AI Model">
          <div className="node-glow-ring" />
          <div className="node-icon-container center-container">
            <Cpu size={28} strokeWidth={1.5} />
          </div>
          <span className="node-label">SentimentScope AI</span>
          <span className="node-sublabel">Logistic Regression</span>
        </div>

        {/* Node 3: Analytics / Insights */}
        <div className="pipeline-node node-right" title="Operational Insights Output">
          <div className="node-icon-container">
            <BarChart3 size={20} strokeWidth={1.75} />
          </div>
          <span className="node-label">Business Insights</span>
          <span className="node-sublabel">Aspect Highlights</span>
        </div>
      </div>

      <style>{`
        .pipeline-hero-wrap {
          width: 100%;
          max-width: 600px;
          margin: 40px auto;
          position: relative;
        }
        .pipeline-container {
          position: relative;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
        }
        .pipeline-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }
        
        /* Nodes */
        .pipeline-node {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .node-icon-container {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-surface);
          border: 2.5px solid var(--color-border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          transition:
            border-color var(--t-fast) var(--ease-out),
            color var(--t-fast) var(--ease-out),
            transform var(--t-fast) var(--ease-out),
            box-shadow var(--t-fast) var(--ease-out);
        }
        .pipeline-node:hover .node-icon-container {
          border-color: var(--color-primary);
          color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 110, 247, 0.15);
        }
        
        /* Node Center specific styling */
        .center-container {
          width: 64px;
          height: 64px;
          background: var(--color-surface);
          border-color: var(--color-primary);
          color: var(--color-primary);
          box-shadow: 0 0 20px rgba(79, 110, 247, 0.15);
        }
        .node-glow-ring {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 1.5px solid rgba(79, 110, 247, 0.3);
          z-index: -1;
          pointer-events: none;
          opacity: 0.8;
          animation: centerPulse 3s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        
        .node-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          margin-top: 10px;
          letter-spacing: -0.01em;
        }
        .node-sublabel {
          font-size: 11px;
          color: var(--color-text-subtle);
          margin-top: 2px;
          font-weight: 500;
        }
        
        @keyframes centerPulse {
          0% {
            transform: translateX(-50%) scale(0.85);
            opacity: 0.9;
          }
          50% {
            transform: translateX(-50%) scale(1.15);
            opacity: 0.2;
          }
          100% {
            transform: translateX(-50%) scale(0.85);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .node-glow-ring {
            animation: none !important;
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
