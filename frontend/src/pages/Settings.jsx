import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Info, Laptop, Check } from 'lucide-react';

const INFO_ROWS = [
  { label: 'Application', value: 'SentimentScope' },
  { label: 'Frontend Framework', value: 'React 18 + Vite 5' },
  { label: 'Backend Server', value: 'Flask 3 + Scikit-Learn' },
  { label: 'Active Classifier', value: 'Logistic Regression (C=1.0, balanced)' },
  { label: 'Feature Extractor', value: 'TF-IDF (15k) + Chi² (10k)' },
  { label: 'Validation Framework', value: 'Wilcoxon + Holm FWE Parity' },
  { label: 'Current Release Phase', value: 'Phase 8.4 — Dual Theme Redesign' },
];

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Preferences and environment information for SentimentScope</p>
      </div>

      {/* Appearance Segmented Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sun size={15} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
            <span className="card-title">Interface Appearance</span>
          </div>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>
            Customize the look and feel of the platform by choosing a visual theme profile.
          </p>

          <div className="segmented-theme-container">
            {/* Dark Intelligence Option */}
            <button
              className={`theme-segment-btn${isDark ? ' active' : ''}`}
              onClick={() => !isDark && toggleTheme()}
              aria-label="Switch to Dark Intelligence theme"
              id="segment-dark-theme"
            >
              <div className="segment-preview dark-preview">
                <div className="preview-glow-1" />
                <div className="preview-glow-2" />
                <div className="preview-sidebar" />
                <div className="preview-content">
                  <div className="preview-card" />
                  <div className="preview-card" />
                </div>
              </div>
              <div className="segment-label-wrap">
                <Moon size={13} />
                <span className="segment-title">Dark Intelligence</span>
                {isDark && <Check size={12} className="segment-check" />}
              </div>
            </button>

            {/* Light Research Option */}
            <button
              className={`theme-segment-btn${!isDark ? ' active' : ''}`}
              onClick={() => isDark && toggleTheme()}
              aria-label="Switch to Light Research theme"
              id="segment-light-theme"
            >
              <div className="segment-preview light-preview">
                <div className="preview-sidebar" />
                <div className="preview-content">
                  <div className="preview-card" />
                  <div className="preview-card" />
                </div>
              </div>
              <div className="segment-label-wrap">
                <Sun size={13} />
                <span className="segment-title">Light Research</span>
                {!isDark && <Check size={12} className="segment-check" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Laptop size={15} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
            <span className="card-title">System & Environment</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '6px 20px' }}>
          {INFO_ROWS.map(({ label, value }, i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < INFO_ROWS.length - 1 ? '1px solid var(--color-border)' : 'none',
                fontSize: 13,
                gap: 12,
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .segmented-theme-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 480px) {
          .segmented-theme-container { grid-template-columns: 1fr; }
        }

        .theme-segment-btn {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
          align-items: stretch;
          transition: border-color var(--t-fast), box-shadow var(--t-fast);
        }
        .theme-segment-btn:hover {
          border-color: var(--color-border-strong);
        }
        .theme-segment-btn.active {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-muted);
          background: var(--color-surface);
        }

        /* Previews mimic dashboard layouts */
        .segment-preview {
          height: 80px;
          border-radius: var(--radius-sm);
          position: relative;
          overflow: hidden;
          border: 1px solid var(--color-border);
          display: flex;
        }

        .dark-preview {
          background: #050812;
        }
        .dark-preview .preview-sidebar { background: #0a1020; border-right: 1px solid rgba(255,255,255,0.04); }
        .dark-preview .preview-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
        .dark-preview .preview-glow-1 {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 70% 20%, rgba(79, 124, 255, 0.15), transparent 60%);
        }
        .dark-preview .preview-glow-2 {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 80%, rgba(124, 92, 255, 0.1), transparent 50%);
        }

        .light-preview {
          background: #f4f6f9;
        }
        .light-preview .preview-sidebar { background: #ebf0f6; border-right: 1px solid rgba(0,0,0,0.06); }
        .light-preview .preview-card { background: #ffffff; border: 1px solid rgba(0,0,0,0.06); }

        .preview-sidebar {
          width: 24px;
          flex-shrink: 0;
          height: 100%;
        }
        .preview-content {
          flex: 1;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .preview-card {
          flex: 1;
          border-radius: 3px;
        }

        /* Label Wrap */
        .segment-label-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: var(--color-text-secondary);
          font-size: 13px;
          padding: 0 4px;
        }
        .theme-segment-btn.active .segment-label-wrap {
          color: var(--color-text);
        }
        .segment-title {
          flex: 1;
        }
        .segment-check {
          color: var(--color-primary);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
