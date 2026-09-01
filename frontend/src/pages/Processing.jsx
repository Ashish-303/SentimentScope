import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';

const STAGES = [
  { label: 'Validating CSV schema' },
  { label: 'Normalizing review text' },
  { label: 'Running sentiment classification' },
  { label: 'Extracting complaints & highlights' },
  { label: 'Compiling analytics dashboard' },
];

export default function Processing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadStatus, uploadError } = useApp();
  const filename = location.state?.filename || 'your file';

  useEffect(() => {
    if (uploadStatus === 'success') navigate('/data', { replace: true });
    else if (uploadStatus === 'error') navigate('/', { replace: true });
    else if (uploadStatus === 'idle') navigate('/', { replace: true });
  }, [uploadStatus, navigate]);

  return (
    <div className="proc-page">
      <div className="proc-card card">
        {/* Spinning arc */}
        <div className="proc-spinner-wrap" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="var(--color-border)" strokeWidth="2" />
            <circle
              cx="28" cy="28" r="26"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="163"
              strokeDashoffset="100"
              style={{
                transformOrigin: '28px 28px',
                animation: 'proc-spin 1.5s linear infinite',
              }}
            />
          </svg>
        </div>

        <h1 className="proc-title">Analyzing your reviews…</h1>

        <p className="proc-file">
          <FileText size={13} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />
          <code>{filename}</code>
        </p>

        <div
          className="loader-indeterminate"
          style={{ margin: '20px 0' }}
          role="progressbar"
          aria-label="Analysis in progress"
          aria-valuetext="Analyzing reviews"
        />

        <div className="proc-stages" role="list" aria-label="Processing stages">
          {STAGES.map(({ label }, i) => (
            <div
              key={label}
              className="proc-stage"
              style={{ animationDelay: `${i * 0.28}s` }}
              role="listitem"
            >
              <span className="stage-icon" aria-hidden="true">
                <Loader2 size={12} strokeWidth={2} className="stage-spinner" />
              </span>
              <span className="stage-label">{label}</span>
            </div>
          ))}
        </div>

        <p className="proc-note">Large datasets may take up to a minute.</p>
      </div>

      <style>{`
        @keyframes proc-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes stage-appear {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes icon-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .stage-spinner { animation: none !important; }
          .proc-spinner-wrap svg { animation: none !important; }
          .proc-stage { animation: none !important; opacity: 1 !important; }
        }
        .proc-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 32px 24px;
        }
        .proc-card {
          max-width: 440px;
          width: 100%;
          padding: 44px 40px;
          text-align: center;
          box-shadow: var(--shadow-md);
        }
        .proc-spinner-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .proc-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--color-text);
          margin-bottom: 10px;
        }
        .proc-file {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-muted);
          font-size: 13px;
          margin-bottom: 0;
          padding: 5px 12px;
          background: var(--color-surface-2);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }
        .proc-file code {
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .proc-stages {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 20px;
        }
        .proc-stage {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 10px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          color: var(--color-text-muted);
          opacity: 0;
          animation: stage-appear 0.35s ease-out forwards;
        }
        .stage-icon { display: flex; align-items: center; flex-shrink: 0; }
        .stage-spinner { animation: icon-spin 0.9s linear infinite; color: var(--color-primary); }
        .stage-label { }
        .proc-note {
          font-size: 12px;
          color: var(--color-text-subtle);
        }
      `}</style>
    </div>
  );
}
