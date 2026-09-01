import React from 'react';

function SkeletonBlock({ width = '100%', height = 16, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 6, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }} aria-hidden="true">
      <SkeletonBlock width="45%" height={11} />
      <SkeletonBlock width="65%" height={26} />
      <SkeletonBlock width="30%" height={11} />
    </div>
  );
}

export function SkeletonChart({ height = 280 }) {
  return (
    <div className="card" aria-hidden="true">
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <SkeletonBlock width="160px" height={15} />
      </div>
      <div style={{ padding: 20 }}>
        <SkeletonBlock width="100%" height={height} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div className="page-container" aria-hidden="true">
      <div style={{ marginBottom: 24 }}>
        <SkeletonBlock width="200px" height={28} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="280px" height={14} />
      </div>
      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>
          {[180, 100, 80].map((w, i) => (
            <SkeletonBlock key={i} width={w} height={11} />
          ))}
        </div>
        <div style={{ padding: '0 16px' }}>
          {[...Array(rows)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: i < rows - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <SkeletonBlock width="20%" height={13} />
              <SkeletonBlock width="12%" height={13} />
              <SkeletonBlock width="35%" height={13} />
              <SkeletonBlock width="10%" height={18} style={{ borderRadius: 4 }} />
              <SkeletonBlock width="15%" height={13} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
