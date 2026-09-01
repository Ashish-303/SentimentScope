"""SentimentScope Flask Backend Application.

Main entry point of the web service. It initializes the Flask context,
configures logging parameters, handles cross-origin requests, registers routing
blueprints, and exposes global configurations.
"""

import os
import sys
import json
import logging

# ==============================================================================
# SYS PATH ENHANCEMENT
# ==============================================================================
# Ensure backend directory and ML source directory are in sys.path to prevent
# resolution failures in nested module imports.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

ML_SRC = os.path.join(BASE_DIR, "ml", "src")
if ML_SRC not in sys.path:
    sys.path.insert(0, ML_SRC)

# Now safe to import local modules
from flask import Flask, jsonify
from flask_cors import CORS

import config
from routes.analyze import analyze_bp
from routes.upload import upload_bp
from routes.dashboard import dashboard_bp

# ==============================================================================
# LOGGING FOUNDATION
# ==============================================================================
log_level_val = getattr(logging, config.LOG_LEVEL, logging.INFO)
handlers = [logging.StreamHandler(sys.stdout)]
try:
    if hasattr(config, "APP_LOG_PATH") and config.APP_LOG_PATH:
        os.makedirs(os.path.dirname(config.APP_LOG_PATH), exist_ok=True)
        handlers.append(logging.FileHandler(config.APP_LOG_PATH, encoding="utf-8"))
except Exception:
    pass

logging.basicConfig(
    level=log_level_val,
    format="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s",
    handlers=handlers
)

logger = logging.getLogger("SentimentScope")
logger.info("Starting SentimentScope backend initialization...")

# ==============================================================================
# FLASK APP SETUP
# ==============================================================================
app = Flask(__name__)
app.secret_key = config.SECRET_KEY

# Configure maximum permitted upload payload sizes
app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH
app.config["UPLOAD_FOLDER"] = config.UPLOAD_FOLDER

# Enable Cross-Origin Resource Sharing (CORS) for production clients
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Register endpoints via Blueprints
app.register_blueprint(analyze_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(dashboard_bp)

# ==============================================================================
# ROUTES
# ==============================================================================
@app.route("/")
def home():
    """Returns application status and endpoint catalog."""
    logger.info("Home route catalog requested.")
    return {
        "project": "SentimentScope",
        "version": "2.0",
        "status": "Running",
        "description": "AI Product Review Intelligence Platform",
        "available_endpoints": [
            "/",
            "/analyze",
            "/upload",
            "/dashboard",
            "/health",
            "/docs",
            "/swagger"
        ]
    }

@app.route("/health", methods=["GET"])
def health():
    """Returns the load diagnostics and service metadata of the sentiment pipeline."""
    try:
        from predictor import predictor
        status_data = predictor.health_check()
        return jsonify(status_data), 200
    except Exception as e:
        logger.exception("Health check endpoint failed.")
        return jsonify({
            "status": "unhealthy",
            "message": str(e)
        }), 500

@app.route("/swagger.json", methods=["GET"])
def swagger_json():
    """Serves the OpenAPI JSON specification."""
    try:
        json_path = os.path.join(config.CONFIGS_DIR, "swagger.json")
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        logger.exception("Failed to load swagger.json specification file.")
        return jsonify({
            "status": "error",
            "message": f"Swagger specification file not found or corrupted: {e}"
        }), 500

@app.route("/docs", methods=["GET"])
@app.route("/swagger", methods=["GET"])
def swagger_docs():
    """Serves the Swagger UI HTML page linked to /swagger.json."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SentimentScope API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.css" />
        <style>
            html { box-sizing: border-box; overflow: -y-scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin:0; background: #fafafa; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    url: "/swagger.json",
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout"
                });
                window.ui = ui;
            };
        </script>
    </body>
    </html>
    """, 200

# ==============================================================================
# SERVER EXECUTION
# ==============================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() in ["true", "1"]
    logger.info(f"Launching Flask server on 0.0.0.0:{port} (debug={debug})...")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )