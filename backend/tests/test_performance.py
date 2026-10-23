"""Unit and Integration Tests for Product Performance Intelligence.

Tests product aggregation, score calculation, ranking logic, risk thresholds,
complaint intelligence, radar profile generation, and Flask API endpoints.
"""

import os
import sys
import pytest
import pandas as pd

# Add backend directory to sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC_DIR = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

from app import app
from utils.performance_aggregations import (
    calculate_sentiment_score,
    aggregate_product_performance,
    DEFAULT_MIN_REVIEWS,
    DEFAULT_RISK_THRESHOLD
)
from services.performance_service import PerformanceService


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def sample_reviews_df():
    """Generates a synthetic DataFrame for deterministic calculation verification."""
    data = [
        # Product A: 6 reviews -> 4 Pos (66.7%), 1 Neu (16.7%), 1 Neg (16.7%) -> Score: +50.0%
        {"Product_Name": "Product A", "Category": "Electronics", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Quality, Performance"},
        {"Product_Name": "Product A", "Category": "Electronics", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Battery"},
        {"Product_Name": "Product A", "Category": "Electronics", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Design"},
        {"Product_Name": "Product A", "Category": "Electronics", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Quality"},
        {"Product_Name": "Product A", "Category": "Electronics", "Predicted_Sentiment": "Neutral", "Detected_Issues": "", "Positive_Features": ""},
        {"Product_Name": "Product A", "Category": "Electronics", "Predicted_Sentiment": "Negative", "Detected_Issues": "Delivery", "Positive_Features": ""},

        # Product B: 5 reviews -> 1 Pos (20.0%), 0 Neu, 4 Neg (80.0%) -> Score: -60.0% -> At Risk!
        {"Product_Name": "Product B", "Category": "Electronics", "Predicted_Sentiment": "Negative", "Detected_Issues": "Quality, Battery", "Positive_Features": ""},
        {"Product_Name": "Product B", "Category": "Electronics", "Predicted_Sentiment": "Negative", "Detected_Issues": "Battery", "Positive_Features": ""},
        {"Product_Name": "Product B", "Category": "Electronics", "Predicted_Sentiment": "Negative", "Detected_Issues": "Delivery", "Positive_Features": ""},
        {"Product_Name": "Product B", "Category": "Electronics", "Predicted_Sentiment": "Negative", "Detected_Issues": "Pricing", "Positive_Features": ""},
        {"Product_Name": "Product B", "Category": "Electronics", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Quality"},

        # Product C: 2 reviews (< min_reviews=5) -> 2 Pos -> Score: +100%, but should be excluded from default ranking
        {"Product_Name": "Product C", "Category": "Fashion", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Quality"},
        {"Product_Name": "Product C", "Category": "Fashion", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Quality"},

        # Product D: 5 reviews -> 3 Pos (60.0%), 1 Neu (20.0%), 1 Neg (20.0%) -> Score: +40.0%
        {"Product_Name": "Product D", "Category": "Home & Kitchen", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Value for Money"},
        {"Product_Name": "Product D", "Category": "Home & Kitchen", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Quality"},
        {"Product_Name": "Product D", "Category": "Home & Kitchen", "Predicted_Sentiment": "Positive", "Detected_Issues": "", "Positive_Features": "Ease of Use"},
        {"Product_Name": "Product D", "Category": "Home & Kitchen", "Predicted_Sentiment": "Neutral", "Detected_Issues": "", "Positive_Features": ""},
        {"Product_Name": "Product D", "Category": "Home & Kitchen", "Predicted_Sentiment": "Negative", "Detected_Issues": "Service", "Positive_Features": ""}
    ]
    return pd.DataFrame(data)


def test_sentiment_score_formula():
    """Formula must be Positive % minus Negative %."""
    assert calculate_sentiment_score(80.0, 10.0) == 70.0
    assert calculate_sentiment_score(20.0, 70.0) == -50.0
    assert calculate_sentiment_score(50.0, 50.0) == 0.0


def test_product_aggregation_and_ranking(sample_reviews_df):
    """Verifies product rankings and scoring logic."""
    res = aggregate_product_performance(sample_reviews_df, min_reviews=5)
    
    kpis = res["kpis"]
    assert kpis["products_analysed"] == 4
    assert kpis["total_reviews"] == 18
    assert kpis["at_risk_count"] == 1  # Product B has 80% negative sentiment (>40%) and 5 reviews

    # Best product among eligible products (>= 5 reviews) must be Product A (score +50.0)
    assert kpis["best_product"]["name"] == "Product A"
    assert kpis["best_product"]["score"] == 50.0

    # Top products ranking: Product A (50.0), Product D (40.0), Product B (-60.0)
    top_names = [p["product_name"] for p in res["top_products"]]
    assert top_names == ["Product A", "Product D", "Product B"]

    # Bottom products ranking: Product B (-60.0) first
    bottom_names = [p["product_name"] for p in res["bottom_products"]]
    assert bottom_names[0] == "Product B"
    assert res["bottom_products"][0]["sentiment_score"] == -60.0


def test_at_risk_threshold_qualification(sample_reviews_df):
    """Product must satisfy both neg_pct > threshold AND total_reviews >= min_reviews."""
    # With min_reviews=3, Product B is at risk
    res1 = aggregate_product_performance(sample_reviews_df, min_reviews=3, risk_threshold=0.40)
    assert res1["kpis"]["at_risk_count"] == 1

    # With higher threshold of 85%, Product B (80%) is not at risk
    res2 = aggregate_product_performance(sample_reviews_df, min_reviews=5, risk_threshold=0.85)
    assert res2["kpis"]["at_risk_count"] == 0


def test_category_and_sentiment_filtering(sample_reviews_df):
    """Filters must narrow dataset and recompute KPIs accordingly."""
    # Filter by Category = Electronics
    res_elec = aggregate_product_performance(sample_reviews_df, category="Electronics")
    assert res_elec["kpis"]["products_analysed"] == 2
    assert res_elec["kpis"]["total_reviews"] == 11

    # Filter by Sentiment = Negative
    res_neg = aggregate_product_performance(sample_reviews_df, sentiment="Negative")
    assert res_neg["kpis"]["total_reviews"] == 6

    # Filter by Product Search
    res_search = aggregate_product_performance(sample_reviews_df, search="Product D")
    assert res_search["kpis"]["products_analysed"] == 1
    assert res_search["kpis"]["total_reviews"] == 5


def test_common_complaints_aggregation(sample_reviews_df):
    """Verifies that complaints are correctly tallied and attributed to distinct products."""
    res = aggregate_product_performance(sample_reviews_df)
    complaints = {c["category"]: c for c in res["common_complaints"]}
    
    # Battery mentioned 2 times in Product B
    assert "Battery" in complaints
    assert complaints["Battery"]["count"] == 2
    assert complaints["Battery"]["affected_products"] == 1

    # Delivery mentioned in Product A and Product B -> 2 affected products
    assert "Delivery" in complaints
    assert complaints["Delivery"]["count"] == 2
    assert complaints["Delivery"]["affected_products"] == 2


def test_empty_dataframe_handling():
    """Handles empty DataFrame safely without runtime exceptions."""
    empty_df = pd.DataFrame()
    res = aggregate_product_performance(empty_df)
    assert res["kpis"]["products_analysed"] == 0
    assert res["kpis"]["total_reviews"] == 0
    assert res["top_products"] == []
    assert res["common_complaints"] == []


def test_api_performance_endpoint_success(client):
    """Tests GET /api/performance endpoint with default dataset."""
    response = client.get("/api/performance")
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["status"] == "success"
    assert "kpis" in json_data["data"]
    assert "top_products" in json_data["data"]
    assert "bottom_products" in json_data["data"]
    assert "risk_volume_scatter" in json_data["data"]
    assert "common_complaints" in json_data["data"]
    assert "complaint_breakdown_worst5" in json_data["data"]
    assert "quality_profiles" in json_data["data"]


def test_api_performance_datasets_endpoint(client):
    """Tests GET /api/performance/datasets endpoint."""
    response = client.get("/api/performance/datasets")
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["status"] == "success"
    assert isinstance(json_data["datasets"], list)
    assert len(json_data["datasets"]) > 0
