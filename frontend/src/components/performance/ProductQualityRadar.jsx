import React, { useState, useEffect, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { Compass, Check, X, Info, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DIMENSIONS = ['Quality', 'Delivery', 'Value', 'Design', 'Battery', 'Service'];

const CustomRadarTooltip = ({ active, payload, qualityProfiles = [] }) => {
  if (!active || !payload?.length) return null;
  const dimensionName = payload[0]?.payload?.dimension;

  return (
    <div className="perf-chart-tooltip">
      <div className="perf-tt-title">Dimension: {dimensionName}</div>
      <div className="perf-tt-category">Scored on 0–100 quality scale</div>
      <div className="perf-tt-divider" />
      {payload.map((entry, idx) => {
        const prod = qualityProfiles.find(p => p.product_name === entry.name);
        const dimInfo = prod?.dimensions?.[dimensionName];
        const hasDirect = dimInfo?.has_direct_evidence;
        const scoreDisplay = typeof dimInfo?.score === 'number' ? `${dimInfo.score}/100` : 'N/A';

        return (
          <div key={idx} style={{ marginBottom: 6 }}>
            <div className="perf-tt-row">
              <span className="perf-tt-label">
                <span className="perf-dot" style={{ background: entry.color }} />
                {entry.name}:
              </span>
              <strong className="perf-tt-val">{scoreDisplay}</strong>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', paddingLeft: 14 }}>
              {hasDirect ? (
                <span>Aspect evidence: {dimInfo.positive_mentions} positive · {dimInfo.negative_mentions} complaints</span>
              ) : typeof dimInfo?.score === 'number' ? (
                <span>Sentiment-based indicator: Estimated from overall product sentiment</span>
              ) : (
                <span>N/A — No quality data available</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function ProductQualityRadar({ qualityProfiles = [] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const productColors = useMemo(() => {
    return isDark
      ? ['#3B82F6', '#10B981', '#EF4444']
      : ['#2563EB', '#16A34A', '#DC2626'];
  }, [isDark]);

  // Available products for comparison derived strictly from the current dataset
  const candidateNames = useMemo(() => {
    return qualityProfiles.map(p => p.product_name).filter(Boolean);
  }, [qualityProfiles]);

  // Option A (Preferred): Start with no products selected
  const [selectedNames, setSelectedNames] = useState([]);
  const [candidateFilter, setCandidateFilter] = useState('');

  // When dataset changes, retain only currently valid selected products, clearing stale ones
  useEffect(() => {
    setSelectedNames(prev => prev.filter(name => candidateNames.includes(name)));
    setCandidateFilter('');
  }, [candidateNames]);

  const filteredCandidates = useMemo(() => {
    if (!candidateFilter.trim()) return candidateNames;
    const q = candidateFilter.trim().toLowerCase();
    return candidateNames.filter(n => n.toLowerCase().includes(q));
  }, [candidateNames, candidateFilter]);

  const maxCompare = Math.min(3, candidateNames.length || 3);

  const toggleProduct = (name) => {
    if (selectedNames.includes(name)) {
      setSelectedNames(selectedNames.filter(n => n !== name));
    } else {
      if (selectedNames.length < 3) {
        setSelectedNames([...selectedNames, name]);
      }
      // If already 3, prevent selecting a fourth until one is deselected
    }
  };

  const removeProduct = (name, e) => {
    if (e) e.stopPropagation();
    setSelectedNames(selectedNames.filter(n => n !== name));
  };

  // Build data points for the 6 radar axes strictly from active profiles
  const radarData = useMemo(() => {
    if (selectedNames.length === 0) return [];

    return DIMENSIONS.map(dim => {
      const row = { dimension: dim };
      selectedNames.forEach(name => {
        const prod = qualityProfiles.find(p => p.product_name === name);
        const dimInfo = prod?.dimensions?.[dim];
        if (dimInfo && typeof dimInfo.score === 'number') {
          row[name] = dimInfo.score;
        } else {
          row[name] = null;
        }
      });
      return row;
    });
  }, [selectedNames, qualityProfiles]);

  return (
    <div className="perf-card">
      <div className="perf-card-header">
        <div className="perf-card-title-group">
          <Compass size={17} strokeWidth={2.2} className="perf-title-icon" />
          <h2 className="perf-card-title">Product Quality Profile</h2>
          <span className="section-label" style={{ color: 'var(--color-primary)' }}>
            Compare (up to 3)
          </span>
        </div>
      </div>

      <div className="perf-card-body">
        {qualityProfiles.length === 0 ? (
          <div className="perf-empty-box">No product quality data available in this dataset.</div>
        ) : (
          <div className="perf-radar-layout">
            <div className="perf-radar-container" style={{ width: '100%', height: 310 }}>
              {selectedNames.length === 0 ? (
                <div className="perf-radar-empty-state">
                  <Compass size={36} strokeWidth={1.5} className="perf-empty-icon" />
                  <h3 className="perf-empty-title">Select up to 3 products to compare their quality profiles</h3>
                  <p className="perf-empty-desc">
                    Choose candidate products from the list on the right to compare dimensions across Quality, Delivery, Value, Design, Battery, and Service.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    data={radarData}
                  >
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: 'var(--color-text)', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="var(--color-border)"
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                    />
                    <Tooltip content={<CustomRadarTooltip qualityProfiles={qualityProfiles} />} />
                    {selectedNames.map((name, idx) => {
                      const color = productColors[idx % productColors.length];
                      return (
                        <Radar
                          key={name}
                          name={name}
                          dataKey={name}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.16}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, strokeWidth: 1.5, fill: color, stroke: isDark ? '#0A1020' : '#FFFFFF' }}
                        />
                      );
                    })}
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Product Selector / Legend */}
            <div className="perf-radar-legend">
              <span className="perf-legend-header">Comparing ({selectedNames.length}/{maxCompare})</span>
              <div className="perf-radar-chips">
                {selectedNames.length === 0 ? (
                  <span className="perf-no-selection-hint">No products selected</span>
                ) : (
                  selectedNames.map((name, idx) => (
                    <div
                      key={name}
                      className="perf-radar-chip active"
                      onClick={() => toggleProduct(name)}
                      title={`Click to remove ${name}`}
                    >
                      <span
                        className="perf-category-dot"
                        style={{ background: productColors[idx % productColors.length] }}
                      />
                      <span className="perf-chip-text" title={name}>{name}</span>
                      <button
                        type="button"
                        className="perf-chip-remove"
                        onClick={(e) => removeProduct(name, e)}
                        title={`Remove ${name}`}
                        aria-label={`Remove ${name}`}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {candidateNames.length > 0 && (
                <div className="perf-radar-selector-list">
                  <div className="perf-selector-subhead-row">
                    <span className="perf-selector-subhead">
                      Candidates ({candidateNames.length} available):
                    </span>
                    {candidateFilter && (
                      <span className="perf-filter-count">
                        ({filteredCandidates.length} matched)
                      </span>
                    )}
                  </div>

                  {candidateNames.length > 7 && (
                    <div className="perf-candidate-search-wrap">
                      <Search size={12} className="perf-candidate-search-icon" />
                      <input
                        type="text"
                        className="perf-candidate-search"
                        placeholder="Search products..."
                        value={candidateFilter}
                        onChange={(e) => setCandidateFilter(e.target.value)}
                        aria-label="Filter candidate products"
                      />
                      {candidateFilter && (
                        <button
                          type="button"
                          className="perf-candidate-search-clear"
                          onClick={() => setCandidateFilter('')}
                          aria-label="Clear product search"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="perf-selector-scroll">
                    {filteredCandidates.length === 0 ? (
                      <div className="perf-no-match-hint">No products matching "{candidateFilter}"</div>
                    ) : (
                      filteredCandidates.map(name => {
                        const isSel = selectedNames.includes(name);
                        const isMaxReached = selectedNames.length >= 3;
                        const isDisabled = !isSel && isMaxReached;
                        return (
                          <button
                            key={name}
                            type="button"
                            className={`perf-selector-btn ${isSel ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => toggleProduct(name)}
                            disabled={isDisabled}
                            title={
                              isSel
                                ? `Click to remove ${name} from comparison`
                                : isDisabled
                                ? 'Maximum 3 products selected. Deselect a product to add another.'
                                : `Compare ${name}`
                            }
                            aria-label={
                              isSel
                                ? `Remove ${name} from comparison`
                                : isDisabled
                                ? `Cannot add ${name}, maximum 3 products selected`
                                : `Add ${name} to comparison`
                            }
                          >
                            <span className="perf-check-icon">{isSel ? <Check size={12} strokeWidth={3} /> : null}</span>
                            <span className="perf-selector-name">{name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
