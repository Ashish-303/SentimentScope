import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ErrorState from '../components/ErrorState';
import ReviewDrawer from '../components/ReviewDrawer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { AlertTriangle, CheckCircle2, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';

function getRepresentativeReview(reviewsList, aspectName, isComplaint) {
  const matchField = isComplaint ? 'Detected_Issues' : 'Positive_Features';
  return reviewsList.find(r => {
    if (!r[matchField]) return false;
    const items = r[matchField].split(',').map(x => x.trim());
    return items.includes(aspectName);
  });
}

function AspectCard({ name, count, pct, colorVar, borderVar, bgVar, textVar, quote, onViewReview, reviewObj }) {
  return (
    <div className="aspect-card-interactive card" style={{ width: '100%' }}>
      <div className="aspect-card-body">
        <div className="aspect-card-top">
          <span className="aspect-name">{name}</span>
          <span
            className="aspect-count"
            style={{ background: bgVar, color: textVar, border: `1px solid ${borderVar}` }}
          >
            {count}
          </span>
        </div>
        <div className="aspect-bar-wrap">
          <div className="aspect-bar" style={{ width: `${pct}%`, background: colorVar }} />
        </div>
        {quote && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <blockquote className="aspect-quote" style={{ borderLeftColor: colorVar }}>
              <span className="aspect-quote-mark" aria-hidden="true">"</span>
              {quote.slice(0, 140)}{quote.length > 140 ? '…' : ''}
              <span className="aspect-quote-mark" aria-hidden="true">"</span>
            </blockquote>
            {reviewObj && (
              <button
                className="btn-link"
                onClick={() => onViewReview(reviewObj)}
                style={{
                  fontSize: 11,
                  color: 'var(--color-primary)',
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <MessageSquare size={11} />
                View Review
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Highlights() {
  const navigate = useNavigate();
  const { uploadResult } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Scroll animations
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();

  // Review Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const dash = uploadResult?.dashboard;
  const reviews = useMemo(() => uploadResult?.review_data || [], [uploadResult]);

  // URL-synced category selection
  const selectedCategory = searchParams.get('category') || 'All';

  const setCategory = (cat) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (cat === 'All') next.delete('category');
      else next.set('category', cat);
      return next;
    }, { replace: true });
  };

  // 1. Calculate dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    reviews.forEach(r => {
      if (r.Category) {
        counts[r.Category] = (counts[r.Category] || 0) + 1;
      }
    });
    return counts;
  }, [reviews]);

  const categoriesList = useMemo(() => {
    return ['All', ...Object.keys(categoryCounts).sort()];
  }, [categoryCounts]);

  // 2. Active filtered reviews
  const activeReviews = useMemo(() => {
    if (selectedCategory === 'All') return reviews;
    return reviews.filter(r => r.Category === selectedCategory);
  }, [reviews, selectedCategory]);

  // 3. Category Summaries (for All Categories overview)
  const categorySummaries = useMemo(() => {
    const summaries = {};
    reviews.forEach(r => {
      const cat = r.Category || 'Unknown';
      if (!summaries[cat]) {
        summaries[cat] = {
          count: 0,
          issues: {},
          features: {}
        };
      }
      summaries[cat].count++;
      
      if (r.Detected_Issues) {
        r.Detected_Issues.split(',').forEach(c => {
          const aspect = c.trim();
          if (aspect && aspect !== 'Other') {
            summaries[cat].issues[aspect] = (summaries[cat].issues[aspect] || 0) + 1;
          }
        });
      }
      if (r.Positive_Features) {
        r.Positive_Features.split(',').forEach(h => {
          const aspect = h.trim();
          if (aspect && aspect !== 'General Satisfaction') {
            summaries[cat].features[aspect] = (summaries[cat].features[aspect] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(summaries).map(([catName, data]) => {
      const topComplaint = Object.entries(data.issues).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No detected complaint';
      const topHighlight = Object.entries(data.features).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No detected highlight';
      return {
        category: catName,
        count: data.count,
        topComplaint,
        topHighlight
      };
    }).sort((a, b) => b.count - a.count);
  }, [reviews]);

  // 4. Dynamic aspect lists
  const complaints = useMemo(() => {
    const counts = {};
    activeReviews.forEach(r => {
      if (r.Detected_Issues) {
        r.Detected_Issues.split(',').forEach(c => {
          const aspect = c.trim();
          if (aspect) counts[aspect] = (counts[aspect] || 0) + 1;
        });
      }
    });
    const entries = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    const max = entries[0]?.count || 1;
    return entries.map(e => ({
      ...e,
      pct: Math.round((e.count / max) * 100),
      reviewObj: getRepresentativeReview(activeReviews, e.name, true)
    }));
  }, [activeReviews]);

  const highlights = useMemo(() => {
    const counts = {};
    activeReviews.forEach(r => {
      if (r.Positive_Features) {
        r.Positive_Features.split(',').forEach(h => {
          const aspect = h.trim();
          if (aspect) counts[aspect] = (counts[aspect] || 0) + 1;
        });
      }
    });
    const entries = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    const max = entries[0]?.count || 1;
    return entries.map(e => ({
      ...e,
      pct: Math.round((e.count / max) * 100),
      reviewObj: getRepresentativeReview(activeReviews, e.name, false)
    }));
  }, [activeReviews]);

  const handleOpenDrawer = (rev) => {
    setSelectedReview(rev);
    setDrawerOpen(true);
  };

  if (!uploadResult) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <ErrorState
          title="No insights yet"
          message="Upload and analyze a product review dataset to discover common complaints and positive highlights."
          showHome
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Customer Voice & Aspects</h1>
        <p className="page-subtitle">
          Aspect extraction from{' '}
          <span className="tabular">{activeReviews.length.toLocaleString()}</span> analyzed reviews
        </p>
      </div>

      {/* Category Selection Pills Selector */}
      <div className="category-selector-strip" role="group" aria-label="Select product category">
        {categoriesList.map(cat => {
          const count = cat === 'All' ? reviews.length : (categoryCounts[cat] || 0);
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              className={`category-pill${active ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat} <span style={{ opacity: 0.6, fontSize: 10, marginLeft: 2 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* ALL-CATEGORIES OVERVIEW CARD GRID */}
      {selectedCategory === 'All' && categorySummaries.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 className="summary-title">Customer Voice By Category</h2>
          <div className="category-summary-grid">
            {categorySummaries.map(({ category, count, topComplaint, topHighlight }) => (
              <div
                key={category}
                className="category-summary-card card"
                onClick={() => setCategory(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setCategory(category)}
                aria-label={`View detailed ${category} voice metrics`}
              >
                <div className="summary-card-header">
                  <span className="summary-card-name">{category}</span>
                  <span className="summary-card-count tabular">{count} reviews</span>
                </div>
                <div className="summary-detail">
                  <div className="summary-row">
                    <span className="summary-label">Top Complaint:</span>
                    <span
                      className="summary-value"
                      style={{ color: topComplaint !== 'No detected complaint' ? 'var(--color-negative)' : 'var(--color-text-subtle)' }}
                    >
                      {topComplaint}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Top Highlight:</span>
                    <span
                      className="summary-value"
                      style={{ color: topHighlight !== 'No detected highlight' ? 'var(--color-positive)' : 'var(--color-text-subtle)' }}
                    >
                      {topHighlight}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED COLUMNS (COMPLAINTS AND HIGHLIGHTS) */}
      <div>
        {selectedCategory !== 'All' && (
          <h2 className="summary-title" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} style={{ color: 'var(--color-primary)' }} />
            {selectedCategory} Breakdown
          </h2>
        )}

        <div className="hl-grid">
          {/* Complaints (Negative Signals) */}
          <section aria-labelledby="complaints-heading">
            <div className="hl-section-header" style={{ borderBottomColor: 'var(--color-negative-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} strokeWidth={2} style={{ color: 'var(--color-negative)' }} aria-hidden="true" />
                <h2 id="complaints-heading" className="hl-section-title">
                  NEGATIVE SIGNALS
                </h2>
              </div>
              <span className="section-label">{complaints.length} types</span>
            </div>

            {complaints.length === 0 ? (
              <div className="card empty-state-small">No complaints detected</div>
            ) : (
              <div ref={ref1} className="hl-list reveal">
                {complaints.map(({ name, count, pct, reviewObj }) => (
                  <AspectCard
                    key={name}
                    name={name}
                    count={count}
                    pct={pct}
                    colorVar="var(--color-negative)"
                    borderVar="var(--color-negative-border)"
                    bgVar="var(--color-negative-bg)"
                    textVar="var(--color-negative-text)"
                    quote={reviewObj?.Review_Text}
                    onViewReview={handleOpenDrawer}
                    reviewObj={reviewObj}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Highlights (Positive Signals) */}
          <section aria-labelledby="highlights-heading">
            <div className="hl-section-header" style={{ borderBottomColor: 'var(--color-positive-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} strokeWidth={2} style={{ color: 'var(--color-positive)' }} aria-hidden="true" />
                <h2 id="highlights-heading" className="hl-section-title">
                  POSITIVE SIGNALS
                </h2>
              </div>
              <span className="section-label">{highlights.length} types</span>
            </div>

            {highlights.length === 0 ? (
              <div className="card empty-state-small">No highlights detected</div>
            ) : (
              <div ref={ref2} className="hl-list reveal">
                {highlights.map(({ name, count, pct, reviewObj }) => (
                  <AspectCard
                    key={name}
                    name={name}
                    count={count}
                    pct={pct}
                    colorVar="var(--color-positive)"
                    borderVar="var(--color-positive-border)"
                    bgVar="var(--color-positive-bg)"
                    textVar="var(--color-positive-text)"
                    quote={reviewObj?.Review_Text}
                    onViewReview={handleOpenDrawer}
                    reviewObj={reviewObj}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Review details slide-out drawer */}
      <ReviewDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedReview(null); }}
        review={selectedReview}
      />

      <style>{`
        .category-selector-strip {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 4px 0;
        }
        .category-pill {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all var(--t-fast) var(--ease-out);
          font-family: inherit;
        }
        .category-pill:hover {
          border-color: var(--color-primary-light);
          color: var(--color-text);
          background: var(--color-surface-3);
        }
        .category-pill.active {
          background: var(--color-primary-light);
          border-color: var(--color-primary);
          color: var(--color-primary);
          font-weight: 600;
        }
        
        .summary-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .category-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .category-summary-card {
          cursor: pointer;
          transition: transform var(--t-fast) var(--ease-out), box-shadow var(--t-fast) var(--ease-out), border-color var(--t-fast);
        }
        .category-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-primary-light);
        }
        .summary-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 8px;
        }
        .summary-card-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-text);
        }
        .summary-card-count {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-subtle);
        }
        .summary-detail {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12.5px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .summary-label {
          color: var(--color-text-muted);
        }
        .summary-value {
          font-weight: 500;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .empty-state-small {
          padding: 24px;
          text-align: center;
          color: var(--color-text-subtle);
          font-size: 13px;
          font-style: italic;
          border-style: dashed;
        }

        .hl-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .hl-grid { grid-template-columns: 1fr; gap: 40px; }
        }

        .hl-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--color-border);
          margin-bottom: 14px;
        }
        .hl-section-title {
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--color-text);
        }
        .hl-list { display: flex; flex-direction: column; gap: 12px; }

        .aspect-card-body { padding: 14px 16px; }
        .aspect-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .aspect-name { font-size: 13px; font-weight: 600; color: var(--color-text); }
        .aspect-count {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          font-variant-numeric: tabular-nums;
        }
        .aspect-bar-wrap {
          height: 3px;
          background: var(--color-surface-3);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0;
        }
        .aspect-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .aspect-quote {
          font-size: 11.5px;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin-top: 0px;
          padding-left: 8px;
          border-left: 2px solid;
          font-style: italic;
          border: none;
          padding: 0;
          display: flex;
          gap: 2px;
        }
        .aspect-quote-mark {
          font-size: 16px;
          line-height: 0;
          vertical-align: -0.2em;
          color: var(--color-border-strong);
          font-family: Georgia, serif;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
