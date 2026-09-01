import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UploadCloud } from 'lucide-react';

export default function ErrorState({ title, message, onRetry, retryLabel = 'Try Again', showHome = false }) {
  const navigate = useNavigate();
  return (
    <div className="error-state" role="alert" aria-live="polite">
      <div className="error-icon" aria-hidden="true">
        <AlertTriangle size={28} strokeWidth={1.5} />
      </div>
      <h2 className="error-title">{title || 'Something went wrong'}</h2>
      {message && <p className="error-message">{message}</p>}
      <div className="error-actions">
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry} id="error-retry-btn">
            {retryLabel}
          </button>
        )}
        {showHome && (
          <button className="btn btn-secondary" onClick={() => navigate('/')} id="error-home-btn">
            <UploadCloud size={15} strokeWidth={1.75} />
            Upload a CSV
          </button>
        )}
      </div>
      <style>{`
        .error-state {
          text-align: center;
          padding: 64px 24px;
          color: var(--color-text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .error-icon {
          color: var(--color-text-subtle);
          margin-bottom: 16px;
        }
        .error-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }
        .error-message {
          font-size: 14px;
          max-width: 380px;
          line-height: 1.6;
          margin-bottom: 24px;
          color: var(--color-text-muted);
        }
        .error-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
      `}</style>
    </div>
  );
}
