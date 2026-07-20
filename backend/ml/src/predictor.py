import os
import sys
import joblib

# Ensure the directory containing this file is in the python path
BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from text_normalizer import clean_text
from complaint_detector import detect_issue
from positive_detector import detect_positive_features

# ==================================
# PATHS
# ==================================

MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "models",
    "sentiment_model.pkl"
)

VECTORIZER_PATH = os.path.join(
    BASE_DIR,
    "..",
    "models",
    "tfidf_vectorizer.pkl"
)

# ==================================
# LOAD MODEL
# ==================================

model = joblib.load(
    MODEL_PATH
)

vectorizer = joblib.load(
    VECTORIZER_PATH
)

# ==================================
# SENTIMENT PREDICTION
# ==================================

def predict_sentiment(review):

    review = str(review).strip()

    if review == "":
        return "Neutral"

    cleaned = clean_text(
        review
    )

    vector = vectorizer.transform(
        [cleaned]
    )

    prediction = model.predict(
        vector
    )[0]

    return prediction


# ==================================
# COMPLETE REVIEW ANALYSIS
# ==================================

def analyze_review(review):

    review = str(review)

    sentiment = predict_sentiment(
        review
    )

    # Initialize empty lists for clean categorization
    issues = []
    positive_features = []

    # Negative Reviews -> Extract complaints
    if str(sentiment).lower() == "negative":
        issues = detect_issue(review)
        if len(issues) == 0:
            issues = ["Other"]

    # Positive Reviews -> Extract strengths (what they liked)
    elif str(sentiment).lower() == "positive":
        positive_features = detect_positive_features(review)
        if len(positive_features) == 0:
            positive_features = ["General Satisfaction"]

    return {

        "review": review,

        "sentiment": sentiment,

        "issue": issues,

        "positive_features":
        positive_features
    }


# ==================================
# TEST
# ==================================

if __name__ == "__main__":

    reviews = [

        "Amazing product. Highly recommended.",

        "Worth every penny and excellent quality.",

        "Fast delivery and beautiful packaging.",

        "Worst purchase ever.",

        "The package arrived damaged and I am disappointed.",

        "Customer support never replied.",

        "The product stopped working after 2 days.",

        "Easy to use and durable.",

        "Top-notch build and performance.",

        "Exactly what I needed."
    ]

    for review in reviews:

        result = analyze_review(
            review
        )

        print(result)

        print("-" * 60)