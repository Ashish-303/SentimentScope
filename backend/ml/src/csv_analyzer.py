"""Batch CSV Analyzer for SentimentScope.

Loads review datasets, validates column schemas, runs prediction inference on each
review row, extracts aspects, and builds standardized summary metrics.
"""

import os
import logging
import pandas as pd

# Ensure the backend directory is in the python path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import sys
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from predictor import predictor
from complaint_detector import detect_issue
from positive_detector import detect_positive_features
from validators import validate_columns

# Initialize Logger
logger = logging.getLogger("SentimentScope.CSVAnalyzer")


def analyze_csv(csv_path: str) -> pd.DataFrame:
    """Performs batch sentiment classification and aspect mining on a CSV dataset.

    Args:
        csv_path: Absolute filepath to the input reviews CSV.

    Returns:
        A pandas DataFrame enriched with predicted sentiments, complaints, and highlights.
    """
    logger.info(f"Initiating analysis on dataset: {csv_path}")

    df = pd.read_csv(csv_path, encoding='utf-8')
    logger.info(f"Original shape: {df.shape}")

    (
        product_col,
        text_col,
        category_col,
        rating_col
    ) = validate_columns(df)

    logger.info(f"Product Column Selected: {product_col}")
    logger.info(f"Text Column Selected: {text_col}")
    logger.info(f"Category Column Selected: {category_col}")
    logger.info(f"Rating Column Selected: {rating_col}")

    # Remove rows with missing review text
    df = df.dropna(subset=[text_col])
    logger.info(f"Shape after removing null reviews: {df.shape}")

    # Batch predict sentiments
    reviews_list = [str(r) for r in df[text_col]]
    logger.info(f"Running batch sentiment prediction for {len(reviews_list)} reviews...")

    try:
        sentiments = predictor.predict_batch(reviews_list)
    except Exception as e:
        logger.exception("Failed to run batch predictions.")
        sentiments = ["Neutral"] * len(reviews_list)

    # Perform aspect mining row-by-row based on predicted sentiment
    issues = []
    positive_features = []
    total_reviews = len(reviews_list)

    logger.info("Executing aspect mining on predicted sentiments...")
    for index, (review, sentiment) in enumerate(zip(reviews_list, sentiments), start=1):
        try:
            issues_list = []
            positive_features_list = []

            if str(sentiment).lower() == "negative":
                issues_list = detect_issue(review)
                if len(issues_list) == 0:
                    issues_list = ["Other"]
            elif str(sentiment).lower() == "positive":
                positive_features_list = detect_positive_features(review)
                if len(positive_features_list) == 0:
                    positive_features_list = ["General Satisfaction"]

            issues.append(", ".join(issues_list))
            positive_features.append(", ".join(positive_features_list))

            if index % 500 == 0:
                logger.info(f"Progress: Analyzed aspects for {index}/{total_reviews}")

        except Exception as e:
            logger.error(f"Error processing row {index}: {e}")
            issues.append("Other")
            positive_features.append("General Satisfaction")

    # ==================================
    # STANDARDIZED COLUMNS
    # ==================================
    df["Product_Name"] = df[product_col]
    df["Review_Text"] = df[text_col]

    if category_col:
        df["Category"] = df[category_col]
    else:
        logger.warning("Category column missing. Performing rule-based dynamic mapping from product names...")
        def extract_category(product_name: str) -> str:
            name = str(product_name).lower()
            if any(x in name for x in ["cooler", "fan", "ac", "heater", "purifier", "water purifier", "kettle", "oven"]):
                return "Home & Kitchen"
            elif any(x in name for x in ["lipstick", "shampoo", "serum", "cream", "facial", "makeup", "soap", "hair"]):
                return "Beauty"
            elif any(x in name for x in ["speaker", "alexa", "headphones", "earbuds", "tv", "camera", "mobile", "router", "laptop"]):
                return "Electronics"
            elif any(x in name for x in ["sewing", "tool", "drill", "vacuum", "cleaner", "iron"]):
                return "Tools & Appliances"
            elif any(x in name for x in ["toy", "game", "lego", "board", "puzzle"]):
                return "Toys & Games"
            elif any(x in name for x in ["shirt", "jeans", "scarf", "wool", "dress", "shoes", "bag"]):
                return "Fashion"
            elif any(x in name for x in ["supplement", "multivitamin", "protein", "massager"]):
                return "Health & Personal Care"
            else:
                return "Sports & Outdoors"
        df["Category"] = df["Product_Name"].apply(extract_category)

    if rating_col:
        df["Rating"] = pd.to_numeric(df[rating_col], errors="coerce")

    # ==================================
    # MODEL OUTPUT
    # ==================================
    df["Predicted_Sentiment"] = sentiments
    df["Detected_Issues"] = issues
    df["Positive_Features"] = positive_features

    # ==================================
    # SUMMARY
    # ==================================
    logger.info("Batch CSV analysis processing completed.")
    logger.info(f"Sentiment distribution summary:\n{df['Predicted_Sentiment'].value_counts()}")
    logger.info(f"Top Positive Features summary:\n{df['Positive_Features'].value_counts().head(10)}")
    logger.info(f"Unique products identified: {df['Product_Name'].nunique()}")

    return df


# ==================================
# TEST RUNNER
# ==================================
if __name__ == "__main__":
    import config

    CSV_PATH = os.path.join(
        config.DATA_DIR,
        "sample_reviews.csv"
    )

    if os.path.exists(CSV_PATH):
        result_df = analyze_csv(CSV_PATH)
        print("\n[Test Mode] Analysis Complete.")
        print(result_df.head())

        OUTPUT_PATH = config.ANALYZED_DATA_PATH
        result_df.to_csv(OUTPUT_PATH, index=False)
        print(f"\n[Test Mode] Saved Output To:\n{OUTPUT_PATH}")
    else:
        print(f"\n[Test Mode] Test source file not found at: {CSV_PATH}")