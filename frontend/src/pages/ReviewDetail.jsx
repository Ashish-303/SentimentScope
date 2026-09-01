import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SentimentBadge from '../components/SentimentBadge';
import ErrorState from '../components/ErrorState';
import { ArrowLeft, AlertTriangle, CheckCircle2, Tag } from 'lucide-react';

export default function ReviewDetail() {
  const navigate = useNavigate();
  const { selectedReview } = useApp();

  if (!selectedReview) {
    return (
      <div className="page-container" style={{ maxWidth: 640 }}>
        <ErrorState
          title="No review selected"
          message="Select a row in the Data table to inspect an individual review."
          onRetry={() => navigate('/data')}
          retryLabel="Go to Data"
        />
      </div>
    );
  }

  const {
    Product_Name,
    Category,
    Review_Text,
    Predicted_Sentiment,
    Detected_Issues,
    Positive_Features,
  } = selectedReview;

  const complaints = Detected_Issues
    ? Detected_Issues.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const highlights = Positive_Features
    ? Positive_Features.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="page-container">
      {/* Back */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 20, gap: 6 }}
        id="review-detail-back"
        aria-label="Back to data table"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back
      </button>

      <div className="rd-grid">
        {/* Left column — Review content */}
        <div className="rd-main">
          {/* Meta */}
          <div className="rd-meta card" style={{ marginBottom: 16 }}>
            <div className="card-body" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div className="rd-meta-field">
                <span className="section-label" style={{ display: 'block', marginBottom: 4 }}>Product</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>{Product_Name || '—'}</span>
              </div>
              <div className="stat-divider" style={{ alignSelf: 'center' }} aria-hidden="true" />
              <div className="rd-meta-field">
                <span className="section-label" style={{ display: 'block', marginBottom: 4 }}>Category</span>
                <span className="tag">{Category || '—'}</span>
              </div>
              <div className="stat-divider" style={{ alignSelf: 'center' }} aria-hidden="true" />
              <div className="rd-meta-field">
                <span className="section-label" style={{ display: 'block', marginBottom: 4 }}>Sentiment</span>
                <SentimentBadge sentiment={Predicted_Sentiment} />
              </div>
            </div>
          </div>

          {/* Review text */}
          <div className="card rd-review-card">
            <div className="card-header">
              <span className="section-label">Customer Review</span>
            </div>
            <div className="card-body">
              <blockquote className="rd-review-text">
                <span className="rd-open-quote" aria-hidden="true">"</span>
                {Review_Text || '—'}
                <span className="rd-close-quote" aria-hidden="true">"</span>
              </blockquote>
            </div>
          </div>
        </div>

        {/* Right column — Sentiment + Aspects */}
        <div className="rd-aside">
          {/* Sentiment card */}
          <div className="card rd-sentiment-card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <span className="section-label">Predicted Sentiment</span>
            </div>
            <div className="card-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <SentimentBadge sentiment={Predicted_Sentiment} size="large" />
              <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 12, lineHeight: 1.5 }}>
                Logistic Regression pipeline<br />
                trained on 26,400 canonical reviews
              </p>
            </div>
          </div>

          {/* Complaints */}
          {complaints.length > 0 && (
            <div className="card rd-aspect-card" style={{ marginBottom: 12 }}>
              <div className="card-header" style={{ gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} strokeWidth={2} style={{ color: 'var(--color-negative)' }} aria-hidden="true" />
                  <span className="card-title">Detected Issues</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--color-negative-bg)', color: 'var(--color-negative-text)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--color-negative-border)' }}>
                  {complaints.length}
                </span>
              </div>
              <div className="card-body" style={{ paddingTop: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {complaints.map(c => <span key={c} className="tag tag-complaint">{c}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="card rd-aspect-card">
              <div className="card-header" style={{ gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} strokeWidth={2} style={{ color: 'var(--color-positive)' }} aria-hidden="true" />
                  <span className="card-title">Positive Highlights</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--color-positive-bg)', color: 'var(--color-positive-text)', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--color-positive-border)' }}>
                  {highlights.length}
                </span>
              </div>
              <div className="card-body" style={{ paddingTop: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {highlights.map(h => <span key={h} className="tag tag-highlight">{h}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* No aspects */}
          {complaints.length === 0 && highlights.length === 0 && (
            <div className="card">
              <div className="card-body" style={{ color: 'var(--color-text-subtle)', fontSize: 13, textAlign: 'center', padding: 24 }}>
                No specific complaints or highlights detected for this review.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .rd-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 840px) {
          .rd-grid { grid-template-columns: 1fr; }
        }
        .rd-meta-field { flex: 0 0 auto; }
        .rd-review-card { }
        .rd-review-text {
          font-size: 15px;
          line-height: 1.75;
          color: var(--color-text);
          position: relative;
          padding: 0;
          margin: 0;
          border: none;
          quotes: none;
        }
        .rd-open-quote {
          font-size: 52px;
          line-height: 0;
          vertical-align: -0.4em;
          color: var(--color-border-strong);
          margin-right: 4px;
          font-family: Georgia, serif;
        }
        .rd-close-quote {
          font-size: 52px;
          line-height: 0;
          vertical-align: -0.4em;
          color: var(--color-border-strong);
          margin-left: 4px;
          font-family: Georgia, serif;
        }
      `}</style>
    </div>
  );
}
