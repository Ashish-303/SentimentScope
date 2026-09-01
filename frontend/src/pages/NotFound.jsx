import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="nf-page">
      <div className="nf-content">
        <div className="nf-icon" aria-hidden="true">
          <HelpCircle size={40} strokeWidth={1.25} />
        </div>
        <h1 className="nf-code">404</h1>
        <h2 className="nf-title">Page not found</h2>
        <p className="nf-text">
          The page you are looking for doesn't exist or has been moved to another URL.
        </p>
        <div className="nf-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            id="not-found-home-btn"
          >
            Go to Home
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            id="not-found-back-btn"
            style={{ gap: 6 }}
          >
            <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
            Go back
          </button>
        </div>
      </div>

      <style>{`
        .nf-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 75vh;
          padding: 32px 24px;
        }
        .nf-content {
          max-width: 400px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .nf-icon {
          color: var(--color-text-subtle);
          margin-bottom: 16px;
        }
        .nf-code {
          font-size: 64px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          color: var(--color-text);
          margin-bottom: 6px;
        }
        .nf-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }
        .nf-text {
          font-size: 13px;
          color: var(--color-text-muted);
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .nf-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
