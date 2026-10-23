import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export default function ComplaintFrequencyChart({
  complaints = [],
  totalReviews = 0,
  onViewAll,
  onSelectComplaint
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const maxMentions = complaints.length > 0 ? Math.max(...complaints.map(c => c.count)) : 1;

  // Scale ticks for bottom axis
  const tickStep = Math.max(10, Math.ceil(maxMentions / 5 / 10) * 10);
  const maxTick = Math.max(50, Math.ceil(maxMentions / tickStep) * tickStep);
  const ticks = [0, Math.round(maxTick * 0.2), Math.round(maxTick * 0.4), Math.round(maxTick * 0.6), Math.round(maxTick * 0.8), maxTick];

  return (
    <div className="perf-card">
      <div className="perf-card-header">
        <div className="perf-card-title-group">
          <MessageSquare size={17} strokeWidth={2.2} style={{ color: 'var(--color-negative)' }} className="perf-title-icon" />
          <h2 className="perf-card-title">Most Common Product Complaints</h2>
          <span className="section-label" style={{ color: 'var(--color-negative)', marginLeft: 4 }}>Complaints</span>
        </div>
        <button
          type="button"
          className="perf-btn-link"
          onClick={onViewAll}
          aria-label="View all product complaints"
        >
          View All
        </button>
      </div>

      <div className="perf-card-body">
        {complaints.length === 0 ? (
          <div className="perf-empty-box">No complaints detected in the selected dataset.</div>
        ) : (
          <div className="perf-complaint-chart-container">
            <div className="perf-complaint-list">
              {complaints.slice(0, 8).map((comp, idx) => {
                const barWidth = maxTick > 0 ? Math.min(100, (comp.count / maxTick) * 100) : 0;
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={`${comp.category}-${idx}`}
                    className="perf-complaint-row"
                    onClick={() => onSelectComplaint && onSelectComplaint(comp.category)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    title={`${comp.category}: ${comp.count} mentions (${comp.percentage}% of reviews) across ${comp.affected_products} affected products. Click to inspect in Data table.`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectComplaint && onSelectComplaint(comp.category)}
                    style={{ position: 'relative' }}
                  >
                    <div className="perf-complaint-label" title={comp.category}>
                      {comp.category}
                    </div>
                    <div className="perf-complaint-bar-track">
                      <div
                        className="perf-complaint-bar-fill"
                        style={{
                          width: `${Math.max(3, barWidth)}%`,
                          background: isHovered ? 'var(--color-negative-text)' : 'var(--color-negative)'
                        }}
                      />
                    </div>
                    <div className="perf-complaint-count-label">
                      <strong>{comp.count}</strong>
                      <span className="perf-complaint-pct">({comp.percentage}%)</span>
                    </div>

                    {isHovered && (
                      <div
                        className="perf-chart-tooltip"
                        style={{
                          position: 'absolute',
                          right: '110px',
                          top: '-45px',
                          pointerEvents: 'none',
                          zIndex: 10,
                          minWidth: '220px'
                        }}
                      >
                        <div className="perf-tt-title">{comp.category} Complaints</div>
                        <div className="perf-tt-divider" />
                        <div className="perf-tt-row">
                          <span className="perf-tt-label">Total Mentions:</span>
                          <strong className="perf-tt-val">{comp.count}</strong>
                        </div>
                        <div className="perf-tt-row">
                          <span className="perf-tt-label">Frequency in Reviews:</span>
                          <span className="perf-tt-val" style={{ color: 'var(--color-negative)' }}>{comp.percentage}%</span>
                        </div>
                        <div className="perf-tt-row">
                          <span className="perf-tt-label">Affected Products:</span>
                          <strong className="perf-tt-val">{comp.affected_products} products</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-axis tick marks */}
            <div className="perf-scale-row" style={{ marginTop: 14 }}>
              <div className="perf-complaint-spacer" />
              <div className="perf-scale-ticks">
                {ticks.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>
              <div className="perf-complaint-score-spacer" />
            </div>
            <div className="perf-scale-label">Number of Complaint Mentions</div>
          </div>
        )}
      </div>
    </div>
  );
}
