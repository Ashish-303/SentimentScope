import React from 'react';

const CONFIG = {
  Positive: { label: 'Positive', dot: '#16A34A', bg: 'var(--color-positive-bg)', text: 'var(--color-positive-text)', border: 'var(--color-positive-border)' },
  Neutral:  { label: 'Neutral',  dot: '#D97706', bg: 'var(--color-neutral-bg)',  text: 'var(--color-neutral-text)',  border: 'var(--color-neutral-border)'  },
  Negative: { label: 'Negative', dot: '#DC2626', bg: 'var(--color-negative-bg)', text: 'var(--color-negative-text)', border: 'var(--color-negative-border)' },
};

export default function SentimentBadge({ sentiment, size = 'default' }) {
  const cfg = CONFIG[sentiment] || { label: sentiment || '—', dot: 'var(--color-border-strong)', bg: 'var(--color-surface-2)', text: 'var(--color-text-muted)', border: 'var(--color-border)' };
  const isLarge = size === 'large';

  return (
    <span
      className={`sentiment-badge ${isLarge ? 'sentiment-badge-lg' : ''}`}
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
      aria-label={`Sentiment: ${cfg.label}`}
    >
      <span
        className="sentiment-dot"
        aria-hidden="true"
        style={{ background: cfg.dot, width: isLarge ? 8 : 6, height: isLarge ? 8 : 6 }}
      />
      {cfg.label}
    </span>
  );
}
