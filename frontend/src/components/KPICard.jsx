import React from 'react';

export default function KPICard({ label, value, icon: Icon, color, subtitle, description }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-label section-label">{label}</span>
        {Icon && (
          <span className="kpi-icon-wrap" aria-hidden="true">
            <Icon size={14} strokeWidth={2} style={{ color: color || 'var(--color-text-muted)' }} />
          </span>
        )}
      </div>
      <div className="kpi-value tabular" style={{ color: color || 'var(--color-text)' }}>
        {value ?? '—'}
      </div>
      {(subtitle || description) && (
        <div className="kpi-meta">
          {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
          {description && <span className="kpi-description">{description}</span>}
        </div>
      )}
      <style>{`
        .kpi-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xs);
          padding: 16px 18px;
          transition:
            box-shadow var(--t-fast),
            transform var(--t-fast);
        }
        .kpi-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .kpi-label { line-height: 1; }
        .kpi-icon-wrap {
          width: 24px;
          height: 24px;
          background: var(--color-surface-2);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-value {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .kpi-meta { display: flex; flex-direction: column; gap: 1px; }
        .kpi-subtitle {
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .kpi-description {
          font-size: 11px;
          color: var(--color-text-subtle);
        }
      `}</style>
    </div>
  );
}
