import React, { useState, useMemo } from 'react';
import { X, Search, ArrowUpDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PerformanceRankingsModal({
  isOpen,
  onClose,
  products = [],
  title = 'All Ranked Products'
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('sentiment_score');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.product_name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (typeof va === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va - vb) : (vb - va);
    });
  }, [products, search, sortField, sortAsc]);

  if (!isOpen) return null;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleViewReviews = (pName) => {
    onClose();
    navigate(`/data?q=${encodeURIComponent(pName)}`);
  };

  return (
    <div className="perf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="perf-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="perf-modal-header">
          <div>
            <h2 className="perf-modal-title">{title}</h2>
            <p className="perf-modal-subtitle">
              Displaying {filtered.length} of {products.length} products
            </p>
          </div>
          <button type="button" className="perf-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="perf-modal-toolbar">
          <div className="perf-modal-search">
            <Search size={14} className="perf-search-icon" />
            <input
              type="text"
              placeholder="Filter products or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="perf-modal-input"
            />
          </div>
        </div>

        <div className="perf-modal-table-wrap">
          <table className="perf-modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => handleSort('product_name')} className="sortable">
                  Product <ArrowUpDown size={11} />
                </th>
                <th onClick={() => handleSort('category')} className="sortable">
                  Category <ArrowUpDown size={11} />
                </th>
                <th onClick={() => handleSort('total_reviews')} className="sortable text-right">
                  Reviews <ArrowUpDown size={11} />
                </th>
                <th className="text-right">Positive</th>
                <th className="text-right">Neutral</th>
                <th className="text-right">Negative</th>
                <th onClick={() => handleSort('sentiment_score')} className="sortable text-right">
                  Score <ArrowUpDown size={11} />
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const isPositive = p.sentiment_score >= 0;
                return (
                  <tr key={`${p.product_name}-${idx}`}>
                    <td className="perf-td-rank">{idx + 1}</td>
                    <td className="perf-td-name" title={p.product_name}>
                      {p.product_name}
                      {p.is_at_risk && <span className="perf-badge-risk">At Risk</span>}
                    </td>
                    <td className="perf-td-cat">{p.category}</td>
                    <td className="text-right">{p.total_reviews}</td>
                    <td className="text-right text-pos">{p.positive_pct}%</td>
                    <td className="text-right text-neu">{p.neutral_pct}%</td>
                    <td className="text-right text-neg">{p.negative_pct}%</td>
                    <td className="text-right">
                      <span className={`perf-score-pill ${isPositive ? 'pos' : 'neg'}`}>
                        {isPositive ? '+' : ''}{p.sentiment_score}%
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="perf-action-btn"
                        onClick={() => handleViewReviews(p.product_name)}
                        title="View reviews in Data table"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
