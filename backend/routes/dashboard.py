from flask import Blueprint, jsonify
import pandas as pd
import os

from ml.src.dashboard_generator import generate_dashboard

dashboard_bp = Blueprint("dashboard", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CSV_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "data",
    "analyzed_reviews.csv"
)

@dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard():

    df = pd.read_csv(CSV_PATH)

    dashboard = generate_dashboard(df)

    return jsonify(dashboard)