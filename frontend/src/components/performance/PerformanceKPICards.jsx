import React, { useState, useEffect, useMemo } from 'react';
import { Package, Trophy, AlertTriangle, FileText, Info } from 'lucide-react';

export default function PerformanceKPICards({ kpis }) {
  if (!kpis) return null;

  const {
    products_analysed = 0,
    best_product = null,
    best_products = [],
    at_risk_count = 0,
    total_reviews = 0,
    risk_threshold_pct = 40
  } = kpis;

  const tiedProducts = useMemo(() => {
    if (Array.isArray(best_products) && best_products.length > 0) {
      return best_products;
    }
    if (best_product && best_product.name) {
      return [best_product];
    }
    return [];
  }, [best_products, best_product]);

  const [selectedTiedIndex, setSelectedTiedIndex] = useState(0);

  // Reset or adjust selection when tiedProducts changes (e.g., dataset changes)
  useEffect(() => {
    setSelectedTiedIndex(0);
  }, [tiedProducts]);

  const isTied = tiedProducts.length > 1;
  const activeProduct = tiedProducts[selectedTiedIndex] || tiedProducts[0] || null;

  const bestProductName = activeProduct?.name || '—';
  const bestScore = activeProduct?.score != null ? `${activeProduct.score > 0 ? '+' : ''}${activeProduct.score}%` : '—';
  const bestReviews = activeProduct?.reviews || 0;

  return (
    <div className="perf-kpi-grid">
      {/* KPI 1: Products Analysed */}
      <div className="perf-kpi-card" id="kpi-products-analysed">
        <div className="perf-kpi-icon-box perf-kpi-blue">
          <Package size={20} strokeWidth={2.2} />
        </div>
        <div className="perf-kpi-body">
          <span className="perf-kpi-label">Products analysed</span>
          <div className="perf-kpi-val-row">
            <span className="perf-kpi-val">{products_analysed.toLocaleString()}</span>
          </div>
          <span className="perf-kpi-sub">distinct products</span>
        </div>
      </div>

      {/* KPI 2: Best Performing Product */}
      <div className="perf-kpi-card" id="kpi-best-product">
        <div className="perf-kpi-icon-box perf-kpi-gold">
          <Trophy size={20} strokeWidth={2.2} />
        </div>
        <div className="perf-kpi-body">
          <div className="perf-kpi-header-row">
            <span className="perf-kpi-label">Best performing product</span>
            {isTied && (
              <span
                className="perf-tie-pill"
                title={`${tiedProducts.length} products tied with top score of ${bestScore}`}
              >
                {tiedProducts.length} tied
              </span>
            )}
          </div>

          {isTied ? (
            <div className="perf-kpi-val-row perf-kpi-select-row">
              <select
                className="perf-kpi-dropdown"
                value={selectedTiedIndex}
                onChange={(e) => setSelectedTiedIndex(Number(e.target.value))}
                title={bestProductName}
                aria-label="Select tied best performing product"
              >
                {tiedProducts.map((p, idx) => (
                  <option key={`${p.name}-${idx}`} value={idx} title={p.name}>
                    {p.name} ({p.score > 0 ? '+' : ''}{p.score}% · {p.reviews} rev)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="perf-kpi-val-row">
              <span
                className="perf-kpi-val perf-kpi-val-text"
                title={bestProductName}
                tabIndex={0}
                aria-label={`Best performing product: ${bestProductName}`}
              >
                {bestProductName}
              </span>
            </div>
          )}

          <div className="perf-kpi-sub-score">
            <span className="perf-score-badge">{bestScore}</span>
            <span className="perf-kpi-sub" title={`${bestReviews} reviews considered`}>
              sentiment score
              <span className="perf-info-icon" title={`Sentiment Score = Positive % - Negative % (${bestReviews} reviews)`}>
                <Info size={11} />
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI 3: At-Risk Products */}
      <div className="perf-kpi-card" id="kpi-at-risk-products">
        <div className="perf-kpi-icon-box perf-kpi-red">
          <AlertTriangle size={20} strokeWidth={2.2} />
        </div>
        <div className="perf-kpi-body">
          <span className="perf-kpi-label">At-risk products</span>
          <div className="perf-kpi-val-row">
            <span className="perf-kpi-val perf-kpi-val-red">{at_risk_count.toLocaleString()}</span>
          </div>
          <span className="perf-kpi-sub">high negative sentiment (&gt; {risk_threshold_pct}%)</span>
        </div>
      </div>

      {/* KPI 4: Total Reviews */}
      <div className="perf-kpi-card" id="kpi-total-reviews">
        <div className="perf-kpi-icon-box perf-kpi-blue">
          <FileText size={20} strokeWidth={2.2} />
        </div>
        <div className="perf-kpi-body">
          <span className="perf-kpi-label">Total reviews (products)</span>
          <div className="perf-kpi-val-row">
            <span className="perf-kpi-val">{total_reviews.toLocaleString()}</span>
          </div>
          <span className="perf-kpi-sub">across all products</span>
        </div>
      </div>
    </div>
  );
}
