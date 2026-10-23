import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Filter, RotateCcw, Search, Database, X
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { getPerformanceData, getAvailableDatasets } from '../services/performanceService';
import { aggregatePerformanceData } from '../utils/performanceCalculations';

import PerformanceKPICards from '../components/performance/PerformanceKPICards';
import TopBottomProductsChart from '../components/performance/TopBottomProductsChart';
import RiskVolumeChart from '../components/performance/RiskVolumeChart';
import ComplaintFrequencyChart from '../components/performance/ComplaintFrequencyChart';
import ComplaintBreakdownChart from '../components/performance/ComplaintBreakdownChart';
import ProductQualityRadar from '../components/performance/ProductQualityRadar';
import PerformanceRankingsModal from '../components/performance/PerformanceRankingsModal';

import ErrorState from '../components/ErrorState';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonCard';
import './Performance.css';

export default function Performance() {
  const navigate = useNavigate();
  const { uploadResult, uploadStatus } = useApp();

  // Dataset selection
  const [datasetsList, setDatasetsList] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('SentimentScope_1000_random_reviews.csv');

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiData, setApiData] = useState(null);

  // Modal states
  const [rankingsModalOpen, setRankingsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('All Ranked Products');

  // Load available datasets on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDatasets() {
      try {
        const res = await getAvailableDatasets();
        if (isMounted && res?.datasets?.length) {
          const list = res.datasets.map(d => d.filename);
          // If active uploadResult has a filename, put it at front
          if (uploadResult?.filename && !list.includes(uploadResult.filename)) {
            list.unshift(uploadResult.filename);
          }
          setDatasetsList(list);

          // Select default
          if (uploadResult?.filename) {
            setSelectedDataset(uploadResult.filename);
          } else if (list.includes('SentimentScope_1000_random_reviews.csv')) {
            setSelectedDataset('SentimentScope_1000_random_reviews.csv');
          } else {
            setSelectedDataset(list[0]);
          }
        }
      } catch (err) {
        console.warn('Could not list datasets from API, using defaults:', err);
        const fallback = ['SentimentScope_1000_random_reviews.csv', 'sample_reviews.csv'];
        if (uploadResult?.filename && !fallback.includes(uploadResult.filename)) {
          fallback.unshift(uploadResult.filename);
        }
        if (isMounted) setDatasetsList(fallback);
      }
    }
    loadDatasets();
    return () => { isMounted = false; };
  }, [uploadResult?.filename]);

  // Fetch performance data when dataset or applied filters change
  const fetchData = useCallback(async () => {
    // If we have uploadResult matching the selectedDataset and reviews are in memory,
    // we can compute immediately on client or fetch from server.
    if (uploadResult?.filename === selectedDataset && uploadResult?.review_data?.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getPerformanceData({
        dataset: selectedDataset,
        category: categoryFilter,
        sentiment: sentimentFilter,
        search: appliedSearch
      });

      if (res?.status === 'success' && res?.data) {
        setApiData(res.data);
      } else {
        throw new Error(res?.message || 'Failed to load performance metrics.');
      }
    } catch (err) {
      console.error('Performance API error:', err);
      // If server is not responding, fallback to client-side data if available
      if (uploadResult?.review_data?.length) {
        console.info('Falling back to local uploadResult reviews.');
      } else {
        setError(err.response?.data?.message || err.message || 'Error connecting to analytics service.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDataset, categoryFilter, sentimentFilter, appliedSearch, uploadResult]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle client-side vs API data
  const currentPerformance = useMemo(() => {
    // If selected dataset is the current active uploadResult with review data in memory:
    if (uploadResult?.filename === selectedDataset && uploadResult?.review_data?.length) {
      return aggregatePerformanceData(uploadResult.review_data, {
        category: categoryFilter,
        sentiment: sentimentFilter,
        search: appliedSearch
      });
    }

    // Otherwise use API returned payload
    if (apiData) {
      return apiData;
    }

    return null;
  }, [uploadResult, selectedDataset, categoryFilter, sentimentFilter, appliedSearch, apiData]);

  const handleApplyFilters = () => {
    setAppliedSearch(searchInput);
  };

  const handleResetFilters = () => {
    setCategoryFilter('All');
    setSentimentFilter('All');
    setSearchInput('');
    setAppliedSearch('');
  };

  const handleSelectProduct = (productName) => {
    setSearchInput(productName);
    setAppliedSearch(productName);
  };

  const handleSelectComplaint = (complaintName) => {
    navigate(`/data?complaint=${encodeURIComponent(complaintName)}`);
  };

  const availableCategories = useMemo(() => {
    if (currentPerformance?.available_categories?.length) {
      return ['All', ...currentPerformance.available_categories];
    }
    return ['All'];
  }, [currentPerformance]);

  const hasActiveFilters = categoryFilter !== 'All' || sentimentFilter !== 'All' || appliedSearch !== '';

  if (loading && !currentPerformance) {
    return (
      <div className="page-container perf-page-container" id="performance-page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div className="perf-header-left">
            <div className="perf-header-icon"><TrendingUp size={20} /></div>
            <div>
              <h1 className="page-title">Product Performance</h1>
              <p className="page-subtitle">Product rankings and complaint intelligence</p>
            </div>
          </div>
        </div>
        <div className="perf-kpi-grid">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="perf-two-col-grid">
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
      </div>
    );
  }

  if (error && !currentPerformance) {
    return (
      <div className="page-container perf-page-container" style={{ maxWidth: 640 }}>
        <ErrorState
          title="Performance Data Unavailable"
          message={error}
          showHome
        />
      </div>
    );
  }

  const kpis = currentPerformance?.kpis || {};
  const topProducts = currentPerformance?.top_products || [];
  const bottomProducts = currentPerformance?.bottom_products || [];
  const allRanked = currentPerformance?.all_ranked_products || [];
  const scatterData = currentPerformance?.risk_volume_scatter || [];
  const commonComplaints = currentPerformance?.common_complaints || [];
  const complaintBreakdownWorst5 = currentPerformance?.complaint_breakdown_worst5 || [];
  const qualityProfiles = currentPerformance?.quality_profiles || [];

  return (
    <div className="page-container perf-page-container" id="performance-page">
      {/* Page Header (Matching Analytics) */}
      <div className="page-header perf-header">
        <div className="perf-header-left">
          <div className="perf-header-icon">
            <TrendingUp size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="page-title">Product Performance</h1>
            <p className="page-subtitle">Product rankings and complaint intelligence</p>
          </div>
        </div>

        {/* Dataset Selector */}
        <div className="perf-dataset-picker" id="dataset-selector-wrap">
          <Database size={14} style={{ color: 'var(--color-primary)' }} />
          <span className="perf-dataset-label">Dataset</span>
          <select
            className="perf-dataset-select"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            aria-label="Select active dataset"
            id="perf-dataset-select"
          >
            {datasetsList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Filter Bar (Matching Analytics .filter-bar) */}
      <div className="filter-bar perf-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} style={{ color: 'var(--color-text-subtle)' }} aria-hidden="true" />
          <span className="filter-bar-title">Filters</span>
        </div>

        {/* Category Filter */}
        <select
          className="input select filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          id="perf-category-filter"
        >
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'All' ? 'All Categories' : cat}
            </option>
          ))}
        </select>

        {/* Sentiment Filter */}
        <select
          className="input select filter-select"
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          aria-label="Filter by sentiment"
          id="perf-sentiment-filter"
        >
          <option value="All">All Sentiments</option>
          <option value="Positive">Positive</option>
          <option value="Neutral">Neutral</option>
          <option value="Negative">Negative</option>
        </select>

        {/* Search Product Input */}
        <div className="perf-search-wrap">
          <Search size={14} className="perf-search-icon" />
          <input
            type="text"
            className="perf-search-input"
            placeholder="Search product (e.g. headphone, phone...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            id="perf-product-search"
            aria-label="Search product by title"
          />
        </div>

        {/* Apply Filters Button */}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleApplyFilters}
          id="perf-apply-filters"
          style={{ gap: 6 }}
        >
          <Filter size={13} />
          Apply Filters
        </button>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleResetFilters}
            id="perf-reset-filters"
            style={{ gap: 6 }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* Active Filter Chips (Matching Analytics) */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <span className="section-label" style={{ fontSize: 11 }}>Active:</span>
          {categoryFilter !== 'All' && (
            <span className="tag tag-highlight" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Category: {categoryFilter}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => setCategoryFilter('All')} />
            </span>
          )}
          {sentimentFilter !== 'All' && (
            <span className="tag tag-highlight" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Sentiment: {sentimentFilter}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSentimentFilter('All')} />
            </span>
          )}
          {appliedSearch !== '' && (
            <span className="tag tag-highlight" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Search: {appliedSearch}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => { setSearchInput(''); setAppliedSearch(''); }} />
            </span>
          )}
        </div>
      )}

      {/* KPI Cards Row */}
      <PerformanceKPICards kpis={kpis} />

      {/* Row 1: Top 10 and Bottom 10 Ranked Products */}
      <TopBottomProductsChart
        topProducts={topProducts}
        bottomProducts={bottomProducts}
        onViewAll={() => {
          setModalTitle('All Ranked Products');
          setRankingsModalOpen(true);
        }}
        onSelectProduct={handleSelectProduct}
      />

      {/* Row 2: Risk vs Review Volume & Most Common Product Complaints */}
      <div className="perf-two-col-grid">
        <RiskVolumeChart
          scatterData={scatterData}
          riskThreshold={kpis.risk_threshold_pct || 40}
          onSelectProduct={handleSelectProduct}
        />
        <ComplaintFrequencyChart
          complaints={commonComplaints}
          totalReviews={kpis.total_reviews || 0}
          onViewAll={() => {
            setModalTitle('All Product Complaints');
            setRankingsModalOpen(true);
          }}
          onSelectComplaint={handleSelectComplaint}
        />
      </div>

      {/* Row 3: Complaint Breakdown (Worst 5) & Product Quality Profile (Radar) */}
      <div className="perf-two-col-grid">
        <ComplaintBreakdownChart
          breakdownData={complaintBreakdownWorst5}
        />
        <ProductQualityRadar
          qualityProfiles={qualityProfiles}
        />
      </div>

      {/* Modal for View All Rankings */}
      <PerformanceRankingsModal
        isOpen={rankingsModalOpen}
        onClose={() => setRankingsModalOpen(false)}
        products={allRanked}
        title={modalTitle}
      />
    </div>
  );
}
