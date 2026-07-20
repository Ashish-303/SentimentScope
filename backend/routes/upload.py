from flask import Blueprint
from flask import request
from flask import jsonify
from werkzeug.utils import secure_filename

import os
import sys

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
    sys.path.append(ML_SRC)

from csv_analyzer import analyze_csv
from dashboard_generator import (
    generate_dashboard
)

upload_bp = Blueprint(
    "upload",
    __name__
)

UPLOAD_FOLDER = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "..",
        "uploads"
    )
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


@upload_bp.route(
    "/upload",
    methods=["POST"]
)
def upload():

    try:

        # ==========================
        # FILE VALIDATION
        # ==========================

        if "file" not in request.files:

            return jsonify({

                "status": "error",

                "message":
                "No file uploaded"

            }), 400

        file = request.files["file"]

        if file.filename == "":

            return jsonify({

                "status": "error",

                "message":
                "No file selected"

            }), 400

        # ==========================
        # SAVE FILE
        # ==========================

        filename = secure_filename(file.filename)
        filepath = os.path.join(
            UPLOAD_FOLDER,
            filename
        )

        file.save(
            filepath
        )

        print(
            f"File Saved: {filepath}"
        )

        # ==========================
        # ANALYZE CSV
        # ==========================

        result_df = analyze_csv(
            filepath
        )

        # ==========================
        # GENERATE DASHBOARD
        # ==========================

        dashboard = (
            generate_dashboard(
                result_df
            )
        )

        # ==========================
        # RESPONSE
        # ==========================

        return jsonify({

            "status": "success",

            "filename":
            filename,

            "rows_processed":
            len(result_df),

            "columns":
            result_df.columns.tolist(),

            "dashboard":
            dashboard

        })

    except ValueError as e:

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 400

    except Exception as e:

        return jsonify({

            "status": "error",

            "message": str(e)

        }), 500
