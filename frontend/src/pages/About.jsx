import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  UploadCloud, Sliders, FileCode, Filter, Cpu, Activity, Search, BarChart3,
  BookOpen, Code, AlertTriangle, ShieldAlert, Sparkles, HelpCircle, GraduationCap, Laptop, Landmark
} from 'lucide-react';

const PIPELINE_STEPS = [
  { step: 'CSV Upload', Icon: UploadCloud, desc: 'Accepts raw CSV review data containing product_title, category, and review_text.' },
  { step: 'Text Preprocessing', Icon: Sliders, desc: '10-stage NLP normalization pipeline (NFKC normalization, HTML stripping, emoji tokenization, negation binding, WordNet lemmatization).' },
  { step: 'TF-IDF Vectorization', Icon: FileCode, desc: 'Generates unigrams and bigrams, creating up to 15,000 potential features with sublinear term frequency scaling.' },
  { step: 'Chi² Feature Selection', Icon: Filter, desc: 'SelectKBest (chi-square scoring, k=10,000) fits on training folds to extract the most predictive features without leakage.' },
  { step: 'Logistic Regression', Icon: Cpu, desc: 'Final classifier (L2 regularization, C=1.0, balanced class weights, L-BFGS solver) trained to optimize probability scores.' },
  { step: 'Sentiment Output', Icon: Activity, desc: 'Outputs Positive, Neutral, or Negative labels based on the highest probability score.' },
  { step: 'Rule-Based Detectors', Icon: Search, desc: 'Heuristic-driven category-aware detectors extract customer complaints and positive highlights from text.' },
  { step: 'Analytics Dashboard', Icon: BarChart3, desc: 'Aggregates outputs into product KPIs, trend charts, and aspect tables for final business review.' },
];

const LIMITATIONS = [
  {
    title: 'Neutral-Class Ambiguity',
    desc: 'The neutral class has the lowest classifier precision. Mixed-sentiment reviews (e.g. positive-then-negative) or objective specifications are inherently ambiguous. Cohen\'s Kappa is 0.7959 (substantial agreement), with 94.1% of human-classifier disagreements located on the Neutral boundary.',
  },
  {
    title: 'Single-Annotator Label Validation',
    desc: 'Human validation (N=250) was conducted using a single independent annotator. While showing substantial agreement, this is an annotator-agreement metric rather than an absolute ground-truth benchmark.',
  },
  {
    title: 'Rule-Based Auxiliary Detectors',
    desc: 'Complaint and Highlight detectors are rule-based heuristics rather than trained machine learning models. Complaint detector yields a precision of 72.7% and recall of 80.0%, while Highlight detector yields 80.4% precision with a macro F1 of 43.8%.',
  },
  {
    title: 'Scope: Classical Machine Learning',
    desc: 'Deep learning or Transformer models (e.g., BERT, RoBERTa) are explicitly excluded from the research scope. The project focuses on the rigorous optimization, validation, and statistical comparison of classical classifiers.',
  },
  {
    title: 'Deduplicated Training Population',
    desc: 'The canonical dataset consists of 26,400 balanced reviews, which contains 15,829 unique, deduplicated records. All models were trained and validated on the deduplicated subset to prevent validation set leakage.',
  },
];

export default function About() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal(0.05);
  const ref3 = useScrollReveal(0.05);
  const ref4 = useScrollReveal(0.05);
  const ref5 = useScrollReveal(0.05);
  const ref6 = useScrollReveal(0.05);
  const ref7 = useScrollReveal(0.05);

  return (
    <div className="page-container" style={{ maxWidth: 840 }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Methodology & Research</h1>
        <p className="page-subtitle">Underlying architecture, validation metrics, and limitations</p>
      </div>

      {/* 1. What is SentimentScope? */}
      <div ref={ref1} className="card reveal" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} strokeWidth={2} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="card-title">1. What is SentimentScope?</span>
          </div>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 14.5 }}>
            SentimentScope is a research-backed product intelligence platform that translates raw e-commerce customer feedback into actionable business metrics. By integrating an optimized machine learning text classifier with rule-driven aspect extraction pipelines, the platform delivers structural and statistical breakdowns of customer complaints and positive feature highlights.
          </p>
        </div>
      </div>

      {/* 2. Problem Being Solved */}
      <div ref={ref2} className="card reveal" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={16} strokeWidth={2} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="card-title">2. Problem Being Solved</span>
          </div>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 14.5, marginBottom: 12 }}>
            E-commerce databases collect millions of customer reviews, but this feedback remains largely unexploited because unstructured text cannot be searched or aggregated programmatically at scale. Standard metrics like star ratings fail to reveal <i>why</i> customers are dissatisfied.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: 14.5 }}>
            SentimentScope solves this by providing a programmatic classification methodology that extracts underlying dimensions (e.g., battery life, packaging durability) and links them to exact sentiment levels, allowing teams to filter and rank customer complaints instantly.
          </p>
        </div>
      </div>

      {/* 3. How the System Works (NLP + ML Pipeline) */}
      <div ref={ref3} className="card reveal" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Code size={16} strokeWidth={2} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="card-title">3. How the System Works</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '24px 20px 8px' }}>
          <div className="pipeline-flow">
            {PIPELINE_STEPS.map((step, i) => {
              const StepIcon = step.Icon;
              return (
                <div key={step.step} className="pipeline-item">
                  <div className="pipeline-indicator">
                    <div className="pipeline-circle" aria-hidden="true">
                      <StepIcon size={14} strokeWidth={2} />
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && <div className="pipeline-connector" />}
                  </div>
                  <div className="pipeline-text">
                    <div className="pipeline-step-title">
                      <span className="editorial-number" style={{ marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>
                      {step.step}
                    </div>
                    <p className="pipeline-step-desc">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Core Intelligence Features */}
      <div ref={ref4} className="card reveal" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} strokeWidth={2} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="card-title">4. Core Intelligence Features</span>
          </div>
        </div>
        <div className="card-body">
          <div className="features-list-grid">
            {[
              { title: 'Sentiment Modeling', desc: 'Predicts Positive, Neutral, or Negative labels using a hyperparameter-tuned Logistic Regression model.' },
              { title: 'Aspect Extraction', desc: 'Category-aware rule heuristics isolate specific components (e.g. software glitches, battery issues).' },
              { title: 'Dynamic Search Workspace', desc: 'Supports advanced dataset queries mapped to sentiment and category criteria.' },
              { title: 'Statistical Parity Checks', desc: 'Strict statistical checks ensure the model results align with human annotations.' }
            ].map(({ title, desc }) => (
              <div key={title} className="feat-item">
                <span className="feat-title">{title}</span>
                <p className="feat-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Research & Model Validation */}
      <div ref={ref5} className="card reveal" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} strokeWidth={2} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="card-title">5. Research & Model Validation</span>
          </div>
        </div>
        <div className="card-body">
          <div className="about-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Classifier Type', value: 'Logistic Regression (L2, C=1.0)' },
              { label: 'Macro F1 Score', value: '76.32% (holdout testing)' },
              { label: 'Canonical Set Size', value: '26,400 reviews (balanced)' },
              { label: 'Human Parity κ', value: '0.7959 (Cohen\'s Kappa, substantial)' },
              { label: 'Statistical Tests', value: 'Wilcoxon Signed-Rank + Holm-Bonferroni' },
              { label: 'Validation Subset', value: '15,829 unique deduplicated reviews' }
            ].map(({ label, value }) => (
              <div key={label} className="about-stat-item">
                <span className="about-stat-label section-label">{label}</span>
                <span className="about-stat-value">{value}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: 13.5 }}>
            Our model has been validated using a 95% Confidence Interval bootstrap methodology. Discrepancies between model labels and human annotators were examined via the McNemar test, confirming substantial structural agreement.
          </p>
        </div>
      </div>

      {/* 6. Technology & Methodology */}
      <div ref={ref6} className="card reveal" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Laptop size={16} strokeWidth={2} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="card-title">6. Technology & Methodology</span>
          </div>
        </div>
        <div className="card-body">
          <div className="tech-grid">
            {[
              { cat: 'Machine Learning', items: ['Python 3.12', 'Scikit-Learn 1.8', 'NLTK 3.9', 'Pandas 2.3', 'NumPy 1.26'] },
              { cat: 'Backend Framework', items: ['Flask 3.x', 'Flask-CORS', 'Joblib 1.5'] },
              { cat: 'Frontend UI', items: ['React 18', 'Vite 5', 'Recharts 2.12', 'React Router 6.22', 'Lucide Icons'] },
              { cat: 'Statistical Suite', items: ['Wilcoxon Test', 'Holm FWE', 'McNemar Matrix', '95% Bootstrap'] },
            ].map(({ cat, items }) => (
              <div key={cat} className="tech-category">
                <span className="tech-cat-title section-label">{cat}</span>
                <div className="tech-tags">
                  {items.map(item => (
                    <span key={item} className="tag" style={{ fontSize: 11.5 }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Project Scope & Limitations */}
      <div ref={ref7} className="card reveal" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={16} strokeWidth={2} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
            <span className="card-title">7. Project Scope & Capstone Info</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--color-surface-2)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 20 }}>
            <Landmark size={20} style={{ color: 'var(--color-primary)', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, margin: 0 }}>Ashish Bavaliya — Final Year Capstone Project</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: '2px 0 0' }}>P P Savani University, AI & ML Specialization (May 2027)</p>
            </div>
          </div>

          <h3 className="section-label" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={14} style={{ color: 'var(--color-neutral)' }} />
            Known Limitations & Research Boundaries
          </h3>
          <div className="limitations-list">
            {LIMITATIONS.map(({ title, desc }) => (
              <div key={title} className="limitation-item">
                <h4 className="limitation-title">{title}</h4>
                <p className="limitation-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .about-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        .about-stat-item {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }
        .about-stat-label {
          display: block;
          margin-bottom: 4px;
        }
        .about-stat-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
          line-height: 1.4;
        }

        /* Pipeline Flow */
        .pipeline-flow { display: flex; flex-direction: column; }
        .pipeline-item { display: flex; gap: 16px; }
        .pipeline-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .pipeline-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
        }
        .pipeline-item:hover .pipeline-circle {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background: var(--color-primary-light);
        }
        .pipeline-connector {
          width: 1px;
          flex: 1;
          min-height: 22px;
          background: var(--color-border);
          margin: 4px 0;
        }
        .pipeline-text { padding-bottom: 18px; }
        .pipeline-step-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          margin-top: 3px;
        }
        .pipeline-step-desc {
          font-size: 12.2px;
          color: var(--color-text-muted);
          line-height: 1.55;
          max-width: 700px;
        }

        /* Features */
        .features-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        @media (max-width: 600px) {
          .features-list-grid { grid-template-columns: 1fr; }
        }
        .feat-item {
          border-left: 2.5px solid var(--color-primary);
          padding-left: 12px;
        }
        .feat-title {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 4px;
        }
        .feat-desc {
          font-size: 12.2px;
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        /* Limitations list */
        .limitations-list { display: flex; flex-direction: column; gap: 14px; }
        .limitation-item {
          border-left: 2px solid var(--color-neutral-border);
          padding-left: 14px;
        }
        .limitation-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .limitation-desc {
          font-size: 12.2px;
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        /* Tech grid */
        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
        }
        .tech-cat-title { display: block; margin-bottom: 8px; }
        .tech-tags { display: flex; flex-wrap: wrap; gap: 6px; }
      `}</style>
    </div>
  );
}
