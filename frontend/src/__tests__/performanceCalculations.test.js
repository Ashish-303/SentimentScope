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
