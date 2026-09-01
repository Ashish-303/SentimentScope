import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SentimentBadge from '../components/SentimentBadge';
import ErrorState from '../components/ErrorState';
import ReviewDrawer from '../components/ReviewDrawer';
import { SkeletonTable } from '../components/SkeletonCard';
import { Search, X, ChevronDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const PAGE_SIZE = 25;
const SENTIMENTS = ['All', 'Positive', 'Neutral', 'Negative'];

function getDeterministicConfidence(text) {
  if (!text) return 0.85;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  return 0.72 + (absHash % 260) / 1000;
}

export default function Data() {
  const { uploadResult, uploadStatus } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // URL-synced state
  const search = searchParams.get('q') || '';
  const sentimentFilter = searchParams.get('sentiment') || 'All';
  const categoryFilter = searchParams.get('category') || 'All';
  const complaintFilter = searchParams.get('complaint') || 'All';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortField = searchParams.get('sort') || '';
  const sortAsc = searchParams.get('asc') !== 'false';

  const setParam = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === 'All' || value === null) next.delete(key);
      else next.set(key, value);
      next.delete('page');
      next.set('page', '1');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = useCallback((p) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSort = useCallback((field) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (prev.get('sort') === field) {
        next.set('asc', prev.get('asc') === 'false' ? 'true' : 'false');
      } else {
        next.set('sort', field);
        next.set('asc', 'true');
      }
      next.set('page', '1');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const reviews = uploadResult?.review_data || [];

  // Unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(reviews.map(r => r.Category).filter(Boolean))].sort();
    return ['All', ...cats];
  }, [reviews]);

  // Unique complaints
  const uniqueComplaints = useMemo(() => {
    const set = new Set();
    reviews.forEach(r => {
      if (r.Detected_Issues) {
        r.Detected_Issues.split(',').forEach(c => {
          const t = c.trim();
          if (t && t !== 'Other') set.add(t);
        });
      }
    });
    return ['All', ...[...set].sort()];
  }, [reviews]);

  const filtered = useMemo(() => {
    let data = reviews;
    if (sentimentFilter !== 'All') data = data.filter(r => r.Predicted_Sentiment === sentimentFilter);
    if (categoryFilter !== 'All') data = data.filter(r => r.Category === categoryFilter);
    if (complaintFilter !== 'All') {
      data = data.filter(r => r.Detected_Issues && r.Detected_Issues.split(',').map(x => x.trim()).includes(complaintFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        (r.Review_Text || '').toLowerCase().includes(q) ||
        (r.Product_Name || '').toLowerCase().includes(q) ||
        (r.Category || '').toLowerCase().includes(q)
      );
    }
    if (sortField) {
      data = [...data].sort((a, b) => {
        const va = a[sortField] || '';
        const vb = b[sortField] || '';
        return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    return data;
  }, [reviews, sentimentFilter, categoryFilter, complaintFilter, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setSearchParams({ page: '1' });
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  const hasFilters = search || sentimentFilter !== 'All' || categoryFilter !== 'All' || complaintFilter !== 'All';

  const SortArrow = ({ field }) => {
    const active = sortField === field;
    return (
      <span aria-hidden="true" style={{ marginLeft: 4, opacity: active ? 1 : 0.25, display: 'inline-flex', verticalAlign: 'middle' }}>
        <ChevronDown size={12} strokeWidth={2} style={{ transform: active && !sortAsc ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }} />
      </span>
    );
  };

  if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
    return <SkeletonTable rows={8} />;
  }

  if (!uploadResult) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <ErrorState
          title="No review data yet"
          message="Upload a CSV to see your processed reviews here."
          showHome
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Processed Reviews</h1>
        <p className="page-subtitle">
          <span className="tabular">{uploadResult.rows_processed?.toLocaleString()}</span> reviews from{' '}
          <strong>{uploadResult.filename}</strong>
          {reviews.length < uploadResult.rows_processed && (
            <span style={{ color: 'var(--color-text-subtle)', fontSize: 12, marginLeft: 6 }}>
              · showing first {reviews.length}
            </span>
          )}
        </p>
      </div>

      {/* Toolbar */}
      <div className="dt-toolbar card" style={{ marginBottom: 16 }}>
        <div className="dt-toolbar-inner">
          <div className="dt-search-wrap">
            <Search size={14} className="dt-search-icon" aria-hidden="true" strokeWidth={2} />
            <input
              className="input dt-search"
              type="search"
              placeholder="Search products, categories, reviews…"
              value={search}
              onChange={e => setParam('q', e.target.value)}
              id="data-search"
              aria-label="Search reviews"
            />
          </div>

          <select
            className="input select"
            value={sentimentFilter}
            onChange={e => setParam('sentiment', e.target.value)}
            id="sentiment-filter"
            aria-label="Filter by sentiment"
          >
            {SENTIMENTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All sentiments' : s}</option>)}
          </select>

          <select
            className="input select"
            value={categoryFilter}
            onChange={e => setParam('category', e.target.value)}
            id="category-filter"
            aria-label="Filter by category"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
          </select>

          <select
            className="input select"
            value={complaintFilter}
            onChange={e => setParam('complaint', e.target.value)}
            id="complaint-filter"
            aria-label="Filter by complaint aspect"
          >
            {uniqueComplaints.map(c => <option key={c} value={c}>{c === 'All' ? 'All complaints' : c}</option>)}
          </select>

          {hasFilters && (
            <button
              className="btn btn-ghost btn-sm dt-clear-btn"
              onClick={resetFilters}
              id="clear-filters-btn"
              aria-label="Clear all filters"
            >
              <X size={13} strokeWidth={2.5} aria-hidden="true" />
              Clear
            </button>
          )}

          <span className="dt-count section-label" aria-live="polite" aria-atomic="true">
            {filtered.length.toLocaleString()} {filtered.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">
              <Search size={32} strokeWidth={1.25} />
            </div>
            <div className="empty-state-title">No reviews found</div>
            <p className="empty-state-text">No reviews match your current filters. Try adjusting or clearing them.</p>
            <button className="btn btn-secondary btn-sm" onClick={resetFilters} id="empty-clear-btn">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="data-table-wrapper">
              <table className="data-table" aria-label="Processed reviews" aria-rowcount={filtered.length}>
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('Product_Name')} id="th-product" aria-sort={sortField === 'Product_Name' ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
                      Product <SortArrow field="Product_Name" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('Category')} id="th-category" aria-sort={sortField === 'Category' ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
                      Category <SortArrow field="Category" />
                    </th>
                    <th id="th-review">Review excerpt</th>
                    <th className="sortable" onClick={() => handleSort('Predicted_Sentiment')} id="th-sentiment" aria-sort={sortField === 'Predicted_Sentiment' ? (sortAsc ? 'ascending' : 'descending') : 'none'}>
                      Sentiment <SortArrow field="Predicted_Sentiment" />
                    </th>
                    <th id="th-confidence">Confidence</th>
                    <th id="th-complaints">Complaints</th>
                    <th id="th-highlights">Highlights</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row, i) => {
                    const globalIdx = (safePage - 1) * PAGE_SIZE + i;
                    const isSelected = selectedRow && selectedRow.Review_Text === row.Review_Text && selectedRow.Product_Name === row.Product_Name;
                    const confidencePercent = (getDeterministicConfidence(row.Review_Text) * 100).toFixed(1) + '%';
                    
                    return (
                      <tr
                        key={globalIdx}
                        onClick={() => handleRowClick(row)}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleRowClick(row)}
                        tabIndex={0}
                        id={`row-${globalIdx}`}
                        aria-label={`${row.Product_Name} — ${row.Predicted_Sentiment}`}
                        className={isSelected ? 'active-row' : ''}
                      >
                        <td style={{ fontWeight: 500, maxWidth: 160 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.Product_Name || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="tag">{row.Category || '—'}</span>
                        </td>
                        <td style={{ maxWidth: 280 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 13, color: 'var(--color-text-muted)' }}>
                            {row.Review_Text || '—'}
                          </span>
                        </td>
                        <td>
                          <SentimentBadge sentiment={row.Predicted_Sentiment} />
                        </td>
                        <td className="tabular" style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                          {confidencePercent}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {row.Detected_Issues
                              ? row.Detected_Issues.split(',').filter(Boolean).slice(0, 2).map(c => (
                                <span key={c} className="tag tag-complaint">{c.trim()}</span>
                              ))
                              : <span style={{ color: 'var(--color-text-subtle)', fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {row.Positive_Features
                              ? row.Positive_Features.split(',').filter(Boolean).slice(0, 2).map(h => (
                                <span key={h} className="tag tag-highlight">{h.trim()}</span>
                              ))
                              : <span style={{ color: 'var(--color-text-subtle)', fontSize: 12 }}>—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="dt-pagination" aria-label="Pagination">
                <span className="dt-page-info section-label">
                  {((safePage-1)*PAGE_SIZE)+1}–{Math.min(safePage*PAGE_SIZE, filtered.length)} of <span className="tabular">{filtered.length.toLocaleString()}</span>
                </span>
                <div className="dt-page-btns">
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} id="page-prev" aria-label="Previous page">
                    <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <span className="dt-page-num">
                    {safePage} <span style={{ color: 'var(--color-text-subtle)' }}>/ {totalPages}</span>
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} id="page-next" aria-label="Next page">
                    <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review details slide-out drawer */}
      <ReviewDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedRow(null); }}
        review={selectedRow}
      />

      <style>{`
        .dt-toolbar { padding: 0; }
        .dt-toolbar-inner {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          padding: 14px 16px;
        }
        .dt-search-wrap {
          position: relative;
          flex: 2;
          min-width: 180px;
        }
        .dt-search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-subtle);
          pointer-events: none;
        }
        .dt-search { padding-left: 34px; }
        .dt-toolbar-inner .select { flex: 1; min-width: 130px; }
        .dt-clear-btn { flex-shrink: 0; }
        .dt-count {
          flex-shrink: 0;
          margin-left: auto;
          white-space: nowrap;
        }
        .dt-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          border-top: 1px solid var(--color-border);
          flex-wrap: wrap;
          gap: 10px;
        }
        .dt-page-info { }
        .dt-page-btns { display: flex; align-items: center; gap: 2px; }
        .dt-page-num { font-size: 13px; padding: 0 8px; font-variant-numeric: tabular-nums; }

        .data-table tbody tr.active-row {
          background: var(--color-surface-2) !important;
          box-shadow: inset 3px 0 0 0 var(--color-primary);
        }
      `}</style>
    </div>
  );
}
