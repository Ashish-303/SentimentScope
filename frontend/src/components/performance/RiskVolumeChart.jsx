import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid, Cell
} from 'recharts';
import { Target, AlertTriangle } from 'lucide-react';
import { getCategoryColor } from '../../utils/performanceCalculations';
import { useTheme } from '../../context/ThemeContext';

const CustomScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const isPositive = p.sentiment_score >= 0;

  return (
    <div className="perf-chart-tooltip">
      <div className="perf-tt-title">{p.name}</div>
      <div className="perf-tt-category" style={{ color: getCategoryColor(p.category) }}>
        Category: {p.category}
      </div>
      <div className="perf-tt-divider" />
      <div className="perf-tt-row">
        <span className="perf-tt-label">Total Reviews:</span>
        <strong className="perf-tt-val">{p.reviews?.toLocaleString()}</strong>
      </div>
      <div className="perf-tt-row">
        <span className="perf-tt-label">Negative Reviews:</span>
        <strong className="perf-tt-val" style={{ color: 'var(--color-negative)' }}>
          {p.negative_reviews} ({p.negative_pct}%)
        </strong>
      </div>
      <div className="perf-tt-row">
        <span className="perf-tt-label">Positive Sentiment:</span>
        <span className="perf-tt-val" style={{ color: 'var(--color-positive)' }}>{p.positive_pct}%</span>
      </div>
      <div className="perf-tt-row">
        <span className="perf-tt-label">Neutral Sentiment:</span>
        <span className="perf-tt-val" style={{ color: 'var(--color-neutral)' }}>{p.neutral_pct}%</span>
      </div>
      <div className="perf-tt-divider" />
      <div className="perf-tt-row perf-tt-score-row">
        <span className="perf-tt-label">Sentiment Score:</span>
        <span className={`perf-tt-val ${isPositive ? 'perf-score-pos' : 'perf-score-neg'}`}>
          {isPositive ? '+' : ''}{p.sentiment_score}%
        </span>
      </div>
      <div className="perf-tt-row" style={{ marginTop: 4 }}>
        <span className="perf-tt-label">Risk Classification:</span>
        <span className={p.is_at_risk ? 'perf-badge-risk' : 'tag'}>
          {p.is_at_risk ? 'At Risk (> 40% neg)' : 'Normal Risk'}
        </span>
      </div>
    </div>
  );
};

export default function RiskVolumeChart({
  scatterData = [],
  riskThreshold = 40,
  onSelectProduct
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const categoriesInChart = useMemo(() => {
    return [...new Set(scatterData.map(d => d.category))].sort();
  }, [scatterData]);

  const maxReviews = useMemo(() => {
    if (!scatterData.length) return 100;
    const maxVal = Math.max(...scatterData.map(d => d.reviews || 0));
    return Math.ceil(maxVal * 1.1);
  }, [scatterData]);

  return (
    <div className="perf-card">
      <div className="perf-card-header">
        <div className="perf-card-title-group">
          <Target size={17} strokeWidth={2.2} className="perf-title-icon" />
          <h2 className="perf-card-title">Product Risk vs. Review Volume</h2>
        </div>
        <span className="section-label" style={{ color: 'var(--color-negative)' }}>
          Risk Threshold: {riskThreshold}%
        </span>
      </div>

      <div className="perf-card-body">
        {scatterData.length === 0 ? (
          <div className="perf-empty-box">No products available for risk scatter analysis.</div>
        ) : (
          <div className="perf-scatter-layout">
            <div className="perf-scatter-container" style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 24, bottom: 25, left: 10 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      const prodName = e.activePayload[0].payload.name;
                      if (onSelectProduct) onSelectProduct(prodName);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    dataKey="reviews"
                    name="Number of Reviews"
                    domain={[0, maxReviews]}
                    stroke="var(--color-border)"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    label={{
                      value: 'Number of Reviews (Volume)',
                      position: 'insideBottom',
                      offset: -12,
                      fill: 'var(--color-text-muted)',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="negative_pct"
                    name="Negative Sentiment (%)"
                    unit="%"
                    domain={[0, 100]}
                    stroke="var(--color-border)"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    label={{
                      value: 'Negative Sentiment (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 6,
                      fill: 'var(--color-text-muted)',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="negative_reviews"
                    range={[70, 480]}
                    name="Negative Reviews"
                  />
                  <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <ReferenceLine
                    y={riskThreshold}
                    stroke="var(--color-negative)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: `Risk Line (${riskThreshold}%)`,
                      fill: 'var(--color-negative)',
                      fontSize: 11,
                      fontWeight: 700,
                      position: 'insideTopRight',
                      dy: -12
                    }}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getCategoryColor(entry.category)}
                        fillOpacity={0.78}
                        stroke={isDark ? '#FFFFFF' : 'rgba(15, 23, 42, 0.45)'}
                        strokeWidth={entry.is_at_risk ? 2 : 1}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Category Color Legend on Right */}
            <div className="perf-scatter-legend">
              <span className="perf-legend-header">Product Category</span>
              <div className="perf-category-list">
                {categoriesInChart.map(cat => (
                  <div key={cat} className="perf-category-item" title={cat}>
                    <span
                      className="perf-category-dot"
                      style={{ background: getCategoryColor(cat) }}
                    />
                    <span className="perf-category-name">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
