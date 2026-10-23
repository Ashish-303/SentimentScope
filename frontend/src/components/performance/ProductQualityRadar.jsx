import React, { useState, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { Compass, Check, Info } from 'lucide-react';
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

        return (
          <div key={idx} style={{ marginBottom: 6 }}>
            <div className="perf-tt-row">
              <span className="perf-tt-label">
                <span className="perf-dot" style={{ background: entry.color }} />
                {entry.name}:
              </span>
              <strong className="perf-tt-val">{entry.value}/100</strong>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-subtle)', paddingLeft: 14 }}>
              {hasDirect ? (
                <span>Evidence: {dimInfo.positive_mentions} pos · {dimInfo.negative_mentions} comp</span>
              ) : (
                <span>Baseline (general product sentiment)</span>
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

  // Available products for comparison
  const candidateNames = useMemo(() => {
    return qualityProfiles.map(p => p.product_name);
  }, [qualityProfiles]);

  // Default selection: up to first 3 products
  const [selectedNames, setSelectedNames] = useState(() => {
    return candidateNames.slice(0, 3);
  });

  const toggleProduct = (name) => {
    if (selectedNames.includes(name)) {
      if (selectedNames.length > 1) {
        setSelectedNames(selectedNames.filter(n => n !== name));
      }
    } else {
      if (selectedNames.length < 3) {
        setSelectedNames([...selectedNames, name]);
      } else {
        // Replace last item
        setSelectedNames([selectedNames[0], selectedNames[1], name]);
      }
    }
  };

  // Build data points for the 6 radar axes
  const radarData = useMemo(() => {
    return DIMENSIONS.map(dim => {
      const row = { dimension: dim };
      selectedNames.forEach(name => {
        const prod = qualityProfiles.find(p => p.product_name === name);
        if (prod && prod.dimensions && prod.dimensions[dim]) {
          row[name] = prod.dimensions[dim].score;
        } else {
          row[name] = 50; // default baseline
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
          <div className="perf-empty-box">No product quality data available.</div>
        ) : (
          <div className="perf-radar-layout">
            <div className="perf-radar-container" style={{ width: '100%', height: 310 }}>
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
            </div>

            {/* Product Selector / Legend */}
            <div className="perf-radar-legend">
              <span className="perf-legend-header">Comparing ({selectedNames.length}/3)</span>
              <div className="perf-radar-chips">
                {selectedNames.map((name, idx) => (
                  <div key={name} className="perf-radar-chip active">
                    <span
                      className="perf-category-dot"
                      style={{ background: productColors[idx % productColors.length] }}
                    />
                    <span className="perf-chip-text" title={name}>{name}</span>
                  </div>
                ))}
              </div>

              {candidateNames.length > 3 && (
                <div className="perf-radar-selector-list">
                  <span className="perf-selector-subhead">Toggle candidate:</span>
                  <div className="perf-selector-scroll">
                    {candidateNames.slice(0, 10).map(name => {
                      const isSel = selectedNames.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`perf-selector-btn ${isSel ? 'selected' : ''}`}
                          onClick={() => toggleProduct(name)}
                          title={`Toggle comparison for ${name}`}
                        >
                          <span className="perf-check-icon">{isSel ? <Check size={12} strokeWidth={3} /> : null}</span>
                          <span className="perf-selector-name">{name}</span>
                        </button>
                      );
                    })}
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
