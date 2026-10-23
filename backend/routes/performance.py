"""Flask API Blueprint for Product Performance Intelligence.

Exposes endpoints for retrieving product performance metrics, ranking lists,
risk vs volume scatter data, and complaint intelligence across datasets.
"""

import logging
from flask import Blueprint, request, jsonify

from services.performance_service import PerformanceService
from utils.performance_aggregations import DEFAULT_MIN_REVIEWS, DEFAULT_RISK_THRESHOLD

logger = logging.getLogger("SentimentScope.PerformanceRoute")

performance_bp = Blueprint("performance", __name__)


@performance_bp.route("/api/performance", methods=["GET"])
@performance_bp.route("/performance", methods=["GET"])
def get_performance():
    """Retrieves product performance aggregates and rankings for the specified dataset and filters."""
    try:
        dataset = request.args.get("dataset", None)
        category = request.args.get("category", "All")
        sentiment = request.args.get("sentiment", "All")
        search = request.args.get("search", "")

        try:
            min_reviews = int(request.args.get("min_reviews", DEFAULT_MIN_REVIEWS))
        except (ValueError, TypeError):
            min_reviews = DEFAULT_MIN_REVIEWS

        try:
            risk_threshold = float(request.args.get("risk_threshold", DEFAULT_RISK_THRESHOLD))
        except (ValueError, TypeError):
            risk_threshold = DEFAULT_RISK_THRESHOLD

        data = PerformanceService.get_performance_data(
            dataset_name=dataset,
            category=category,
            sentiment=sentiment,
            search=search,
            min_reviews=min_reviews,
            risk_threshold=risk_threshold
        )

        return jsonify({
            "status": "success",
            "data": data
        }), 200

    except FileNotFoundError as e:
        logger.warning(f"Dataset not found: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 404
    except Exception as e:
        logger.exception("Failed to retrieve performance intelligence data.")
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500


@performance_bp.route("/api/performance/datasets", methods=["GET"])
@performance_bp.route("/performance/datasets", methods=["GET"])
def get_performance_datasets():
    """Returns the list of genuine review datasets available for performance analysis."""
    try:
        datasets = PerformanceService.get_available_datasets()
        return jsonify({
            "status": "success",
            "datasets": datasets
        }), 200
    except Exception as e:
        logger.exception("Failed to list available datasets.")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
