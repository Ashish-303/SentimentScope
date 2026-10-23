import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Layers } from 'lucide-react';

const COMPLAINT_COLORS = {
  'Quality': '#D97706',
  'Battery': '#EAB308',
  'Delivery': '#16A34A',
  'Pricing': '#DC2626',
  'Design': '#7C3AED',
  'Service': '#2563EB',
  'Size & Fit': '#0891B2',
  'Size': '#0891B2',
  'Durability': '#0D9488',
  'Packaging': '#DB2777',
  'Performance': '#4F46E5',
  'Other': '#64748B'
};

function getComplaintColor(cat) {
  return COMPLAINT_COLORS[cat] || '#64748B';
}

const CustomBreakdownTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName || label;
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);

  return (
    <div className="perf-chart-tooltip">
      <div className="perf-tt-title">{fullName}</div>
      <div className="perf-tt-category">Total Detected Complaints: {total}</div>
      <div className="perf-tt-divider" />
      {payload.map((p) => {
        if (!p.value) return null;
        return (
          <div key={p.name} className="perf-tt-row">
            <span className="perf-tt-label">
              <span className="perf-dot" style={{ background: p.color || p.fill }} />
              {p.name}:
            </span>
            <strong className="perf-tt-val">{p.value}</strong>
          </div>
        );
      })}
    </div>
  );
};

export default function ComplaintBreakdownChart({ breakdownData = [] }) {
  // Extract all distinct complaint categories present in these worst 5 products
  const presentCategories = useMemo(() => {
    const cats = new Set();
    breakdownData.forEach(p => {
      Object.keys(p.issues || {}).forEach(c => cats.add(c));
    });
    return Array.from(cats);
  }, [breakdownData]);

  // Transform data for Recharts stacked bar
  const chartData = useMemo(() => {
    return breakdownData.map(p => {
      const short = p.product_name.length > 14 ? `${p.product_name.slice(0, 12)}…` : p.product_name;
      return {
        name: short,
        fullName: p.product_name,
        ...p.issues
      };
    });
  }, [breakdownData]);

  return (
    <div className="perf-card">
      <div className="perf-card-header">
        <div className="perf-card-title-group">
          <Layers size={17} strokeWidth={2.2} className="perf-title-icon" />
          <h2 className="perf-card-title">Complaint Breakdown (Worst 5 Products)</h2>
        </div>
        <span className="section-label" style={{ color: 'var(--color-text-muted)' }}>
          By Issue Category
        </span>
      </div>

      <div className="perf-card-body">
        {chartData.length === 0 ? (
          <div className="perf-empty-box">No products with detected complaints.</div>
        ) : (
          <div className="perf-breakdown-layout">
            <div className="perf-breakdown-chart" style={{ width: '100%', height: 290 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -5, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-border)"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    interval={0}
                  />
                  <YAxis
                    stroke="var(--color-border)"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    label={{
                      value: 'Number of Mentions',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 14,
                      fill: 'var(--color-text-muted)',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  />
                  <Tooltip content={<CustomBreakdownTooltip />} cursor={{ fill: 'var(--color-primary-muted)' }} />
                  {presentCategories.map(cat => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      name={cat}
                      stackId="complaints"
                      fill={getComplaintColor(cat)}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend on Right */}
            <div className="perf-breakdown-legend">
              <span className="perf-legend-header">Issue Category</span>
              {presentCategories.map(cat => (
                <div key={cat} className="perf-category-item" title={cat}>
                  <span
                    className="perf-category-dot"
                    style={{ background: getComplaintColor(cat) }}
                  />
                  <span className="perf-category-name">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
