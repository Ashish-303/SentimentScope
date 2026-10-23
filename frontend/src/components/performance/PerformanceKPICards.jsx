import React from 'react';
import { Package, Trophy, AlertTriangle, FileText, Info } from 'lucide-react';

export default function PerformanceKPICards({ kpis }) {
  if (!kpis) return null;

  const {
    products_analysed = 0,
    best_product = null,
    at_risk_count = 0,
    total_reviews = 0,
    risk_threshold_pct = 40
  } = kpis;

  const bestProductName = best_product?.name || '—';
  const bestScore = best_product?.score != null ? `${best_product.score > 0 ? '+' : ''}${best_product.score}%` : '—';
  const bestReviews = best_product?.reviews || 0;

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
          <span className="perf-kpi-label">Best performing product</span>
          <div className="perf-kpi-val-row">
            <span className="perf-kpi-val perf-kpi-val-text" title={bestProductName}>
              {bestProductName}
            </span>
          </div>
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
