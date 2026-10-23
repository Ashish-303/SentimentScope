"""Performance Page Aggregation Utilities for SentimentScope.

Provides pure, vectorized and deterministic aggregation functions for computing
product rankings, risk metrics, complaint intelligence, and multi-dimensional quality scores.
All calculations are strictly derived from real analyzed review data.
"""

import math
from typing import Dict, List, Any, Optional
import pandas as pd


# Default thresholds
DEFAULT_MIN_REVIEWS: int = 5
DEFAULT_RISK_THRESHOLD: float = 0.40  # 40% negative sentiment

# Radar quality dimensions mapping to taxonomy categories
RADAR_DIMENSION_MAPPINGS = {
    "Quality": {
        "positive": ["Quality"],
        "complaint": ["Quality"]
    },
    "Delivery": {
        "positive": ["Delivery"],
        "complaint": ["Delivery"]
    },
    "Value": {
        "positive": ["Value for Money"],
        "complaint": ["Pricing"]
    },
    "Design": {
        "positive": ["Design"],
        "complaint": ["Features", "Material & Fabric", "Size & Fit"]
    },
    "Battery": {
        "positive": ["Battery"],
        "complaint": ["Battery"]
    },
    "Service": {
        "positive": ["Ease of Use", "General Satisfaction"],
        "complaint": ["Service"]
    }
}


def calculate_sentiment_score(positive_pct: float, negative_pct: float) -> float:
    """Calculates product sentiment score: Positive Percentage minus Negative Percentage.
    
    Formula: Sentiment Score = Positive % - Negative %
    Range: -100.0 to +100.0
    """
    return round(float(positive_pct) - float(negative_pct), 1)


def parse_multivalue_aspects(series: pd.Series) -> List[str]:
    """Helper to parse comma-separated aspect strings into a flat list of clean tokens."""
    tokens = []
    for entry in series.dropna():
        s = str(entry).strip()
        if not s or s.lower() in ["none", "other", "general satisfaction"]:
            continue
        for part in s.split(","):
            part_clean = part.strip()
            if part_clean and part_clean.lower() not in ["none", "other", "general satisfaction"]:
                tokens.append(part_clean)
    return tokens


def aggregate_product_performance(
    df: pd.DataFrame,
    min_reviews: int = DEFAULT_MIN_REVIEWS,
    risk_threshold: float = DEFAULT_RISK_THRESHOLD,
    category: str = "All",
    sentiment: str = "All",
    search: str = ""
) -> Dict[str, Any]:
    """Computes full product performance metrics, rankings, and chart aggregates.
    
    Args:
        df: DataFrame containing analyzed reviews with standard columns:
            Product_Name, Category, Predicted_Sentiment, Detected_Issues, Positive_Features.
        min_reviews: Minimum number of reviews required for ranking and risk qualification.
        risk_threshold: Negative sentiment ratio above which a product is classified at-risk (e.g. 0.40).
        category: Filter by specific category or 'All'.
        sentiment: Filter by sentiment class ('All', 'Positive', 'Neutral', 'Negative').
        search: Filter product names by case-insensitive substring search.
        
    Returns:
        Structured dictionary matching the Performance page specifications.
    """
    if df.empty or "Product_Name" not in df.columns:
        return {
            "kpis": {
                "products_analysed": 0,
                "best_product": None,
                "at_risk_count": 0,
                "total_reviews": 0,
                "risk_threshold_pct": round(risk_threshold * 100, 1),
                "min_reviews_threshold": min_reviews
            },
            "available_categories": [],
            "top_products": [],
            "bottom_products": [],
            "all_ranked_products": [],
            "risk_volume_scatter": [],
            "common_complaints": [],
            "complaint_breakdown_worst5": [],
            "quality_profiles": []
        }

    # Normalize column names if needed
    col_map = {}
    for c in df.columns:
        if c.lower() in ["product_name", "product_title", "product"]:
            col_map[c] = "Product_Name"
        elif c.lower() == "category":
            col_map[c] = "Category"
        elif c.lower() in ["predicted_sentiment", "sentiment"]:
            col_map[c] = "Predicted_Sentiment"
        elif c.lower() in ["detected_issues", "detected_issue", "issues"]:
            col_map[c] = "Detected_Issues"
        elif c.lower() in ["positive_features", "positive_feature", "highlights"]:
            col_map[c] = "Positive_Features"
    
    working_df = df.rename(columns=col_map).copy()
    working_df = working_df.loc[:, ~working_df.columns.duplicated()]

    # Available categories before filtering
    cat_series = working_df["Category"]
    if isinstance(cat_series, pd.DataFrame):
        cat_series = cat_series.iloc[:, 0]
    available_categories = sorted([
        str(c).strip() for c in cat_series.dropna().unique() if str(c).strip()
    ])

    # Apply Category filter
    filtered_df = working_df
    if category and category != "All":
        filtered_df = filtered_df[filtered_df["Category"] == category]

    # Apply Sentiment filter
    if sentiment and sentiment != "All":
        filtered_df = filtered_df[filtered_df["Predicted_Sentiment"] == sentiment]

    # Apply Product Search filter
    if search and search.strip():
        query = search.strip().lower()
        filtered_df = filtered_df[
            filtered_df["Product_Name"].astype(str).str.lower().str.contains(query, regex=False)
        ]

    total_filtered_reviews = len(filtered_df)
    unique_products_count = int(filtered_df["Product_Name"].nunique()) if total_filtered_reviews > 0 else 0

    if total_filtered_reviews == 0:
        return {
            "kpis": {
                "products_analysed": 0,
                "best_product": None,
                "at_risk_count": 0,
                "total_reviews": 0,
                "risk_threshold_pct": round(risk_threshold * 100, 1),
                "min_reviews_threshold": min_reviews
            },
            "available_categories": available_categories,
            "top_products": [],
            "bottom_products": [],
            "all_ranked_products": [],
            "risk_volume_scatter": [],
            "common_complaints": [],
            "complaint_breakdown_worst5": [],
            "quality_profiles": []
        }

    # Group by product
    product_stats = []
    
    # We aggregate from filtered_df so that search and category filters apply consistently
    for product_name, group in filtered_df.groupby("Product_Name"):
        prod_total = len(group)
        pos_count = int((group["Predicted_Sentiment"] == "Positive").sum())
        neu_count = int((group["Predicted_Sentiment"] == "Neutral").sum())
        neg_count = int((group["Predicted_Sentiment"] == "Negative").sum())

        pos_pct = round((pos_count / prod_total) * 100, 1) if prod_total > 0 else 0.0
        neu_pct = round((neu_count / prod_total) * 100, 1) if prod_total > 0 else 0.0
        neg_pct = round((neg_count / prod_total) * 100, 1) if prod_total > 0 else 0.0
        
        # Consistent formula: Positive % - Negative %
        sent_score = calculate_sentiment_score(pos_pct, neg_pct)

        # Primary category (most frequent in group)
        prod_cat = str(group["Category"].mode().iloc[0]) if not group["Category"].dropna().empty else "General"

        # Aspect counts for this product
        issues_dict: Dict[str, int] = {}
        if "Detected_Issues" in group.columns:
            for item in group["Detected_Issues"].dropna():
                for part in str(item).split(","):
                    p = part.strip()
                    if p and p.lower() not in ["", "none", "other"]:
                        issues_dict[p] = issues_dict.get(p, 0) + 1

        positive_dict: Dict[str, int] = {}
        if "Positive_Features" in group.columns:
            for item in group["Positive_Features"].dropna():
                for part in str(item).split(","):
                    p = part.strip()
                    if p and p.lower() not in ["", "none", "general satisfaction"]:
                        positive_dict[p] = positive_dict.get(p, 0) + 1

        # Risk definition: negative_sentiment > risk_threshold AND total_reviews >= min_reviews
        is_at_risk = bool((neg_pct / 100.0 >= risk_threshold) and (prod_total >= min_reviews))

        product_stats.append({
            "product_name": str(product_name),
            "category": prod_cat,
            "total_reviews": prod_total,
            "positive_count": pos_count,
            "neutral_count": neu_count,
            "negative_count": neg_count,
            "positive_pct": pos_pct,
            "neutral_pct": neu_pct,
            "negative_pct": neg_pct,
            "sentiment_score": sent_score,
            "is_at_risk": is_at_risk,
            "meets_min_reviews": bool(prod_total >= min_reviews),
            "issues": issues_dict,
            "positive_features": positive_dict
        })

    # Sort products: eligible products (meeting min_reviews) first for ranking, then all
    eligible_products = [p for p in product_stats if p["meets_min_reviews"]]
    
    # If no products meet min_reviews threshold, fallback to all available products
    ranking_pool = eligible_products if eligible_products else product_stats

    # Sort descending by sentiment score, tie-break by total reviews, then product name
    sorted_desc = sorted(
        ranking_pool,
        key=lambda x: (x["sentiment_score"], x["total_reviews"], x["product_name"]),
        reverse=True
    )
    
    # Sort ascending for bottom products
    sorted_asc = sorted(
        ranking_pool,
        key=lambda x: (x["sentiment_score"], -x["total_reviews"], x["product_name"])
    )

    # Best-performing product
    best_product = None
    if sorted_desc:
        top_item = sorted_desc[0]
        best_product = {
            "name": top_item["product_name"],
            "score": top_item["sentiment_score"],
            "reviews": top_item["total_reviews"],
            "positive_pct": top_item["positive_pct"],
            "negative_pct": top_item["negative_pct"],
            "category": top_item["category"]
        }

    # At-risk count: distinct products with negative sentiment exceeding risk_threshold and reviews >= min_reviews
    at_risk_count = sum(1 for p in product_stats if p["is_at_risk"])

    # Top 10 and Bottom 10 lists
    top_10 = sorted_desc[:10]
    bottom_10 = sorted_asc[:10]

    # All ranked products for View All table
    all_ranked = sorted_desc

    # Chart 2: Product Risk vs. Review Volume (Scatter / Bubble Plot)
    # Each product is a bubble:
    # X: total_reviews
    # Y: negative_pct
    # Size: negative_count
    # Category: category
    risk_volume_scatter = [
        {
            "name": p["product_name"],
            "category": p["category"],
            "reviews": p["total_reviews"],
            "negative_pct": p["negative_pct"],
            "positive_pct": p["positive_pct"],
            "neutral_pct": p["neutral_pct"],
            "sentiment_score": p["sentiment_score"],
            "negative_reviews": p["negative_count"],
            "is_at_risk": p["is_at_risk"]
        }
        for p in product_stats
    ]

    # Chart 3: Most Common Product Complaints across filtered dataset
    # For each category: mention count, % of analysed reviews, affected distinct products
    complaint_counts: Dict[str, int] = {}
    complaint_products: Dict[str, set] = {}

    for _, row in filtered_df.iterrows():
        pname = str(row["Product_Name"])
        raw_issues = str(row.get("Detected_Issues", ""))
        for part in raw_issues.split(","):
            issue = part.strip()
            if issue and issue.lower() not in ["", "none", "other"]:
                complaint_counts[issue] = complaint_counts.get(issue, 0) + 1
                if issue not in complaint_products:
                    complaint_products[issue] = set()
                complaint_products[issue].add(pname)

    common_complaints = []
    for cat_name, count in sorted(complaint_counts.items(), key=lambda x: x[1], reverse=True):
        pct = round((count / total_filtered_reviews) * 100, 1) if total_filtered_reviews > 0 else 0.0
        affected_prods = len(complaint_products.get(cat_name, set()))
        common_complaints.append({
            "category": cat_name,
            "count": count,
            "percentage": pct,
            "affected_products": affected_prods
        })

    # Chart 4: Complaint Breakdown (Worst 5 Products)
    # Select up to 5 lowest sentiment products
    worst_5 = sorted_asc[:5]
    complaint_breakdown_worst5 = []
    for prod in worst_5:
        complaint_breakdown_worst5.append({
            "product_name": prod["product_name"],
            "category": prod["category"],
            "sentiment_score": prod["sentiment_score"],
            "total_reviews": prod["total_reviews"],
            "issues": prod["issues"]
        })

    # Chart 5: Product Quality Profile (Radar Chart for up to 3 products)
    # Default to top 3 products in ranking, or top 1 + bottom 1 + middle
    # Generates radar scores (0-100) across 6 dimensions
    quality_profiles = []
    for prod in sorted_desc[:10]:  # compute for top candidates so UI can compare any of them
        dimensions_scores = {}
        for dim, mappings in RADAR_DIMENSION_MAPPINGS.items():
            pos_cats = mappings["positive"]
            comp_cats = mappings["complaint"]

            pos_mentions = sum(prod["positive_features"].get(cat, 0) for cat in pos_cats)
            neg_mentions = sum(prod["issues"].get(cat, 0) for cat in comp_cats)
            total_mentions = pos_mentions + neg_mentions

            if total_mentions > 0:
                score = round((pos_mentions / total_mentions) * 100.0, 1)
            else:
                # Bayesian / Dirichlet baseline informed by product's general sentiment score
                # Maps score from [-100, +100] to [10, 90] centered at 50
                score = round(max(5.0, min(95.0, 50.0 + (prod["sentiment_score"] * 0.4))), 1)

            dimensions_scores[dim] = {
                "score": score,
                "positive_mentions": pos_mentions,
                "negative_mentions": neg_mentions,
                "has_direct_evidence": bool(total_mentions > 0)
            }

        quality_profiles.append({
            "product_name": prod["product_name"],
            "category": prod["category"],
            "total_reviews": prod["total_reviews"],
            "sentiment_score": prod["sentiment_score"],
            "dimensions": dimensions_scores
        })

    return {
        "kpis": {
            "products_analysed": unique_products_count,
            "best_product": best_product,
            "at_risk_count": at_risk_count,
            "total_reviews": total_filtered_reviews,
            "risk_threshold_pct": round(risk_threshold * 100, 1),
            "min_reviews_threshold": min_reviews
        },
        "available_categories": available_categories,
        "top_products": top_10,
        "bottom_products": bottom_10,
        "all_ranked_products": all_ranked,
        "risk_volume_scatter": risk_volume_scatter,
        "common_complaints": common_complaints,
        "complaint_breakdown_worst5": complaint_breakdown_worst5,
        "quality_profiles": quality_profiles
    }
