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

        return jsonify({
            "status": "success",
            "data": dashboard_data
        })

    except Exception as e:
        logger.exception("Failed to retrieve dashboard aggregates.")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500