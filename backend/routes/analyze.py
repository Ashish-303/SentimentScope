from flask import Blueprint
from flask import request
from flask import jsonify

import sys
import os

# ==================================
# PATH SETUP
# ==================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

ML_SRC = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "..",
        "ml",
        "src"
    )
)

if ML_SRC not in sys.path:

    sys.path.append(
        ML_SRC
    )

from predictor import (
    analyze_review
)

# ==================================
# BLUEPRINT
# ==================================

analyze_bp = Blueprint(
    "analyze",
    __name__
)

# ==================================
# ANALYZE SINGLE REVIEW
# ==================================

@analyze_bp.route(
    "/analyze",
    methods=["POST"]
)
def analyze():

    try:

        data = request.get_json()

        if not data:

            return jsonify({

                "status": "error",

                "message":
                "No JSON data provided"

            }), 400

        review = data.get(
            "review",
            ""
        )

        review = str(
            review
        ).strip()

        if review == "":

            return jsonify({

                "status": "error",

                "message":
                "Review text is required"

            }), 400

        result = analyze_review(
            review
        )

        return jsonify({

            "status": "success",

            "data": result

        })

    except Exception as e:

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 500
