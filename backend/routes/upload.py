"""Flask API Blueprint for Batch CSV Sentiment Uploads.

Defines the endpoint to handle multipart CSV files, validates them, saves them,
runs prediction analytics, and compiles the metrics dashboard payload.
"""

import os
import logging
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

import config
from csv_analyzer import analyze_csv
from dashboard_generator import generate_dashboard

# Initialize Logger
logger = logging.getLogger("SentimentScope.Upload")

# Initialize Blueprint
upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/upload", methods=["POST"])
def upload():
    """Validates uploaded review CSV files, performs batch analysis, and returns aggregates."""
    try:
        # ==========================
        # FILE VALIDATION
        # ==========================
        if "file" not in request.files:
            logger.warning("Upload attempt failed: File field missing in multipart request.")
            return jsonify({
                "status": "error",
                "message": "No file uploaded"
            }), 400

        file = request.files["file"]

        if file.filename == "":
            logger.warning("Upload attempt failed: Filename is empty.")
            return jsonify({
                "status": "error",
                "message": "No file selected"
            }), 400

        # Validate file extensions using central configuration settings
        if not file.filename.lower().endswith(".csv"):
            logger.warning(f"Upload attempt failed: Invalid file type {file.filename}.")
            return jsonify({
                "status": "error",
                "message": "Only CSV files are allowed"
            }), 400

        # ==========================
        # SAVE FILE
        # ==========================
        filename = secure_filename(file.filename)
        filepath = os.path.join(config.UPLOAD_FOLDER, filename)

        logger.info(f"Saving uploaded CSV file to: {filepath}")
        file.save(filepath)

        # ==========================
        # ANALYZE CSV
        # ==========================
        logger.info(f"Initiating batch CSV analysis for file: {filename}")
        result_df = analyze_csv(filepath)

        # ==========================
        # GENERATE DASHBOARD
        # ==========================
        logger.info("Compiling analytic summary dashboard metrics.")
        dashboard = generate_dashboard(result_df)

        # ==========================
        # RESPONSE
        # ==========================
        return jsonify({
            "status": "success",
            "filename": filename,
            "rows_processed": len(result_df),
            "columns": result_df.columns.tolist(),
            "dashboard": dashboard
        })

    except ValueError as e:
        logger.error(f"Validation error in CSV schema: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

    except Exception as e:
        logger.exception("Failed to complete batch upload analysis.")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
