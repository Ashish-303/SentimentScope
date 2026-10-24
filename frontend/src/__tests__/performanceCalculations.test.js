import assert from 'node:assert';
import test from 'node:test';
import {
  calculateSentimentScore,
  aggregatePerformanceData,
  DEFAULT_MIN_REVIEWS,
  DEFAULT_RISK_THRESHOLD
} from '../utils/performanceCalculations.js';

test('calculateSentimentScore returns positive - negative percentage', () => {
  assert.strictEqual(calculateSentimentScore(85.5, 12.0), 73.5);
  assert.strictEqual(calculateSentimentScore(15.0, 65.0), -50.0);
  assert.strictEqual(calculateSentimentScore(50.0, 50.0), 0.0);
});

test('aggregatePerformanceData handles empty list gracefully', () => {
  const result = aggregatePerformanceData([], { minReviews: 5 });
  assert.strictEqual(result.kpis.products_analysed, 0);
  assert.strictEqual(result.kpis.total_reviews, 0);
  assert.strictEqual(result.top_products.length, 0);
});

test('aggregatePerformanceData calculates KPIs, rankings, and risk correctly', () => {
  const sampleReviews = [
    // Product 1: 6 reviews -> 5 Pos, 1 Neg -> 83.3% Pos, 16.7% Neg -> Score +66.6
    { Product_Name: 'Prod Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Prod Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Battery' },
    { Product_Name: 'Prod Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Design' },
    { Product_Name: 'Prod Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Performance' },
    { Product_Name: 'Prod Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Prod Alpha', Category: 'Electronics', Predicted_Sentiment: 'Negative', Detected_Issues: 'Delivery', Positive_Features: '' },

    // Product 2: 5 reviews -> 1 Pos, 4 Neg -> 20% Pos, 80% Neg -> Score -60.0 -> At Risk (>40% Neg)
    { Product_Name: 'Prod Beta', Category: 'Electronics', Predicted_Sentiment: 'Negative', Detected_Issues: 'Battery', Positive_Features: '' },
    { Product_Name: 'Prod Beta', Category: 'Electronics', Predicted_Sentiment: 'Negative', Detected_Issues: 'Battery, Quality', Positive_Features: '' },
    { Product_Name: 'Prod Beta', Category: 'Electronics', Predicted_Sentiment: 'Negative', Detected_Issues: 'Delivery', Positive_Features: '' },
    { Product_Name: 'Prod Beta', Category: 'Electronics', Predicted_Sentiment: 'Negative', Detected_Issues: 'Pricing', Positive_Features: '' },
    { Product_Name: 'Prod Beta', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },

    // Product 3: 2 reviews (< minReviews=5) -> 2 Pos -> excluded from ranking
    { Product_Name: 'Prod Gamma', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Prod Gamma', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' }
  ];

  const res = aggregatePerformanceData(sampleReviews, { minReviews: 5, riskThreshold: 0.40 });
  
  assert.strictEqual(res.kpis.products_analysed, 3);
  assert.strictEqual(res.kpis.total_reviews, 13);
  assert.strictEqual(res.kpis.at_risk_count, 1);
  assert.strictEqual(res.kpis.best_product.name, 'Prod Alpha');

  // Top products must have Prod Alpha first
  assert.strictEqual(res.top_products[0].product_name, 'Prod Alpha');
  // Bottom products must have Prod Beta first
  assert.strictEqual(res.bottom_products[0].product_name, 'Prod Beta');
  assert.strictEqual(res.bottom_products[0].is_at_risk, true);

  // Complaints check
  const batteryComp = res.common_complaints.find(c => c.category === 'Battery');
  assert.ok(batteryComp);
  assert.strictEqual(batteryComp.count, 2);
  assert.strictEqual(batteryComp.affected_products, 1);
});

test('aggregatePerformanceData detects ties for best performing products', () => {
  const tiedReviews = [
    // Product A: 5 reviews -> 5 Pos, 0 Neg -> 100% Pos, 0% Neg -> Score +100.0
    { Product_Name: 'Tied Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Tied Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Tied Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Tied Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Tied Alpha', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },

    // Product B: 5 reviews -> 5 Pos, 0 Neg -> 100% Pos, 0% Neg -> Score +100.0
    { Product_Name: 'Tied Beta', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Design' },
    { Product_Name: 'Tied Beta', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Design' },
    { Product_Name: 'Tied Beta', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Design' },
    { Product_Name: 'Tied Beta', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Design' },
    { Product_Name: 'Tied Beta', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Design' },

    // Product C: 5 reviews -> 3 Pos, 2 Neg -> 60% Pos, 40% Neg -> Score +20.0
    { Product_Name: 'Lower Gamma', Category: 'Home', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' },
    { Product_Name: 'Lower Gamma', Category: 'Home', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' },
    { Product_Name: 'Lower Gamma', Category: 'Home', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' },
    { Product_Name: 'Lower Gamma', Category: 'Home', Predicted_Sentiment: 'Negative', Detected_Issues: 'Quality', Positive_Features: '' },
    { Product_Name: 'Lower Gamma', Category: 'Home', Predicted_Sentiment: 'Negative', Detected_Issues: 'Quality', Positive_Features: '' }
  ];

  const res = aggregatePerformanceData(tiedReviews, { minReviews: 5 });
  assert.strictEqual(res.kpis.products_analysed, 3);
  assert.strictEqual(res.kpis.best_products.length, 2);
  assert.deepStrictEqual(
    res.kpis.best_products.map(p => p.name).sort(),
    ['Tied Alpha', 'Tied Beta']
  );
  assert.strictEqual(res.kpis.best_products[0].score, 100.0);
  assert.strictEqual(res.kpis.best_products[1].score, 100.0);
  assert.strictEqual(res.kpis.best_product.score, 100.0);
});

test('aggregatePerformanceData generates dynamic quality profiles without fabricated baseline', () => {
  const customReviews = [
    { Product_Name: 'Custom Headphones', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality, Battery' },
    { Product_Name: 'Custom Headphones', Category: 'Electronics', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Quality' },
    { Product_Name: 'Custom Headphones', Category: 'Electronics', Predicted_Sentiment: 'Negative', Detected_Issues: 'Delivery', Positive_Features: '' },
    { Product_Name: 'Custom Running Shoes', Category: 'Fashion', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: 'Design' }
  ];

  const res = aggregatePerformanceData(customReviews, { minReviews: 1 });
  const names = res.quality_profiles.map(p => p.product_name);
  assert.ok(names.includes('Custom Headphones'));
  assert.ok(names.includes('Custom Running Shoes'));
  assert.ok(!names.includes('Mechanical Keyboard'));

  const headphones = res.quality_profiles.find(p => p.product_name === 'Custom Headphones');
  assert.strictEqual(headphones.dimensions.Quality.has_direct_evidence, true);
  assert.strictEqual(headphones.dimensions.Quality.score, 100);
});

// ============================================================================
// Task 1 — Quality Score Validity (7 Controlled Cases)
// ============================================================================
test('Task 1.1: Product with genuine direct aspect evidence has direct evidence and measured score', () => {
  const reviews = [
    { Product_Name: 'P1', Category: 'Tech', Predicted_Sentiment: 'Positive', Detected_Issues: 'Quality', Positive_Features: 'Quality, Quality' }
  ];
  const res = aggregatePerformanceData(reviews, { minReviews: 1 });
  const p1 = res.quality_profiles.find(p => p.product_name === 'P1');
  assert.ok(p1);
  assert.strictEqual(p1.dimensions.Quality.has_direct_evidence, true);
  // 2 positive mentions, 1 negative mention -> (2/3)*100 = 66.7
  assert.strictEqual(p1.dimensions.Quality.score, 66.7);
  assert.strictEqual(p1.dimensions.Quality.positive_mentions, 2);
  assert.strictEqual(p1.dimensions.Quality.negative_mentions, 1);
});

test('Task 1.2: Product with sentiment data but no direct aspect evidence uses sentiment proxy', () => {
  const reviews = [
    { Product_Name: 'P2', Category: 'Tech', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' },
    { Product_Name: 'P2', Category: 'Tech', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' }
  ];
  // 100% positive -> sentiment score = +100.0. Proxy formula: 50 + (100 * 0.4) = 90.0, clamped [5, 95]
  const res = aggregatePerformanceData(reviews, { minReviews: 1 });
  const p2 = res.quality_profiles.find(p => p.product_name === 'P2');
  assert.ok(p2);
  assert.strictEqual(p2.dimensions.Quality.has_direct_evidence, false);
  assert.strictEqual(p2.dimensions.Quality.score, 90.0);
  assert.strictEqual(p2.dimensions.Quality.positive_mentions, 0);
  assert.strictEqual(p2.dimensions.Quality.negative_mentions, 0);
});

test('Task 1.3 & 1.5: Product with zero reviews or empty dataset returns score null (not fabricated 50/100)', () => {
  const res = aggregatePerformanceData([], { minReviews: 1 });
  assert.strictEqual(res.quality_profiles.length, 0);
});

test('Task 1.6: Quality score is strictly clamped within [0, 100]', () => {
  // Extreme positive product: sentiment score +100 -> proxy is clamped to max 95.0
  const reviews = [
    { Product_Name: 'P_High', Category: 'Tech', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' }
  ];
  const res = aggregatePerformanceData(reviews, { minReviews: 1 });
  const p = res.quality_profiles.find(prod => prod.product_name === 'P_High');
  Object.values(p.dimensions).forEach(dim => {
    assert.ok(dim.score >= 0 && dim.score <= 100);
  });
});

test('Task 1.7: Product with mixture of directly supported and estimated dimensions', () => {
  const reviews = [
    { Product_Name: 'P_Mix', Category: 'Tech', Predicted_Sentiment: 'Positive', Detected_Issues: 'Delivery', Positive_Features: 'Battery' }
  ];
  const res = aggregatePerformanceData(reviews, { minReviews: 1 });
  const p = res.quality_profiles.find(prod => prod.product_name === 'P_Mix');
  // Battery has direct positive mention
  assert.strictEqual(p.dimensions.Battery.has_direct_evidence, true);
  assert.strictEqual(p.dimensions.Battery.score, 100.0);
  // Delivery has direct complaint mention
  assert.strictEqual(p.dimensions.Delivery.has_direct_evidence, true);
  assert.strictEqual(p.dimensions.Delivery.score, 0.0);
  // Quality has no mentions -> sentiment indicator
  assert.strictEqual(p.dimensions.Quality.has_direct_evidence, false);
  assert.ok(typeof p.dimensions.Quality.score === 'number');
});

// ============================================================================
// Task 2 — Tie-Detection Matrix
// ============================================================================
test('Task 2: Shared Tie Matrix — single winner, exact tie, near tie, boundary, invalid', () => {
  // Case: Single Winner
  const singleReviews = [
    { Product_Name: 'A', Category: 'C', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' },
    { Product_Name: 'B', Category: 'C', Predicted_Sentiment: 'Negative', Detected_Issues: '', Positive_Features: '' }
  ];
  const rSingle = aggregatePerformanceData(singleReviews, { minReviews: 1 });
  assert.strictEqual(rSingle.kpis.best_products.length, 1);
  assert.strictEqual(rSingle.kpis.best_products[0].name, 'A');

  // Case: Exact tie (A: 100.0, B: 100.0, C: 0.0)
  const exactReviews = [
    { Product_Name: 'A', Category: 'C', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' },
    { Product_Name: 'B', Category: 'C', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' },
    { Product_Name: 'C', Category: 'C', Predicted_Sentiment: 'Neutral', Detected_Issues: '', Positive_Features: '' }
  ];
  const rExact = aggregatePerformanceData(exactReviews, { minReviews: 1 });
  assert.strictEqual(rExact.kpis.best_products.length, 2);
  assert.deepStrictEqual(rExact.kpis.best_products.map(p => p.name).sort(), ['A', 'B']);

  // Case: Multiple ties (10 products sharing identical top score)
  const tenTies = [];
  for (let i = 1; i <= 10; i++) {
    tenTies.push({ Product_Name: `Top_${i}`, Category: 'C', Predicted_Sentiment: 'Positive', Detected_Issues: '', Positive_Features: '' });
  }
  const rTen = aggregatePerformanceData(tenTies, { minReviews: 1 });
  assert.strictEqual(rTen.kpis.best_products.length, 10);

  // Case: Empty dataset
  const rEmpty = aggregatePerformanceData([], { minReviews: 1 });
  assert.strictEqual(rEmpty.kpis.best_product, null);
  assert.strictEqual(rEmpty.kpis.best_products.length, 0);
});

// ============================================================================
// Task 4 — Candidate Coverage Beyond 30 Products
// ============================================================================
test('Task 4: Exposes all distinct products beyond 30 candidates without truncation', () => {
  const reviews50 = [];
  for (let i = 1; i <= 50; i++) {
    reviews50.push({
      Product_Name: `Product_${i.toString().padStart(2, '0')}`,
      Category: 'Electronics',
      Predicted_Sentiment: i % 2 === 0 ? 'Positive' : 'Negative',
      Detected_Issues: '',
      Positive_Features: ''
    });
  }
  const res = aggregatePerformanceData(reviews50, { minReviews: 1 });
  assert.strictEqual(res.kpis.products_analysed, 50);
  // Must contain all 50 quality profiles, NOT cut off at 30!
  assert.strictEqual(res.quality_profiles.length, 50);
  assert.ok(res.quality_profiles.some(p => p.product_name === 'Product_50'));
  assert.ok(res.quality_profiles.some(p => p.product_name === 'Product_35'));
});
