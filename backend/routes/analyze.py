"""Flask API Blueprint for Single Review Sentiment Analysis.

Defines the API endpoint to run real-time sentiment extraction, complaint detection,
and positive feature extraction on single text inputs.
"""

import logging
from flask import Blueprint, request, jsonify

import config
from predictor import analyze_review

# Initialize Logger
logger = logging.getLogger("SentimentScope.Analyze")

# Initialize Blueprint
analyze_bp = Blueprint("analyze", __name__)

@analyze_bp.route("/analyze", methods=["POST"])
def analyze():
    """Processes a single text review and returns multi-dimensional analytical scores."""
    try:
        data = request.get_json()

        if not data:
            logger.warning("Empty JSON payload received.")
            return jsonify({
                "status": "error",
                "message": "No JSON data provided"
            }), 400

        review = data.get("review", "")
        review = str(review).strip()

        if review == "":
            logger.warning("Review text is missing in the payload.")
            return jsonify({
                "status": "error",
                "message": "Review text is required"
            }), 400

        logger.info(f"Incoming single-review analysis request: {review[:60]}...")
        result = analyze_review(review)

        return jsonify({
            "status": "success",
            "data": result
        })

    except Exception as e:
        logger.exception("Failed to analyze single review.")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
