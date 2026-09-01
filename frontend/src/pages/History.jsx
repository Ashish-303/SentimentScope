import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FileText, Trash2, Info, UploadCloud, Clock } from 'lucide-react';

function SentimentMini({ summary }) {
  const total = Object.values(summary || {}).reduce((a, b) => a + b, 0);
  if (!total) return <span style={{ color: 'var(--color-text-subtle)', fontSize: 12 }}>—</span>;
  const entries = [
    { key: 'Positive', bg: 'var(--color-positive-bg)', color: 'var(--color-positive-text)', border: 'var(--color-positive-border)' },
    { key: 'Neutral',  bg: 'var(--color-neutral-bg)',  color: 'var(--color-neutral-text)',  border: 'var(--color-neutral-border)'  },
    { key: 'Negative', bg: 'var(--color-negative-bg)', color: 'var(--color-negative-text)', border: 'var(--color-negative-border)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {entries.map(({ key, bg, color, border }) => {
        const count = summary?.[key];
        if (!count) return null;
        return (
          <span key={key} style={{ background: bg, color, border: `1px solid ${border}`, padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {key.slice(0, 3)} {count}
          </span>
        );
      })}
    </div>
  );
}

export default function History() {
  const { history, clearHistory } = useApp();
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Analysis History</h1>
          <p className="page-subtitle">Your recent review analyses in this browser session</p>
        </div>
        {history.length > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={clearHistory}
            id="clear-history-btn"
            aria-label="Clear all history"
            style={{ gap: 6 }}
          >
            <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
            Clear history
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">
              <Clock size={32} strokeWidth={1.25} />
            </div>
            <div className="empty-state-title">No history yet</div>
            <p className="empty-state-text">
              Your upload history will appear here after you analyze a CSV file.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')} id="history-upload-btn">
              <UploadCloud size={15} strokeWidth={1.75} aria-hidden="true" />
              Upload CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {history.map((entry, i) => (
            <div key={i} className="card history-card" id={`history-row-${i}`}>
              <div className="history-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={15} style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
                  <h3 className="history-file-title">{entry.filename}</h3>
                </div>
                <span className="history-date">
                  {new Date(entry.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div className="history-card-body">
                <div className="history-metric">
                  <span className="history-metric-label">Processed Reviews</span>
                  <span className="history-metric-value">{entry.rows?.toLocaleString() || '—'}</span>
                </div>
                <div className="history-sentiment">
                  <span className="history-metric-label">Sentiment Breakdown</span>
                  <SentimentMini summary={entry.summary} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtle localStorage disclaimer */}
      <footer className="history-disclaimer" aria-label="History disclaimer">
        <Info size={12} strokeWidth={2} aria-hidden="true" />
        <span>
          History is stored in your browser's localStorage and is not sent to any server.
          Clearing browser data will remove it.
        </span>
      </footer>

      <style>{`
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .history-card {
          transition: transform var(--t-fast) var(--ease-out), box-shadow var(--t-fast) var(--ease-out), border-color var(--t-fast);
          padding: 16px 20px;
        }
        .history-card:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-primary-light);
        }
        .history-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .history-file-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }
        .history-date {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }
        .history-card-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .history-metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .history-metric-label {
          font-size: 10px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .history-metric-value {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
        }
        .history-sentiment {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .history-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          font-size: 11px;
          color: var(--color-text-subtle);
          margin-top: 16px;
          line-height: 1.5;
        }
        .history-disclaimer svg { flex-shrink: 0; margin-top: 1px; }
      `}</style>
    </div>
  );
}
