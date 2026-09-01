import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import KPICard from '../components/KPICard';
import ErrorState from '../components/ErrorState';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonCard';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  FileText, TrendingUp, AlertTriangle, CheckCircle2, Package, Activity, Sparkles, Filter, RotateCcw, X
} from 'lucide-react';

const COLORS = {
  Positive: '#16A34A',
  Neutral:  '#D97706',
  Negative: '#DC2626',
};

const SENTIMENTS = ['All', 'Positive', 'Neutral', 'Negative'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 12,
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--color-text)', fontSize: 13 }}>{label}</div>}
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: 'var(--color-text-muted)', marginBottom: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, display: 'inline-block', flexShrink: 0 }} />
            {p.name}
          </span>
          <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
            {p.value?.toLocaleString()}
          </strong>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const navigate = useNavigate();
  const { uploadResult, uploadStatus } = useApp();

  const kpiRef = useScrollReveal();
  const chart1Ref = useScrollReveal(0.05);
  const chart2Ref = useScrollReveal(0.05);
  const chart3Ref = useScrollReveal(0.05);

  const reviews = useMemo(() => uploadResult?.review_data || [], [uploadResult]);

  // Filters State
  const [catFilter, setCatFilter] = useState('All');
  const [sentFilter, setSentFilter] = useState('All');
  const [prodFilter, setProdFilter] = useState('All');

  // Filter lists derived from data
  const categoriesList = useMemo(() => {
    const cats = [...new Set(reviews.map(r => r.Category).filter(Boolean))].sort();
    return ['All', ...cats];
  }, [reviews]);

  const productsList = useMemo(() => {
    const prods = [...new Set(reviews.map(r => r.Product_Name).filter(Boolean))].sort();
    return ['All', ...prods];
  }, [reviews]);

  // Filtered dataset
  const filteredReviews = useMemo(() => {
    let data = reviews;
    if (catFilter !== 'All') data = data.filter(r => r.Category === catFilter);
    if (sentFilter !== 'All') data = data.filter(r => r.Predicted_Sentiment === sentFilter);
    if (prodFilter !== 'All') data = data.filter(r => r.Product_Name === prodFilter);
    return data;
  }, [reviews, catFilter, sentFilter, prodFilter]);

  const hasActiveFilters = catFilter !== 'All' || sentFilter !== 'All' || prodFilter !== 'All';

  const resetFilters = () => {
    setCatFilter('All');
    setSentFilter('All');
    setProdFilter('All');
  };

  // KPIs computed over filtered dataset
  const kpis = useMemo(() => {
    const total = filteredReviews.length;
    let pos = 0, neg = 0, neu = 0;
    const products = new Set();
    const issueCounts = {};

    filteredReviews.forEach(r => {
      if (r.Predicted_Sentiment === 'Positive') pos++;
      else if (r.Predicted_Sentiment === 'Negative') neg++;
      else if (r.Predicted_Sentiment === 'Neutral') neu++;

      if (r.Product_Name) products.add(r.Product_Name);

      if (r.Detected_Issues) {
        r.Detected_Issues.split(',').forEach(c => {
          const t = c.trim();
          if (t && t !== 'Other') {
            issueCounts[t] = (issueCounts[t] || 0) + 1;
          }
        });
      }
    });

    const posPct = total ? `${((pos / total) * 100).toFixed(1)}%` : '0%';
    const negPct = total ? `${((neg / total) * 100).toFixed(1)}%` : '0%';
    const topComplaint = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return { total, pos, neg, neu, posPct, negPct, topComplaint, productsCount: products.size };
  }, [filteredReviews]);

  // Chart 1: Sentiment Distribution by Category
  const sentimentByCategory = useMemo(() => {
    const map = {};
    filteredReviews.forEach(r => {
      const cat = r.Category || 'Unknown';
      if (!map[cat]) map[cat] = { category: cat, Positive: 0, Neutral: 0, Negative: 0 };
      if (r.Predicted_Sentiment === 'Positive') map[cat].Positive++;
      else if (r.Predicted_Sentiment === 'Neutral') map[cat].Neutral++;
      else if (r.Predicted_Sentiment === 'Negative') map[cat].Negative++;
    });
    return Object.values(map)
      .sort((a, b) => (b.Positive + b.Neutral + b.Negative) - (a.Positive + a.Neutral + a.Negative))
      .slice(0, 10);
  }, [filteredReviews]);

  // Chart 2: Overall Sentiment Pie
  const pieData = useMemo(() => {
    const summary = { Positive: 0, Neutral: 0, Negative: 0 };
    filteredReviews.forEach(r => {
      if (r.Predicted_Sentiment) {
        summary[r.Predicted_Sentiment] = (summary[r.Predicted_Sentiment] || 0) + 1;
      }
    });
    return Object.entries(summary).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [filteredReviews]);

  // Chart 3: Review Volume by Category
  const categoryVolume = useMemo(() => {
    const summary = {};
    filteredReviews.forEach(r => {
      const cat = r.Category || 'Unknown';
      summary[cat] = (summary[cat] || 0) + 1;
    });
    return Object.entries(summary)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredReviews]);

  // Chart 4: Top Complaints
  const topComplaints = useMemo(() => {
    const counts = {};
    filteredReviews.forEach(r => {
      if (r.Detected_Issues) {
        r.Detected_Issues.split(',').forEach(c => {
          const t = c.trim();
          if (t && t !== 'Other') counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredReviews]);

  // Chart 5: Top Highlights
  const topHighlights = useMemo(() => {
    const counts = {};
    filteredReviews.forEach(r => {
      if (r.Positive_Features) {
        r.Positive_Features.split(',').forEach(h => {
          const t = h.trim();
          if (t && t !== 'General Satisfaction') counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredReviews]);

  // AI insights derived deterministically
  const aiInsights = useMemo(() => {
    if (filteredReviews.length === 0) return [];
    const insights = [];

    // Volume category
    const catVol = {};
    const issues = {};
    let posCount = 0, negCount = 0;
    filteredReviews.forEach(r => {
      const cat = r.Category || 'Unknown';
      catVol[cat] = (catVol[cat] || 0) + 1;
      if (r.Predicted_Sentiment === 'Positive') posCount++;
      if (r.Predicted_Sentiment === 'Negative') negCount++;
      if (r.Detected_Issues) {
        r.Detected_Issues.split(',').forEach(c => {
          const t = c.trim();
          if (t && t !== 'Other') issues[t] = (issues[t] || 0) + 1;
        });
      }
    });

    const topCat = Object.entries(catVol).sort((a,b) => b[1] - a[1])[0]?.[0];
    const topIss = Object.entries(issues).sort((a,b) => b[1] - a[1])[0]?.[0];

    if (topIss) {
      insights.push(`"${topIss}" is the most frequently identified complaint in the selected reviews.`);
    }
    if (posCount > negCount) {
      insights.push(`Positive feedback dominates the selected reviews (${((posCount / filteredReviews.length)*100).toFixed(0)}% positive).`);
    } else if (negCount > posCount) {
      insights.push(`Negative feedback is highly active in the selected reviews (${((negCount / filteredReviews.length)*100).toFixed(0)}% negative).`);
    }
    if (topCat) {
      insights.push(`Category "${topCat}" contains the largest volume of review records.`);
    }

    return insights;
  }, [filteredReviews]);

  // KPI card redirects
  const handleKPIClick = (type, val) => {
    if (type === 'sentiment') navigate(`/data?sentiment=${val}`);
    else if (type === 'complaint' && val !== '—') navigate(`/data?complaint=${val}`);
    else navigate(`/data`);
  };

  /* Loading State */
  if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
    return (
      <div className="page-container">
        <div style={{ marginBottom: 28 }}>
          <div className="skeleton" style={{ height: 28, width: 180, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: 260 }} />
        </div>
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart height={280} />
      </div>
    );
  }

  /* Empty State */
  if (!uploadResult) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <ErrorState
          title="No analytics yet"
          message="Upload a CSV of product reviews to generate your sentiment dashboard."
          showHome
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          Interactive metrics workspace for <strong>{uploadResult.filename}</strong>
        </p>
      </div>

      {/* Global Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} style={{ color: 'var(--color-text-subtle)' }} aria-hidden="true" />
          <span className="filter-bar-title">Filters</span>
        </div>
        
        <select
          className="input select filter-select"
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          aria-label="Filter by category"
        >
          {categoriesList.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>

        <select
          className="input select filter-select"
          value={sentFilter}
          onChange={e => setSentFilter(e.target.value)}
          aria-label="Filter by sentiment"
        >
          {SENTIMENTS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sentiments' : s}</option>)}
        </select>

        <select
          className="input select filter-select"
          value={prodFilter}
          onChange={e => setProdFilter(e.target.value)}
          aria-label="Filter by product"
        >
          {productsList.map(p => <option key={p} value={p}>{p === 'All' ? 'All Products' : p}</option>)}
        </select>

        {hasActiveFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={resetFilters}
            style={{ gap: 6, padding: '6px 12px' }}
            id="analytics-reset-filters"
          >
            <RotateCcw size={12} strokeWidth={2.5} />
            Reset
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <span className="section-label" style={{ fontSize: 11 }}>Active:</span>
          {catFilter !== 'All' && (
            <span className="tag tag-highlight" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Category: {catFilter}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => setCatFilter('All')} />
            </span>
          )}
          {sentFilter !== 'All' && (
            <span className="tag tag-highlight" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Sentiment: {sentFilter}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSentFilter('All')} />
            </span>
          )}
          {prodFilter !== 'All' && (
            <span className="tag tag-highlight" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Product: {prodFilter}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => setProdFilter('All')} />
            </span>
          )}
        </div>
      )}

      {/* AI Insights Section */}
      {aiInsights.length > 0 && (
        <div className="ai-insights-box">
          <h2 className="ai-insights-title">
            <Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />
            Intelligence Briefing
          </h2>
          <div className="ai-insights-list" role="list">
            {aiInsights.map((ins, idx) => (
              <div key={idx} className="ai-insights-item" role="listitem">
                <span className="ai-insights-bullet" aria-hidden="true">✦</span>
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Row (Actionable clicks) */}
      <div ref={kpiRef} className="kpi-grid reveal" style={{ marginBottom: 28 }}>
        <div className="kpi-card-interactive" onClick={() => handleKPIClick('all')}>
          <KPICard
            label="Total Reviews"
            value={kpis?.total?.toLocaleString()}
            icon={FileText}
            subtitle="Explore in Data Table"
          />
        </div>
        <div className="kpi-card-interactive" onClick={() => handleKPIClick('sentiment', 'Positive')}>
          <KPICard
            label="Positive"
            value={kpis?.pos?.toLocaleString()}
            icon={CheckCircle2}
            color="var(--color-positive)"
            subtitle={kpis?.posPct}
          />
        </div>
        <div className="kpi-card-interactive" onClick={() => handleKPIClick('sentiment', 'Neutral')}>
          <KPICard
            label="Neutral"
            value={kpis?.neu?.toLocaleString()}
            icon={Activity}
            color="var(--color-neutral)"
          />
        </div>
        <div className="kpi-card-interactive" onClick={() => handleKPIClick('sentiment', 'Negative')}>
          <KPICard
            label="Negative"
            value={kpis?.neg?.toLocaleString()}
            icon={AlertTriangle}
            color="var(--color-negative)"
            subtitle={kpis?.negPct}
          />
        </div>
        <div className="kpi-card-interactive" onClick={() => handleKPIClick('complaint', kpis?.topComplaint)}>
          <KPICard
            label="Top Complaint"
            value={kpis?.topComplaint}
            icon={AlertTriangle}
            color="var(--color-negative)"
            description="View reviews"
          />
        </div>
        <div className="kpi-card-interactive" onClick={() => handleKPIClick('all')}>
          <KPICard
            label="Products"
            value={kpis?.productsCount?.toLocaleString() || '—'}
            icon={Package}
            subtitle="distinct reviews"
          />
        </div>
      </div>

      {/* Primary chart — Sentiment by Category */}
      {sentimentByCategory.length > 0 && (
        <div ref={chart1Ref} className="card reveal" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <span className="card-title">Sentiment Distribution by Category</span>
            <span className="section-label">Click bar to filter category</span>
          </div>
          <div className="card-body" style={{ paddingTop: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sentimentByCategory}
                margin={{ top: 4, right: 8, left: -8, bottom: 44 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar
                  dataKey="Positive"
                  fill={COLORS.Positive}
                  radius={[3,3,0,0]}
                  maxBarSize={32}
                  onClick={(d) => d && d.category && setCatFilter(d.category)}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="Neutral"
                  fill={COLORS.Neutral}
                  radius={[3,3,0,0]}
                  maxBarSize={32}
                  onClick={(d) => d && d.category && setCatFilter(d.category)}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="Negative"
                  fill={COLORS.Negative}
                  radius={[3,3,0,0]}
                  maxBarSize={32}
                  onClick={(d) => d && d.category && setCatFilter(d.category)}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Secondary row — Pie + Category volume */}
      <div ref={chart2Ref} className="charts-grid-2 reveal" style={{ marginBottom: 20 }}>
        {pieData.length > 0 && (
          <div className="card">
            <div className="card-header"><span className="card-title">Overall Sentiment</span></div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[entry.name] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }} onClick={() => setSentFilter(d.name)}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[d.name] || '#888', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{d.name}</span>
                    <strong style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{d.value?.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {categoryVolume.length > 0 && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <span className="card-title">Volume by Category</span>
              <span className="section-label">Click bar to filter</span>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryVolume} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Reviews"
                    fill="var(--color-primary)"
                    radius={[0,3,3,0]}
                    maxBarSize={20}
                    onClick={(d) => d && d.name && setCatFilter(d.name)}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Tertiary row — Complaints + Highlights */}
      <div ref={chart3Ref} className="charts-grid-2 reveal">
        {topComplaints.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Complaint Types</span>
              <span className="section-label" style={{ color: 'var(--color-negative)' }}>Complaints</span>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topComplaints} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Count"
                    fill={COLORS.Negative}
                    radius={[0,3,3,0]}
                    maxBarSize={20}
                    onClick={(d) => d && d.name && navigate(`/data?complaint=${d.name}`)}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {topHighlights.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Positive Features</span>
              <span className="section-label" style={{ color: 'var(--color-positive)' }}>Highlights</span>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topHighlights} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={130} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Count"
                    fill={COLORS.Positive}
                    radius={[0,3,3,0]}
                    maxBarSize={20}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
