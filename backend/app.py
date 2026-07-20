from flask import Flask
from flask_cors import CORS

from routes.analyze import analyze_bp
from routes.upload import upload_bp
from routes.dashboard import dashboard_bp

app = Flask(__name__)

# ==========================================
# CORS
# ==========================================

CORS(app)

# ==========================================
# Register Blueprints
# ==========================================

app.register_blueprint(analyze_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(dashboard_bp)

# ==========================================
# Home Route
# ==========================================

@app.route("/")
def home():

    return {
        "project": "SentimentScope",
        "version": "2.0",
        "status": "Running",
        "description": "Sentiment Analysis and Review Insights B.Tech Project",
        "available_endpoints": [
            "/",
            "/analyze",
            "/upload",
            "/dashboard"
        ]
    }

# ==========================================
# Run Server
# ==========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )