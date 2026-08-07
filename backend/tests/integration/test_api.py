"""Integration Test Suite for SentimentScope Flask REST API endpoints.

Tests Flask application initialization, route mapping, single review analysis,
batch multipart CSV upload, business intelligence dashboard extraction, health checks,
and graceful exception mapping.
"""

import os
import sys
import json
import pytest
import pandas as pd
from io import BytesIO

# Ensure backend directory is in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC_DIR = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

from app import app
import config


@pytest.fixture
def client():
    """Initializes the Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_home_route(client):
    """Verifies that the root catalog route responds correctly."""
    response = client.get("/")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["project"] == "SentimentScope"
    assert "available_endpoints" in data
    assert "/health" in data["available_endpoints"]


def test_health_endpoint(client):
    """Verifies that the /health endpoint reports healthy pipeline diagnostics."""
    response = client.get("/health")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "healthy"
    assert "model_loaded" in data
    assert data["model"] == "Logistic Regression"
    assert data["pipeline"] == "Unified"
    assert data["version"] == "1.6.0"


def test_analyze_endpoint_success(client):
    """Verifies that single review sentiment extraction runs and maps output structure."""
    payload = {"review": "This is an absolutely amazing washing machine! Quiet and fast."}
    response = client.post(
        "/analyze",
        data=json.dumps(payload),
        content_type="application/json"
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "success"
    assert "data" in data
    assert data["data"]["sentiment"] in ["Positive", "Neutral", "Negative"]
    assert "review" in data["data"]
    assert isinstance(data["data"]["issue"], list)
    assert isinstance(data["data"]["positive_features"], list)


def test_analyze_endpoint_validation_errors(client):
    """Verifies analyze endpoint bad request validation rules."""
    # 1. Empty payload
    response1 = client.post("/analyze", data=json.dumps({}), content_type="application/json")
    assert response1.status_code == 400
    assert "No JSON data provided" in json.loads(response1.data)["message"]

    # 2. Empty string review
    response2 = client.post("/analyze", data=json.dumps({"review": "   "}), content_type="application/json")
    assert response2.status_code == 400
    assert "Review text is required" in json.loads(response2.data)["message"]


def test_dashboard_endpoint_graceful_missing_data(client):
    """Verifies that dashboard aggregates endpoint handles missing database files gracefully."""
    # Temporarily rename analyzed csv if it exists to test 404
    csv_path = config.ANALYZED_DATA_PATH
    temp_path = csv_path + ".tmp"
    has_csv = os.path.exists(csv_path)

    if has_csv:
        os.rename(csv_path, temp_path)

    try:
        response = client.get("/dashboard")
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data["status"] == "error"
        assert "Analyzed dataset has not been uploaded yet" in data["message"]
    finally:
        # Restore CSV
        if has_csv and os.path.exists(temp_path):
            os.rename(temp_path, csv_path)


def test_batch_csv_upload_and_dashboard_integration(client):
    """Validates CSV batch processing, file uploads, schema validation, and dashboard creation."""
    # Create a small dummy CSV file
    csv_data = (
        "product_name,review_text,category,rating\n"
        "Lakme Eyeliner,This kajal smudges easily,Beauty,2\n"
        "Bajaj Heater,Incredible warmth and very silent.,Appliances,5\n"
        "Nike Shoes,Okay fit but overpriced.,Fashion,3\n"
    )
    
    file_payload = {
        "file": (BytesIO(csv_data.encode("utf-8")), "test_reviews.csv")
    }

    # Test file upload
    response = client.post(
        "/upload",
        data=file_payload,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "success"
    assert data["filename"] == "test_reviews.csv"
    assert data["rows_processed"] == 3
    assert "dashboard" in data
    
    # Test dashboard aggregates endpoint returns success now that database is written
    dash_response = client.get("/dashboard")
    assert dash_response.status_code == 200
    dash_data = json.loads(dash_response.data)
    assert dash_data["status"] == "success"
    assert "data" in dash_data
    assert "positive_reviews" in dash_data["data"]
    assert "category_summary" in dash_data["data"]
