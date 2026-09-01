import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { uploadCSV } from '../api/sentimentApi';
import PipelineHero from '../components/PipelineHero';
import { 
  UploadCloud, Download, AlertCircle, CheckCircle2, ArrowRight, 
  FileSpreadsheet, Loader2, Sparkles, BarChart3, Brain, ShieldAlert, 
  HelpCircle, Check, Database
} from 'lucide-react';

const REQUIRED_COLUMNS = ['product_title', 'category', 'review_text'];

const SAMPLE_CSV_CONTENT = `product_title,category,review_text
Wireless Bluetooth Headphones,Electronics,"The battery lasts all day and the sound quality is excellent. Very comfortable to wear."
Smart LED Desk Lamp,Home & Kitchen,"The brightness levels are perfect and the USB charging port is super convenient. Love it!"
Running Shoes Pro,Sports & Outdoors,"The shoes are comfortable but the sizing runs a bit small. Order half a size up."
Anti-Aging Face Serum,Beauty,"Noticed real improvement in skin texture after 2 weeks. Absorbs quickly with no greasy feel."
Stainless Steel Water Bottle,Home & Kitchen,"The bottle leaked from the lid after just a week. Very disappointing quality for the price."
Mechanical Gaming Keyboard,Electronics,"The keys feel premium but the software crashed multiple times. Customer support was unhelpful."
Yoga Mat Non-Slip,Sports & Outdoors,"Great grip and perfect thickness. Easy to clean and rolls up nicely. Highly recommended."
Vitamin C Supplement 1000mg,Health & Personal Care,"No noticeable effect after a month of use. Tablets are hard to swallow and smell odd."
`;

export default function Home() {
  const navigate = useNavigate();
  const { setUploadResult, setUploadStatus, setUploadError, saveHistory } = useApp();
  const fileInputRef = useRef(null);
  
  // 5 upload states: 'idle' | 'dragging' | 'selected' | 'processing' | 'complete'
  const [internalState, setInternalState] = useState('idle');
  const [file, setFile] = useState(null);
  const [fileStats, setFileStats] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [processingStage, setProcessingStage] = useState('');

  // Floating cards interactive state
  const [hoveredCard, setHoveredCard] = useState(null);

  const parseCSVStats = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length <= 1) {
            resolve({ reviews: 0, products: 0, categories: 0 });
            return;
          }
          const header = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
          const productIdx = header.indexOf('product_title');
          const categoryIdx = header.indexOf('category');
          
          const products = new Set();
          const categories = new Set();
          let validRows = 0;
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            let cells = [];
            let currentCell = '';
            let inQuotes = false;
            for (let c = 0; c < line.length; c++) {
              const char = line[c];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                cells.push(currentCell.trim());
                currentCell = '';
              } else {
                currentCell += char;
              }
            }
            cells.push(currentCell.trim());
            
            if (cells.length > 0 && cells.some(Boolean)) {
              validRows++;
              if (productIdx !== -1 && cells[productIdx]) {
                products.add(cells[productIdx].replace(/^["']|["']$/g, '').trim());
              }
              if (categoryIdx !== -1 && cells[categoryIdx]) {
                categories.add(cells[categoryIdx].replace(/^["']|["']$/g, '').trim());
              }
            }
          }
          resolve({
            reviews: validRows,
            products: products.size || 1,
            categories: categories.size || 1
          });
        } catch (err) {
          resolve({ reviews: 0, products: 0, categories: 0 });
        }
      };
      reader.readAsText(file);
    });
  };

  const selectFile = useCallback(async (selected) => {
    setValidationError(null);
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setValidationError('Only .csv files are accepted. Please select a CSV file and try again.');
      setInternalState('idle');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setValidationError('File exceeds the 10 MB limit. Please reduce the file size and try again.');
      setInternalState('idle');
      return;
    }

    setFile(selected);
    setInternalState('selected');
    const stats = await parseCSVStats(selected);
    setFileStats(stats);
  }, []);

  const triggerAnalysis = async (fileToAnalyze = file) => {
    const targetFile = fileToAnalyze || file;
    if (!targetFile) return;

    setInternalState('processing');
    setUploadStatus('uploading');
    setUploadError(null);

    // Dynamic processing stages
    const stages = [
      'Preparing reviews & schema…',
      'Running text normalizations…',
      'Running sentiment classification…',
      'Extracting complaint signals…',
      'Building operational insights…'
    ];
    let stageIdx = 0;
    setProcessingStage(stages[0]);
    const stageTimer = setInterval(() => {
      if (stageIdx < stages.length - 1) {
        stageIdx++;
        setProcessingStage(stages[stageIdx]);
      }
    }, 1500);

    try {
      const result = await uploadCSV(targetFile);
      clearInterval(stageTimer);

      if (result.status !== 'success') throw new Error(result.message || 'Upload failed');
      
      setUploadResult(result);
      setUploadStatus('success');
      saveHistory({
        filename: result.filename,
        rows: result.rows_processed,
        date: new Date().toISOString(),
        summary: result.dashboard?.sentiment_summary || {},
      });
      setInternalState('complete');
    } catch (err) {
      clearInterval(stageTimer);
      const msg = err.response?.data?.message || err.message || 'Upload failed. Please check your file and try again.';
      setUploadError(msg);
      setUploadStatus('error');
      setValidationError(msg);
      setInternalState('idle');
      setFile(null);
      setFileStats(null);
    }
  };

  const handleExploreSample = async () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const sampleFile = new File([blob], 'sentimentscope_sample.csv', { type: 'text/csv' });
    setFile(sampleFile);
    const stats = await parseCSVStats(sampleFile);
    setFileStats(stats);
    triggerAnalysis(sampleFile);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) selectFile(dropped);
  }, [selectFile]);

  const onDragOver = useCallback((e) => { 
    e.preventDefault(); 
    setInternalState('dragging'); 
  }, []);
  
  const onDragLeave = useCallback(() => { 
    setInternalState('idle'); 
  }, []);

  const onFileChange = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (selected) selectFile(selected);
    e.target.value = '';
  }, [selectFile]);

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentimentscope_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setFileStats(null);
    setValidationError(null);
    setInternalState('idle');
  };

  return (
    <div className="landing-wrap" onDragOver={onDragOver} onDrop={onDrop}>
      {/* Premium dark glows & grid lines background */}
      <div className="landing-bg-glows" aria-hidden="true" />
      <div className="landing-bg-grid" aria-hidden="true" />

      {/* Floating glass navbar */}
      <nav className="glass-nav" aria-label="Main Navigation">
        <div className="nav-logo">
          <div className="nav-logo-mark">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 13a5 5 0 0 1 10 0" stroke="var(--accent-glow-blue)" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="10" cy="13" r="2" fill="var(--accent-glow-blue)"/>
              <circle cx="10" cy="7.5" r="1.5" fill="var(--accent-glow-cyan)" fillOpacity="0.6"/>
            </svg>
          </div>
          <span className="nav-brand">SentimentScope</span>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link active">Home</Link>
          <Link to="/analytics" className="nav-link">Analytics</Link>
          <Link to="/highlights" className="nav-link">Insights</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
        <div className="nav-cta">
          <button className="nav-btn-upload" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={14} style={{ marginRight: 6 }} aria-hidden="true" />
            Upload CSV
          </button>
        </div>
      </nav>

      {/* Hero container */}
      <header className="hero-section">
        <div className="hero-grid">
          {/* Hero Left: Headlines & CTAs */}
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot">●</span>
              RESEARCH-BACKED REVIEW ANALYSIS
            </div>

            <h1 className="hero-headline">
              TURN CUSTOMER REVIEWS<br />
              INTO <span className="title-gradient">PRODUCT INTELLIGENCE.</span>
            </h1>

            <p className="hero-subheadline">
              Upload your product reviews and uncover sentiment, customer complaints, 
              positive highlights, and category-level insights — all from one analysis workspace.
            </p>

            {/* File Ingestion Workspace Inline within Hero */}
            <div className="hero-workspace">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={onFileChange}
                style={{ display: 'none' }}
                id="hero-file-input"
                aria-label="CSV reviews input"
              />

              {/* STATE 1: IDLE */}
              {internalState === 'idle' && (
                <div className="cta-group">
                  <button className="btn-cta-primary" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud size={16} style={{ marginRight: 8 }} aria-hidden="true" />
                    Upload CSV File
                  </button>
                  <button className="btn-cta-secondary" onClick={handleExploreSample}>
                    <Sparkles size={15} style={{ marginRight: 8, color: 'var(--accent-glow-cyan)' }} aria-hidden="true" />
                    Explore Sample
                  </button>
                </div>
              )}

              {/* STATE 2: DRAGGING */}
              {internalState === 'dragging' && (
                <div className="cta-drag-overlay" onDragLeave={onDragLeave}>
                  <UploadCloud size={28} className="icon-pulse text-cyan" aria-hidden="true" />
                  <span>Release CSV to analyze</span>
                </div>
              )}

              {/* STATE 3: FILE SELECTED */}
              {internalState === 'selected' && fileStats && (
                <div className="selected-card glass-panel">
                  <div className="selected-info">
                    <FileSpreadsheet size={24} className="icon-cyan" aria-hidden="true" />
                    <div className="selected-meta">
                      <span className="selected-filename">{file?.name}</span>
                      <span className="selected-filesize">{(file?.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <div className="selected-stats">
                    <div className="mini-stat">
                      <span className="mini-num">{fileStats.reviews.toLocaleString()}</span>
                      <span className="mini-label">reviews</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-num">{fileStats.products}</span>
                      <span className="mini-label">products</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-num">{fileStats.categories}</span>
                      <span className="mini-label">categories</span>
                    </div>
                  </div>
                  <div className="selected-buttons">
                    <button className="btn-reset" onClick={handleReset}>Cancel</button>
                    <button className="btn-submit" onClick={() => triggerAnalysis()}>
                      Run Intelligence Pipeline
                      <ArrowRight size={14} style={{ marginLeft: 6 }} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 4: PROCESSING */}
              {internalState === 'processing' && (
                <div className="processing-card glass-panel">
                  <PipelineHero />
                  <div className="processing-progress">
                    <Loader2 size={16} className="icon-spin text-cyan" aria-hidden="true" />
                    <span>{processingStage}</span>
                  </div>
                </div>
              )}

              {/* STATE 5: COMPLETE */}
              {internalState === 'complete' && fileStats && (
                <div className="complete-card glass-panel">
                  <div className="complete-check">
                    <CheckCircle2 size={32} className="text-green" aria-hidden="true" />
                  </div>
                  <h3 className="complete-title">Analysis Successful</h3>
                  <p className="complete-desc">
                    Processed <strong>{fileStats.reviews.toLocaleString()}</strong> reviews from <code>{file?.name}</code>.
                  </p>
                  <div className="complete-buttons">
                    <button className="btn-reset" onClick={handleReset}>Upload Another</button>
                    <button className="btn-submit" onClick={() => navigate('/analytics')}>
                      Open Analytics Workspace
                      <ArrowRight size={14} style={{ marginLeft: 6 }} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* Schema verification indicators */}
              {validationError && (
                <div className="validation-alert" role="alert" aria-live="polite">
                  <AlertCircle size={15} style={{ marginRight: 8, flexShrink: 0 }} aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}

              {internalState === 'idle' && (
                <div className="schema-section">
                  <div className="schema-label">REQUIRED COLUMNS:</div>
                  <div className="schema-pills">
                    {REQUIRED_COLUMNS.map(col => (
                      <span key={col} className="schema-pill">{col}</span>
                    ))}
                  </div>
                  <button className="btn-download-sample" onClick={downloadSample}>
                    <Download size={11} style={{ marginRight: 4 }} aria-hidden="true" />
                    Download Sample.csv
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hero Right: Floating Product Proof Cards */}
          <div className="hero-visualization">
            {/* Card 1: Sentiment Overview Donut */}
            <div 
              className={`proof-card card-sentiment glass-panel ${hoveredCard === 'sentiment' ? 'card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('sentiment')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="proof-card-header">
                <span className="proof-card-title">Sentiment Distribution</span>
                <span className="proof-card-badge">SAMPLE ANALYSIS</span>
              </div>
              <div className="proof-chart-donut">
                <svg width="100" height="100" viewBox="0 0 36 36" className="donut-svg">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  
                  {/* Positive: 68% (dasharray: 68 32, offset: 25) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-positive)" strokeWidth="3" 
                          strokeDasharray="68 32" strokeDashoffset="25" />
                          
                  {/* Neutral: 17% (dasharray: 17 83, offset: -43) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-neutral)" strokeWidth="3" 
                          strokeDasharray="17 83" strokeDashoffset="-43" />
                          
                  {/* Negative: 15% (dasharray: 15 85, offset: -60) */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-negative)" strokeWidth="3" 
                          strokeDasharray="15 85" strokeDashoffset="-60" />
                </svg>
                <div className="donut-center">
                  <span className="donut-pct">68%</span>
                  <span className="donut-lbl">Positive</span>
                </div>
              </div>
              <div className="donut-legend">
                <span className="legend-item"><span className="dot dot-green" />Pos (68%)</span>
                <span className="legend-item"><span className="dot dot-orange" />Neu (17%)</span>
                <span className="legend-item"><span className="dot dot-red" />Neg (15%)</span>
              </div>
            </div>

            {/* Card 2: Complaint Analysis Bar Chart */}
            <div 
              className={`proof-card card-complaints glass-panel ${hoveredCard === 'complaints' ? 'card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('complaints')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="proof-card-header">
                <span className="proof-card-title">Top Complaint Types</span>
                <span className="proof-card-badge">DEMO DATA</span>
              </div>
              <div className="complaint-bars">
                <div className="bar-row">
                  <div className="bar-label">Quality</div>
                  <div className="bar-container">
                    <div className="bar-fill bar-fill-red" style={{ width: '52%' }} />
                  </div>
                  <span className="bar-value">52%</span>
                </div>
                <div className="bar-row">
                  <div className="bar-label">Packaging</div>
                  <div className="bar-container">
                    <div className="bar-fill bar-fill-amber" style={{ width: '28%' }} />
                  </div>
                  <span className="bar-value">28%</span>
                </div>
                <div className="bar-row">
                  <div className="bar-label">Pricing</div>
                  <div className="bar-container">
                    <div className="bar-fill bar-fill-gray" style={{ width: '15%' }} />
                  </div>
                  <span className="bar-value">15%</span>
                </div>
                <div className="bar-row">
                  <div className="bar-label">Service</div>
                  <div className="bar-container">
                    <div className="bar-fill bar-fill-gray" style={{ width: '5%' }} />
                  </div>
                  <span className="bar-value">5%</span>
                </div>
              </div>
            </div>

            {/* Card 3: KPI Metrics Cluster */}
            <div 
              className={`proof-card card-kpis glass-panel ${hoveredCard === 'kpis' ? 'card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('kpis')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="kpi-grid">
                <div className="kpi-box">
                  <span className="kpi-num">1,000</span>
                  <span className="kpi-label">TOTAL REVIEWS</span>
                </div>
                <div className="kpi-box">
                  <span className="kpi-num text-green">466</span>
                  <span className="kpi-label">POSITIVE</span>
                </div>
                <div className="kpi-box">
                  <span className="kpi-num text-red">265</span>
                  <span className="kpi-label">NEGATIVE</span>
                </div>
              </div>
            </div>

            {/* Card 4: Customer Voice Preview */}
            <div 
              className={`proof-card card-voice glass-panel ${hoveredCard === 'voice' ? 'card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('voice')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="proof-card-header">
                <span className="proof-card-title">Customer Voice Summary</span>
                <span className="voice-tag">INSIGHTS PREVIEW</span>
              </div>
              <div className="voice-items">
                <div className="voice-pill-row">
                  <span className="voice-pill pill-red">Top Complaint: Quality</span>
                  <span className="voice-pill pill-green">Top Highlight: Value for Money</span>
                </div>
                <blockquote className="voice-excerpt">
                  "The battery lasts all day and the sound quality is excellent. Very comfortable to wear…"
                </blockquote>
                <span className="voice-meta">Wireless Headphones · Electronics</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Second Section: How It Works */}
      <section className="how-it-works" aria-labelledby="section-how">
        <h2 id="section-how" className="section-title">
          FROM RAW REVIEWS TO PRODUCT INTELLIGENCE
        </h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3 className="step-title">Upload Dataset</h3>
            <p className="step-desc">
              Import a CSV containing review text, categories, and titles.
            </p>
          </div>
          <div className="step-line" aria-hidden="true" />
          <div className="step-card">
            <div className="step-num">02</div>
            <h3 className="step-title">AI Processing</h3>
            <p className="step-desc">
              ML pipeline normalizes features and predicts 3-class sentiment.
            </p>
          </div>
          <div className="step-line" aria-hidden="true" />
          <div className="step-card">
            <div className="step-num">03</div>
            <h3 className="step-title">Uncover Insights</h3>
            <p className="step-desc">
              Explore complaints, positive highlights, and catalog trends.
            </p>
          </div>
        </div>
      </section>

      {/* Product Capabilities Grid */}
      <section className="capabilities-section" aria-labelledby="section-capabilities">
        <h2 id="section-capabilities" className="section-title">
          INTELLIGENCE LAYER FEATURES
        </h2>
        <div className="capabilities-grid">
          <div className="cap-card glass-panel">
            <Brain className="cap-icon text-blue" size={24} aria-hidden="true" />
            <h3 className="cap-title">Sentiment Analysis</h3>
            <p className="cap-desc">
              High-precision classification across Positive, Neutral, and Negative labels.
            </p>
          </div>
          <div className="cap-card glass-panel">
            <ShieldAlert className="cap-icon text-red" size={24} aria-hidden="true" />
            <h3 className="cap-title">Complaint Detection</h3>
            <p className="cap-desc">
              Heuristics surface defects, sizing errors, safety, and delivery complaints.
            </p>
          </div>
          <div className="cap-card glass-panel">
            <Sparkles className="cap-icon text-cyan" size={24} aria-hidden="true" />
            <h3 className="cap-title">Highlight Detection</h3>
            <p className="cap-desc">
              Extract product design features and satisfaction phrases automatically.
            </p>
          </div>
          <div className="cap-card glass-panel">
            <BarChart3 className="cap-icon text-purple" size={24} aria-hidden="true" />
            <h3 className="cap-title">Category Intelligence</h3>
            <p className="cap-desc">
              Aggregate customer comments across product categories and catalogs.
            </p>
          </div>
        </div>
      </section>

      {/* Research Credibility Section */}
      <section className="credibility-section" aria-label="Research and methodology credibility">
        <div className="credibility-bg-glow" aria-hidden="true" />
        <div className="credibility-inner glass-panel">
          <span className="credibility-eyebrow">RESEARCH-BACKED METHODOLOGY</span>
          <h2 className="credibility-title">Grounded in Peer-Reviewed Validation</h2>
          <p className="credibility-desc">
            SentimentScope's linear architecture and preprocessing pipelines have been evaluated 
            and audited against strict statistical validation benchmarks.
          </p>
          <div className="credibility-stats">
            <div className="cred-stat">
              <span className="cred-num">26,400</span>
              <span className="cred-lbl">Balanced Reviews</span>
            </div>
            <div className="cred-stat">
              <span className="cred-num">15,829</span>
              <span className="cred-lbl">Deduplicated Train/Test Folds</span>
            </div>
            <div className="cred-stat">
              <span className="cred-num">76.32%</span>
              <span className="cred-lbl">Holdout Macro F1</span>
            </div>
            <div className="cred-stat">
              <span className="cred-num">Logistic Reg.</span>
              <span className="cred-lbl">Selected Production Model</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final Action CTA Footer */}
      <footer className="footer-cta">
        <div className="footer-glow" aria-hidden="true" />
        <h2 className="footer-title">Ready to Understand Your Customers?</h2>
        <p className="footer-desc">
          Upload your review dataset and explore the signals hidden inside customer feedback.
        </p>
        <button className="footer-btn-primary" onClick={() => fileInputRef.current?.click()}>
          <UploadCloud size={16} style={{ marginRight: 8 }} aria-hidden="true" />
          Upload Review Dataset
        </button>
      </footer>

      {/* Embedded Landing Page Specific Styles */}
      <style>{`
        /* --- Colors & Global variables --- */
        .landing-wrap {
          --accent-glow-blue: var(--color-primary);
          --accent-glow-cyan: #3dd6c6;
          --accent-glow-purple: #7c5cff;
          --glass-border: var(--color-border);
          --glass-bg: var(--color-surface);
          --font-family: 'Inter', -apple-system, sans-serif;
          
          background-color: var(--color-bg) !important;
          color: var(--color-text) !important;
          font-family: var(--font-family);
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow-x: hidden;
          padding-top: 100px;
          padding-bottom: 80px;
        }

        /* --- Ambient Atmospheric Gradients --- */
        .landing-bg-glows {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
          background: var(--bg-radial-glows);
        }

        .landing-bg-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 2;
          background-image: radial-gradient(var(--bg-grid-color) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(circle at 50% 30%, black 60%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at 50% 30%, black 60%, transparent 100%);
        }

        /* --- Glassmorphic Panels --- */
        .glass-panel {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 14px;
          box-shadow: var(--shadow-md);
        }

        /* --- Floating Navigation Bar --- */
        .glass-nav {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1040px;
          height: 52px;
          background: var(--color-sidebar);
          border: 1px solid var(--color-sidebar-border);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-radius: 999px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-shadow: var(--shadow-lg);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-logo-mark {
          display: flex;
          align-items: center;
        }
        .nav-brand {
          font-weight: 700;
          font-size: 14.5px;
          letter-spacing: -0.02em;
          color: var(--color-text);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .nav-link {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-muted);
          transition: color 0.15s ease;
        }
        .nav-link:hover {
          color: var(--color-text);
        }
        .nav-link.active {
          color: var(--color-primary);
          font-weight: 600;
        }

        .nav-cta {
          display: flex;
          align-items: center;
        }
        .nav-btn-upload {
          background: rgba(79, 124, 255, 0.1);
          border: 1px solid rgba(79, 124, 255, 0.3);
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .nav-btn-upload:hover {
          background: rgba(79, 124, 255, 0.2);
          border-color: rgba(79, 124, 255, 0.5);
        }

        /* --- Hero Section & Layout --- */
        .hero-section {
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 0 60px 0;
          position: relative;
          z-index: 10;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 56px;
            text-align: center;
          }
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        @media (max-width: 1024px) {
          .hero-content {
            align-items: center;
          }
        }

        .hero-eyebrow {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--text-eyebrow);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
        }
        .eyebrow-dot {
          color: var(--accent-glow-blue);
          font-size: 10px;
        }

        .hero-headline {
          font-size: clamp(34px, 4.2vw, 56px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.035em;
          color: var(--text-primary-heading);
          margin-bottom: 24px;
          text-wrap: balance;
        }
        .title-gradient {
          background: linear-gradient(to right, var(--accent-glow-blue), var(--accent-glow-purple), var(--accent-glow-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subheadline {
          font-size: 15.5px;
          color: var(--text-body);
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 580px;
        }

        /* --- Workspace Ingestion Flow --- */
        .hero-workspace {
          width: 100%;
          max-width: 480px;
        }

        .cta-group {
          display: flex;
          gap: 12px;
          width: 100%;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .cta-group {
            flex-direction: column;
          }
        }

        .btn-cta-primary {
          flex: 1;
          background: linear-gradient(135deg, #2563EB, #4F46E5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
        }
        .btn-cta-primary:hover {
          transform: translateY(-2px);
          opacity: 0.95;
        }
        .btn-cta-primary:active {
          transform: translateY(0);
        }

        .btn-cta-secondary {
          flex: 1;
          background: var(--btn-secondary-bg);
          border: 1px solid var(--btn-secondary-border);
          color: var(--btn-secondary-color);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
        }
        .btn-cta-secondary:hover {
          transform: translateY(-2px);
          background: var(--color-surface-2);
          border-color: var(--color-border-strong);
        }
        .btn-cta-secondary:active {
          transform: translateY(0);
        }

        .cta-drag-overlay {
          border: 1.5px dashed var(--accent-glow-cyan);
          background: rgba(61, 214, 198, 0.04);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--accent-glow-cyan);
          text-align: center;
        }

        /* --- Selected Card --- */
        .selected-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .selected-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-cyan { color: var(--accent-glow-cyan); }
        .selected-meta {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .selected-filename {
          font-weight: 600;
          font-size: 13.5px;
          color: var(--text-primary-heading);
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .selected-filesize {
          font-size: 11px;
          color: var(--text-muted-darker);
        }
        .selected-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          padding: 10px;
          border-radius: 8px;
        }
        .mini-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .mini-num {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary-heading);
        }
        .mini-label {
          font-size: 10px;
          color: var(--text-muted-darker);
          text-transform: uppercase;
        }
        .selected-buttons {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .btn-reset {
          flex: 0.35;
          background: var(--btn-secondary-bg);
          border: 1px solid var(--btn-secondary-border);
          color: var(--btn-secondary-color);
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .btn-reset:hover {
          background: var(--color-surface-2);
          color: var(--text-primary-heading);
        }
        .btn-submit {
          flex: 0.65;
          background: var(--color-primary);
          color: #ffffff;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease;
        }
        .btn-submit:hover {
          background: var(--color-primary-hover);
        }

        /* --- Processing Card --- */
        .processing-card {
          padding: 24px;
          text-align: center;
        }
        .processing-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 14px;
          font-size: 13px;
          color: var(--text-muted-darker);
        }
        .icon-spin { animation: spin 1s linear infinite; }

        /* --- Complete Card --- */
        .complete-card {
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .complete-check {
          background: rgba(22, 163, 74, 0.1);
          border: 1px solid rgba(22, 163, 74, 0.25);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .text-green { color: var(--color-positive); }
        .complete-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary-heading);
          margin-bottom: 6px;
        }
        .complete-desc {
          font-size: 13px;
          color: var(--text-muted-darker);
          margin-bottom: 20px;
        }
        .complete-buttons {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        /* --- Validation Alerts --- */
        .validation-alert {
          display: flex;
          align-items: center;
          background: rgba(220, 38, 38, 0.08);
          color: var(--color-negative-text);
          border: 1px solid var(--color-negative-border);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
          margin-top: 12px;
          text-align: left;
        }

        /* --- Schema Details --- */
        .schema-section {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
        }
        @media (max-width: 1024px) {
          .schema-section {
            align-items: center;
          }
        }
        .schema-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--chip-label);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .schema-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .schema-pill {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          color: var(--chip-text);
          background: var(--chip-bg);
          border: 1px solid var(--chip-border);
          padding: 3px 8px;
          border-radius: 6px;
        }
        .btn-download-sample {
          font-size: 11px;
          color: var(--text-muted-darker);
          display: flex;
          align-items: center;
          margin-top: 6px;
          text-decoration: underline;
        }
        .btn-download-sample:hover {
          color: var(--text-primary-heading);
        }

        /* --- Floating Product Proof Cards Visuals --- */
        .hero-visualization {
          position: relative;
          height: 480px;
          width: 100%;
        }
        @media (max-width: 1024px) {
          .hero-visualization {
            height: auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
            padding: 0 10px;
          }
        }

        /* Base Card Styling */
        .proof-card {
          position: absolute;
          padding: 16px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
          z-index: 10;
          cursor: pointer;
          background: var(--proof-card-bg);
          border: 1px solid var(--proof-card-border);
          box-shadow: var(--proof-card-shadow);
          border-radius: 12px;
        }
        @media (max-width: 1024px) {
          .proof-card {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            width: 100% !important;
          }
        }

        .proof-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          width: 100%;
        }
        .proof-card-title {
          font-weight: 700;
          font-size: 12.5px;
          color: var(--proof-card-text);
        }
        .proof-card-badge {
          font-size: 8.5px;
          font-weight: 700;
          color: var(--accent-glow-cyan);
          background: rgba(61, 214, 198, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        /* Card Positioning (Desktop Asymmetry) */
        .card-sentiment {
          top: 20px;
          right: 40px;
          width: 240px;
        }
        .card-complaints {
          top: 180px;
          left: 10px;
          width: 260px;
        }
        .card-kpis {
          top: 80px;
          left: 30px;
          width: 200px;
        }
        .card-voice {
          top: 270px;
          right: 20px;
          width: 270px;
        }

        /* Hover animations */
        .card-hovered {
          transform: translateY(-8px) scale(1.02) !important;
          border-color: var(--color-primary-light);
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        /* Donut Chart Visuals */
        .proof-chart-donut {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 10px 0;
        }
        .donut-svg {
          transform: rotate(-90deg);
        }
        .donut-center {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .donut-pct {
          font-size: 16px;
          font-weight: 800;
          color: var(--proof-card-text);
          line-height: 1;
        }
        .donut-lbl {
          font-size: 9px;
          color: var(--proof-card-muted);
          margin-top: 2px;
        }
        .donut-legend {
          display: flex;
          justify-content: space-around;
          margin-top: 10px;
          font-size: 9px;
          color: var(--proof-card-muted);
          width: 100%;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .dot-green { background: var(--color-positive); }
        .dot-orange { background: var(--color-neutral); }
        .dot-red { background: var(--color-negative); }

        /* Complaint Bars Visuals */
        .complaint-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        .bar-label {
          width: 70px;
          color: var(--proof-card-muted);
          text-align: left;
        }
        .bar-container {
          flex: 1;
          height: 6px;
          background: var(--color-surface-2);
          border-radius: 99px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 99px;
        }
        .bar-fill-red { background: var(--color-negative); }
        .bar-fill-amber { background: var(--color-neutral); }
        .bar-fill-gray { background: var(--color-text-subtle); }
        .bar-value {
          width: 30px;
          text-align: right;
          color: var(--proof-card-text);
          font-weight: 600;
        }

        /* KPI Cluster Visuals */
        .kpi-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          width: 100%;
        }
        .kpi-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          border-left: 2px solid var(--accent-glow-blue);
          padding-left: 10px;
        }
        .kpi-box:nth-child(2) { border-left-color: var(--color-positive); }
        .kpi-box:nth-child(3) { border-left-color: var(--color-negative); }
        .kpi-num {
          font-size: 18px;
          font-weight: 800;
          color: var(--proof-card-text);
          line-height: 1;
        }
        .kpi-label {
          font-size: 8px;
          font-weight: 600;
          color: var(--proof-card-muted);
          margin-top: 3px;
          letter-spacing: 0.05em;
        }

        /* Customer Voice Card Visuals */
        .voice-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-start;
          text-align: left;
        }
        .voice-tag {
          font-size: 8.5px;
          font-weight: 700;
          color: var(--accent-glow-purple);
          background: rgba(124, 92, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .voice-pill-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .voice-pill {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 99px;
        }
        .pill-red {
          color: var(--color-negative-text);
          background: var(--color-negative-bg);
          border: 1px solid var(--color-negative-border);
        }
        .pill-green {
          color: var(--color-positive-text);
          background: var(--color-positive-bg);
          border: 1px solid var(--color-positive-border);
        }
        .voice-excerpt {
          font-size: 11.5px;
          line-height: 1.5;
          color: var(--proof-card-muted);
          font-style: italic;
          border-left: 2px solid var(--color-border-strong);
          padding-left: 8px;
        }
        .voice-meta {
          font-size: 9px;
          color: var(--color-text-subtle);
        }

        /* --- Section: How It Works --- */
        .how-it-works {
          width: 90%;
          max-width: 940px;
          margin: 100px auto 0;
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-eyebrow-alt);
          letter-spacing: 0.15em;
          margin-bottom: 40px;
          text-transform: uppercase;
        }

        .steps-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .steps-container {
            flex-direction: column;
            gap: 40px;
          }
          .step-line {
            display: none;
          }
        }

        .step-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 240px;
        }
        .step-num {
          font-size: 24px;
          font-weight: 900;
          color: var(--process-number);
          opacity: 0.8;
          margin-bottom: 12px;
        }
        .step-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--process-title);
          margin-bottom: 8px;
        }
        .step-desc {
          font-size: 12.5px;
          color: var(--process-desc);
          line-height: 1.5;
        }
        .step-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(0,0,0,0), var(--color-border), rgba(0,0,0,0));
          margin: 0 10px;
        }

        /* --- Capabilities Section --- */
        .capabilities-section {
          width: 90%;
          max-width: 1040px;
          margin: 100px auto 0;
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .capabilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .cap-card {
          padding: 24px;
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: transform 0.2s ease, border-color 0.2s ease;
          background: var(--feat-card-bg);
          border: 1px solid var(--feat-card-border);
          box-shadow: var(--feat-card-shadow);
          border-radius: var(--radius-lg);
        }
        .cap-card:hover {
          transform: translateY(-4px);
          border-color: var(--color-primary-light);
          box-shadow: var(--feat-card-shadow-hover);
        }
        .cap-icon {
          margin-bottom: 16px;
        }
        .text-blue { color: var(--accent-glow-blue); }
        .text-purple { color: var(--accent-glow-purple); }
        .cap-title {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--feat-card-title);
          margin-bottom: 8px;
        }
        .cap-desc {
          font-size: 12.5px;
          color: var(--feat-card-desc);
          line-height: 1.5;
        }

        /* --- Research Credibility Section --- */
        .credibility-section {
          width: 90%;
          max-width: 1040px;
          margin: 100px auto 0;
          position: relative;
          z-index: 10;
        }

        .credibility-bg-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(124, 92, 255, 0.08), transparent 60%);
          pointer-events: none;
          z-index: 1;
        }

        .credibility-inner {
          padding: 40px 32px;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .credibility-eyebrow {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-eyebrow-alt);
          letter-spacing: 0.12em;
          margin-bottom: 12px;
          display: block;
          text-transform: uppercase;
        }
        .credibility-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary-heading);
          margin-bottom: 12px;
        }
        .credibility-desc {
          font-size: 13.5px;
          color: var(--text-body);
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }

        .credibility-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 24px;
          border-top: 1px solid var(--color-border);
          padding-top: 32px;
        }
        .cred-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cred-num {
          font-size: 20px;
          font-weight: 800;
          color: var(--stats-val);
          line-height: 1.2;
        }
        .cred-lbl {
          font-size: 11px;
          color: var(--stats-lbl);
          margin-top: 4px;
        }

        /* --- Footer CTA Banner --- */
        .footer-cta {
          width: 90%;
          max-width: 800px;
          margin: 120px auto 40px;
          text-align: center;
          position: relative;
          z-index: 10;
          padding: 48px 24px;
        }

        .footer-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(79, 124, 255, 0.14), transparent 60%);
          pointer-events: none;
          z-index: 1;
        }

        .footer-title {
          font-size: clamp(20px, 3.5vw, 32px);
          font-weight: 800;
          color: var(--text-primary-heading);
          margin-bottom: 12px;
          position: relative;
          z-index: 2;
        }
        .footer-desc {
          font-size: 14.5px;
          color: var(--text-body);
          margin-bottom: 28px;
          position: relative;
          z-index: 2;
        }
        .footer-btn-primary {
          background: var(--color-primary);
          border: 1px solid rgba(255,255,255,0.1);
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          position: relative;
          z-index: 2;
          box-shadow: 0 4px 24px rgba(37, 99, 235, 0.4);
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease;
        }
        .footer-btn-primary:hover {
          transform: translateY(-2px);
          background: var(--color-primary-hover);
        }

        /* --- Global Keyframe Animations --- */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* --- Entrance Animations --- */
        .hero-eyebrow {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-headline {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards;
          opacity: 0;
        }
        .hero-subheadline {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.16s forwards;
          opacity: 0;
        }
        .hero-workspace {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.24s forwards;
          opacity: 0;
        }
        .card-sentiment {
          animation: floatStagger 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
          opacity: 0;
        }
        .card-complaints {
          animation: floatStagger 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }
        .card-kpis {
          animation: floatStagger 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
          opacity: 0;
        }
        .card-voice {
          animation: floatStagger 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
          opacity: 0;
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatStagger {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* --- Accessibility / Reduced Motion overrides --- */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-delay: 0s !important;
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
          .card-hovered {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
