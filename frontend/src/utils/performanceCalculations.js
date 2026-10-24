/**
 * Client-Side Performance Calculations for SentimentScope.
 * 
 * Mirrors backend aggregation logic for zero-latency interactive filtering
 * when reviews are loaded into memory.
 */

export const DEFAULT_MIN_REVIEWS = 5;
export const DEFAULT_RISK_THRESHOLD = 0.40; // 40% negative sentiment
export const TIE_TOLERANCE = 0.0001; // Documented tolerance for sentiment score equality in tie detection (0.0001 points)

export const RADAR_DIMENSION_MAPPINGS = {
  Quality: {
    positive: ['Quality'],
    complaint: ['Quality']
  },
  Delivery: {
    positive: ['Delivery'],
    complaint: ['Delivery']
  },
  Value: {
    positive: ['Value for Money'],
    complaint: ['Pricing']
  },
  Design: {
    positive: ['Design'],
    complaint: ['Features', 'Material & Fabric', 'Size & Fit']
  },
  Battery: {
    positive: ['Battery'],
    complaint: ['Battery']
  },
  Service: {
    positive: ['Ease of Use', 'General Satisfaction'],
    complaint: ['Service']
  }
};

export const CATEGORY_COLORS = {
  'Electronics': '#2563EB',
  'Fashion': '#9333EA',
  'Beauty': '#DB2777',
  'Books': '#EA580C',
  'Home & Kitchen': '#D97706',
  'Toys & Games': '#0891B2',
  'Sports & Outdoors': '#16A34A',
  'Tools & Appliances': '#4F46E5',
  'Health & Personal Care': '#0D9488',
  'General': '#64748B'
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#64748B';
}

/**
 * Calculates Sentiment Score = Positive % - Negative %
 */
export function calculateSentimentScore(posPct, negPct) {
  return Number((Number(posPct) - Number(negPct)).toFixed(1));
}

/**
 * Aggregates review data into complete performance analytics.
 */
export function aggregatePerformanceData(reviews = [], options = {}) {
  const {
    minReviews = DEFAULT_MIN_REVIEWS,
    riskThreshold = DEFAULT_RISK_THRESHOLD,
    category = 'All',
    sentiment = 'All',
    search = ''
  } = options;

  if (!reviews || !reviews.length) {
    return {
      kpis: {
        products_analysed: 0,
        best_product: null,
        best_products: [],
        at_risk_count: 0,
        total_reviews: 0,
        risk_threshold_pct: Math.round(riskThreshold * 100),
        min_reviews_threshold: minReviews
      },
      available_categories: [],
      top_products: [],
      bottom_products: [],
      all_ranked_products: [],
      risk_volume_scatter: [],
      common_complaints: [],
      complaint_breakdown_worst5: [],
      quality_profiles: []
    };
  }

  // Extract all categories before category filter
  const allCategories = [...new Set(
    reviews.map(r => r.Category || r.category).filter(Boolean).map(c => String(c).trim())
  )].sort();

  // Apply filters
  let filtered = reviews;
  if (category && category !== 'All') {
    filtered = filtered.filter(r => (r.Category || r.category) === category);
  }
  if (sentiment && sentiment !== 'All') {
    filtered = filtered.filter(r => (r.Predicted_Sentiment || r.sentiment) === sentiment);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(r => {
      const name = String(r.Product_Name || r.product_title || r.product_name || '').toLowerCase();
      return name.includes(q);
    });
  }

  const totalReviews = filtered.length;

  if (!totalReviews) {
    return {
      kpis: {
        products_analysed: 0,
        best_product: null,
        best_products: [],
        at_risk_count: 0,
        total_reviews: 0,
        risk_threshold_pct: Math.round(riskThreshold * 100),
        min_reviews_threshold: minReviews
      },
      available_categories: allCategories,
      top_products: [],
      bottom_products: [],
      all_ranked_products: [],
      risk_volume_scatter: [],
      common_complaints: [],
      complaint_breakdown_worst5: [],
      quality_profiles: []
    };
  }

  // Group by Product
  const productGroups = {};
  const complaintCounts = {};
  const complaintProducts = {};

  filtered.forEach(r => {
    const pName = String(r.Product_Name || r.product_title || r.product_name || 'Unknown Product').trim();
    const cat = String(r.Category || r.category || 'General').trim();
    const sent = String(r.Predicted_Sentiment || r.sentiment || 'Neutral').trim();
    const rawIssues = String(r.Detected_Issues || r.detected_issues || '');
    const rawFeatures = String(r.Positive_Features || r.positive_features || '');

    if (!productGroups[pName]) {
      productGroups[pName] = {
        product_name: pName,
        category: cat,
        total_reviews: 0,
        positive_count: 0,
        neutral_count: 0,
        negative_count: 0,
        issues: {},
        positive_features: {}
      };
    }

    const g = productGroups[pName];
    g.total_reviews += 1;
    if (sent === 'Positive') g.positive_count += 1;
    else if (sent === 'Negative') g.negative_count += 1;
    else g.neutral_count += 1;

    // Parse complaints
    if (rawIssues) {
      rawIssues.split(',').forEach(c => {
        const item = c.trim();
        if (item && item.toLowerCase() !== 'other' && item.toLowerCase() !== 'none') {
          g.issues[item] = (g.issues[item] || 0) + 1;
          complaintCounts[item] = (complaintCounts[item] || 0) + 1;
          if (!complaintProducts[item]) complaintProducts[item] = new Set();
          complaintProducts[item].add(pName);
        }
      });
    }

    // Parse highlights
    if (rawFeatures) {
      rawFeatures.split(',').forEach(h => {
        const item = h.trim();
        if (item && item.toLowerCase() !== 'general satisfaction' && item.toLowerCase() !== 'none') {
          g.positive_features[item] = (g.positive_features[item] || 0) + 1;
        }
      });
    }
  });

  const productStats = Object.values(productGroups).map(g => {
    const tot = g.total_reviews;
    const posPct = tot > 0 ? Number(((g.positive_count / tot) * 100).toFixed(1)) : 0;
    const neuPct = tot > 0 ? Number(((g.neutral_count / tot) * 100).toFixed(1)) : 0;
    const negPct = tot > 0 ? Number(((g.negative_count / tot) * 100).toFixed(1)) : 0;
    const score = calculateSentimentScore(posPct, negPct);
    const isAtRisk = (negPct / 100 >= riskThreshold) && (tot >= minReviews);
    const meetsMin = tot >= minReviews;

    return {
      product_name: g.product_name,
      category: g.category,
      total_reviews: tot,
      positive_count: g.positive_count,
      neutral_count: g.neutral_count,
      negative_count: g.negative_count,
      positive_pct: posPct,
      neutral_pct: neuPct,
      negative_pct: negPct,
      sentiment_score: score,
      is_at_risk: isAtRisk,
      meets_min_reviews: meetsMin,
      issues: g.issues,
      positive_features: g.positive_features
    };
  });

  const eligibleProducts = productStats.filter(p => p.meets_min_reviews);
  const rankingPool = eligibleProducts.length ? eligibleProducts : productStats;

  // Top products: sorted by sentiment_score desc, tie-break total_reviews desc
  const sortedDesc = [...rankingPool].sort((a, b) => {
    if (b.sentiment_score !== a.sentiment_score) return b.sentiment_score - a.sentiment_score;
    if (b.total_reviews !== a.total_reviews) return b.total_reviews - a.total_reviews;
    return a.product_name.localeCompare(b.product_name);
  });

  // Bottom products: sorted by sentiment_score asc, tie-break total_reviews desc
  const sortedAsc = [...rankingPool].sort((a, b) => {
    if (a.sentiment_score !== b.sentiment_score) return a.sentiment_score - b.sentiment_score;
    if (b.total_reviews !== a.total_reviews) return b.total_reviews - a.total_reviews;
    return a.product_name.localeCompare(b.product_name);
  });

  const topScore = sortedDesc.length && typeof sortedDesc[0].sentiment_score === 'number' && !isNaN(sortedDesc[0].sentiment_score)
    ? sortedDesc[0].sentiment_score
    : null;
  const bestProducts = topScore !== null
    ? sortedDesc
        .filter(p => typeof p.sentiment_score === 'number' && !isNaN(p.sentiment_score) && Math.abs(p.sentiment_score - topScore) < TIE_TOLERANCE)
        .map(p => ({
          name: p.product_name,
          score: p.sentiment_score,
          reviews: p.total_reviews,
          positive_pct: p.positive_pct,
          negative_pct: p.negative_pct,
          category: p.category
        }))
    : [];

  const bestProduct = bestProducts.length ? bestProducts[0] : null;

  const atRiskCount = productStats.filter(p => p.is_at_risk).length;

  // Chart 2: Scatter data
  const riskVolumeScatter = productStats.map(p => ({
    name: p.product_name,
    category: p.category,
    reviews: p.total_reviews,
    negative_pct: p.negative_pct,
    positive_pct: p.positive_pct,
    neutral_pct: p.neutral_pct,
    sentiment_score: p.sentiment_score,
    negative_reviews: p.negative_count,
    is_at_risk: p.is_at_risk
  }));

  // Chart 3: Common Complaints
  const commonComplaints = Object.entries(complaintCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([catName, count]) => ({
      category: catName,
      count,
      percentage: totalReviews > 0 ? Number(((count / totalReviews) * 100).toFixed(1)) : 0,
      affected_products: (complaintProducts[catName] || new Set()).size
    }));

  // Chart 4: Worst 5 products complaint breakdown
  const worst5 = sortedAsc.slice(0, 5);
  const complaintBreakdownWorst5 = worst5.map(p => ({
    product_name: p.product_name,
    category: p.category,
    sentiment_score: p.sentiment_score,
    total_reviews: p.total_reviews,
    issues: p.issues
  }));

  // Chart 5: Radar Quality Profile candidate products
  // Includes all distinct products in dataset so users can select and compare any of them.
  // Ranked products appear first, followed by unranked products (e.g. < minReviews).
  const rankedNames = new Set(sortedDesc.map(p => p.product_name));
  const unranked = productStats
    .filter(p => !rankedNames.has(p.product_name))
    .sort((a, b) => {
      if (b.total_reviews !== a.total_reviews) return b.total_reviews - a.total_reviews;
      if (b.sentiment_score !== a.sentiment_score) return b.sentiment_score - a.sentiment_score;
      return a.product_name.localeCompare(b.product_name);
    });
  const allQualityCandidates = [...sortedDesc, ...unranked];

  const qualityProfiles = allQualityCandidates.map(prod => {
    const dimensions = {};
    Object.entries(RADAR_DIMENSION_MAPPINGS).forEach(([dim, mappings]) => {
      const posMentions = mappings.positive.reduce((acc, cat) => acc + (prod.positive_features[cat] || 0), 0);
      const negMentions = mappings.complaint.reduce((acc, cat) => acc + (prod.issues[cat] || 0), 0);
      const totalMentions = posMentions + negMentions;

      let score = null;
      let hasDirect = false;
      if (totalMentions > 0) {
        score = Number(Math.max(0, Math.min(100, (posMentions / totalMentions) * 100)).toFixed(1));
        hasDirect = true;
      } else if (prod.total_reviews > 0 && typeof prod.sentiment_score === 'number' && !isNaN(prod.sentiment_score)) {
        // Sentiment-based proxy: maps score [-100, +100] to [10, 90] centered at 50, clamped [5.0, 95.0]
        score = Number(Math.max(5, Math.min(95, 50 + (prod.sentiment_score * 0.4))).toFixed(1));
        hasDirect = false;
      } else {
        score = null;
        hasDirect = false;
      }

      dimensions[dim] = {
        score,
        positive_mentions: posMentions,
        negative_mentions: negMentions,
        has_direct_evidence: hasDirect
      };
    });

    return {
      product_name: prod.product_name,
      category: prod.category,
      total_reviews: prod.total_reviews,
      sentiment_score: prod.sentiment_score,
      dimensions
    };
  });

  return {
    kpis: {
      products_analysed: Object.keys(productGroups).length,
      best_product: bestProduct,
      best_products: bestProducts,
      at_risk_count: atRiskCount,
      total_reviews: totalReviews,
      risk_threshold_pct: Math.round(riskThreshold * 100),
      min_reviews_threshold: minReviews
    },
    available_categories: allCategories,
    top_products: sortedDesc.slice(0, 10),
    bottom_products: sortedAsc.slice(0, 10),
    all_ranked_products: sortedDesc,
    risk_volume_scatter: riskVolumeScatter,
    common_complaints: commonComplaints,
    complaint_breakdown_worst5: complaintBreakdownWorst5,
    quality_profiles: qualityProfiles
  };
}
