"""Flask API Blueprint for Dashboard Aggregates Retrieval.

Provides the API endpoint to read the analyzed CSV file and retrieve compiled
KPIs, sentiment counts, issue metrics, and positive features.
"""

import os
import logging
import pandas as pd
from flask import Blueprint, jsonify

import config
from dashboard_generator import generate_dashboard

# Initialize Logger
logger = logging.getLogger("SentimentScope.Dashboard")

# Initialize Blueprint
dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """Reads the primary batch-analyzed CSV and returns calculated business intelligence aggregates."""
    try:
        csv_path = config.ANALYZED_DATA_PATH
        logger.info(f"Reading analyzed CSV database from: {csv_path}")

        if not os.path.exists(csv_path):
            logger.warning(f"Analyzed database not found at path: {csv_path}. Returning empty context.")
            # Gracefully handle missing database file by returning empty metrics
            return jsonify({
                "status": "error",
                "message": "Analyzed dataset has not been uploaded yet."
            }), 404

        df = pd.read_csv(csv_path)
        dashboard_data = generate_dashboard(df)

        # Return all analyzed rows for the frontend Data Table and Analytics.
        display_cols = [c for c in [
            "Product_Name", "Category", "Review_Text",
            "Predicted_Sentiment", "Detected_Issues", "Positive_Features"
        ] if c in df.columns]
        review_rows = df[display_cols].fillna("").to_dict(orient="records")

        return jsonify({
            "status": "success",
            "data": dashboard_data,
            "review_data": review_rows
        })

    except Exception as e:
        logger.exception("Failed to retrieve dashboard aggregates.")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500