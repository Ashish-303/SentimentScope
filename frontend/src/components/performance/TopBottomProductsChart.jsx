import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function ProductRankingPanel({
  title,
  icon: Icon,
  iconColor,
  badgeText,
  badgeClass,
  products,
  onViewAll,
  onSelectProduct,
  emptyMessage
}) {
  return (
    <div className="perf-card">
      <div className="perf-card-header">
        <div className="perf-card-title-group">
          <Icon size={17} strokeWidth={2.2} style={{ color: iconColor }} className="perf-title-icon" />
          <h2 className="perf-card-title">{title}</h2>
          {badgeText && <span className={`tag ${badgeClass}`} style={{ fontSize: 11 }}>{badgeText}</span>}
        </div>
        <div className="perf-card-header-actions">
          <div className="perf-inline-legend">
            <span className="perf-legend-item"><span className="perf-dot perf-dot-pos" /> Positive</span>
            <span className="perf-legend-item"><span className="perf-dot perf-dot-neu" /> Neutral</span>
            <span className="perf-legend-item"><span className="perf-dot perf-dot-neg" /> Negative</span>
          </div>
          <button
            type="button"
            className="perf-btn-link"
            onClick={onViewAll}
            aria-label={`View all ${title.toLowerCase()}`}
          >
            View All
          </button>
        </div>
      </div>

      <div className="perf-card-body">
        {products.length === 0 ? (
          <div className="perf-empty-box">{emptyMessage || 'No products qualify under the current filter.'}</div>
        ) : (
          <div className="perf-stacked-list">
            {products.map((p, idx) => {
              const scoreSign = p.sentiment_score > 0 ? '+' : '';
              const isPositive = p.sentiment_score >= 0;

              return (
                <div
                  key={`${p.product_name}-${idx}`}
                  className="perf-stacked-row"
                  onClick={() => onSelectProduct && onSelectProduct(p.product_name)}
                  title={`${p.product_name} (${p.total_reviews} reviews) - Positive: ${p.positive_pct}%, Neutral: ${p.neutral_pct}%, Negative: ${p.negative_pct}%, Score: ${scoreSign}${p.sentiment_score}%`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectProduct && onSelectProduct(p.product_name)}
                >
                  <div className="perf-row-name" title={p.product_name}>
                    {p.product_name}
                  </div>
                  <div className="perf-row-bar-container">
                    <div className="perf-row-bar">
                      <div
                        className="perf-bar-seg perf-seg-pos"
                        style={{ width: `${Math.max(0, p.positive_pct)}%` }}
                        title={`Positive: ${p.positive_pct}% (${p.positive_count})`}
                      />
                      <div
                        className="perf-bar-seg perf-seg-neu"
                        style={{ width: `${Math.max(0, p.neutral_pct)}%` }}
                        title={`Neutral: ${p.neutral_pct}% (${p.neutral_count})`}
                      />
                      <div
                        className="perf-bar-seg perf-seg-neg"
                        style={{ width: `${Math.max(0, p.negative_pct)}%` }}
                        title={`Negative: ${p.negative_pct}% (${p.negative_count})`}
                      />
                    </div>
                  </div>
                  <div className={`perf-row-score ${isPositive ? 'perf-score-pos' : 'perf-score-neg'}`}>
                    <span className={`perf-score-pill ${isPositive ? 'pos' : 'neg'}`}>
                      {scoreSign}{p.sentiment_score}%
                    </span>
                  </div>
                </div>
              );
            })}

            {/* X-Axis Tick Scale at Bottom */}
            <div className="perf-scale-row">
              <div className="perf-scale-spacer" />
              <div className="perf-scale-ticks">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
              <div className="perf-scale-score-spacer" />
            </div>
            <div className="perf-scale-label">Percentage of Reviews</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopBottomProductsChart({
  topProducts = [],
  bottomProducts = [],
  onViewAll,
  onSelectProduct
}) {
  return (
    <div className="perf-two-col-grid">
      <ProductRankingPanel
        title="Top 10 Performing Products"
        icon={TrendingUp}
        iconColor="var(--color-positive)"
        badgeText="Top Ranked"
        badgeClass="tag-highlight"
        products={topProducts}
        onViewAll={onViewAll}
        onSelectProduct={onSelectProduct}
        emptyMessage="No top performing products found meeting threshold."
      />
      <ProductRankingPanel
        title="Bottom 10 Performing Products"
        icon={TrendingDown}
        iconColor="var(--color-negative)"
        badgeText="Underperforming"
        badgeClass="tag-complaint"
        products={bottomProducts}
        onViewAll={onViewAll}
        onSelectProduct={onSelectProduct}
        emptyMessage="No bottom performing products found meeting threshold."
      />
    </div>
  );
}
