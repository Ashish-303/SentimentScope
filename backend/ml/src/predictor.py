"""Unified Sentiment Predictor Service for SentimentScope.

Implements a thread-safe, lazy-loading prediction class that loads and queries
the frozen unified Scikit-learn Pipeline (sentiment_model.pkl).
"""

import os
import sys
import time
import joblib
import logging
import threading
from typing import List, Dict, Any

# Ensure backend and ML directories are in the system path for dynamic unpickling
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC_DIR = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

ML_TRAINING_DIR = os.path.join(BACKEND_DIR, "ml", "training")
if ML_TRAINING_DIR not in sys.path:
    sys.path.insert(0, ML_TRAINING_DIR)

import config
from text_normalizer import clean_text
from complaint_detector import detect_issue
from positive_detector import detect_positive_features

# Initialize Logger
logger = logging.getLogger("SentimentScope.Predictor")


class SentimentPredictor:
    """Thread-safe, lazy-loaded prediction engine for the unified model pipeline."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if not cls._instance:
                cls._instance = super(SentimentPredictor, cls).__new__(cls, *args, **kwargs)
                cls._instance._model = None
                cls._instance._load_lock = threading.Lock()
        return cls._instance

    def load_model(self) -> None:
        """Lazily loads the unified Scikit-learn Pipeline pickle file from disk."""
        if self._model is not None:
            return

        with self._load_lock:
            # Double check to prevent race condition when lock was waiting
            if self._model is not None:
                return

            model_path = config.SENTIMENT_MODEL_PATH
            logger.info(f"Initiating lazy load of unified pipeline model from: {model_path}")

            if not os.path.exists(model_path):
                logger.error(f"Unified model file not found at: {model_path}")
                raise FileNotFoundError(f"Unified model file not found at: {model_path}")

            try:
                start_time = time.time()
                self._model = joblib.load(model_path)
                load_duration = time.time() - start_time
                logger.info(f"Unified pipeline model loaded and cached successfully in {load_duration:.4f}s.")
            except Exception as e:
                logger.exception("Failed to load/unpickle unified model pipeline.")
                raise RuntimeError(f"Error loading sentiment model pipeline: {e}")

    def predict(self, review: str) -> str:
        """Predicts the sentiment label for a single review.

        Args:
            review: Raw user review text string.

        Returns:
            The predicted sentiment class ('Positive', 'Neutral', or 'Negative').
        """
        if review is None:
            logger.warning("Received None review input. Defaulting prediction to 'Neutral'.")
            return "Neutral"

        review_str = str(review).strip()
        if review_str == "":
            return "Neutral"

        self.load_model()
        cleaned = clean_text(review_str)

        try:
            start_time = time.time()
            prediction = self._model.predict([cleaned])[0]
            latency_ms = (time.time() - start_time) * 1000
            logger.info(f"Single prediction complete: latency={latency_ms:.2f}ms, prediction='{prediction}'")
            return str(prediction)
        except Exception as e:
            logger.error(f"Inference error during single prediction: {e}")
            raise e

    def predict_batch(self, reviews: List[str]) -> List[str]:
        """Runs batch sentiment prediction on a list of raw review text inputs.

        Args:
            reviews: List of raw review strings.

        Returns:
            List of predicted sentiment class labels.
        """
        if not reviews:
            return []

        self.load_model()

        # Clean all reviews in the batch first
        cleaned_reviews = []
        for r in reviews:
            if r is None:
                cleaned_reviews.append("")
            else:
                cleaned_reviews.append(clean_text(str(r).strip()))

        try:
            start_time = time.time()
            predictions = self._model.predict(cleaned_reviews)
            latency_ms = (time.time() - start_time) * 1000
            logger.info(f"Batch prediction complete: size={len(reviews)}, latency={latency_ms:.2f}ms")
            return [str(p) for p in predictions]
        except Exception as e:
            logger.error(f"Inference error during batch prediction: {e}")
            raise e

    def predict_proba(self, review: str) -> Dict[str, float]:
        """Retrieves prediction confidence scores across all target classes.

        Args:
            review: Raw user review text string.

        Returns:
            A dictionary mapping sentiment classes to probability scores.
        """
        if review is None:
            return {"Negative": 0.0, "Neutral": 1.0, "Positive": 0.0}

        review_str = str(review).strip()
        if review_str == "":
            return {"Negative": 0.0, "Neutral": 1.0, "Positive": 0.0}

        self.load_model()
        cleaned = clean_text(review_str)

        try:
            proba = self._model.predict_proba([cleaned])[0]
            classes = self._model.classes_
            return {str(c): float(p) for c, p in zip(classes, proba)}
        except Exception as e:
            logger.error(f"Error computing prediction probabilities: {e}")
            raise e

    def health_check(self) -> Dict[str, Any]:
        """Provides status and pipeline diagnostics."""
        return {
            "status": "healthy",
            "model_loaded": self._model is not None,
            "model": "Logistic Regression",
            "pipeline": "Unified",
            "version": "1.6.0"
        }


# Singleton Predictor Instance
predictor = SentimentPredictor()


def predict_sentiment(review: str) -> str:
    """Wrapper function for backward compatibility."""
    return predictor.predict(review)


def analyze_review(review: str) -> Dict[str, Any]:
    """Runs complete review analysis (sentiment + rule-based aspect mining).

    Args:
        review: Raw user review text string.

    Returns:
        Dictionary mapping input review, predicted sentiment, issues, and highlights.
    """
    review_str = str(review)
    sentiment = predictor.predict(review_str)

    issues = []
    positive_features = []

    # Aspect Mining extraction based on sentiment
    if str(sentiment).lower() == "negative":
        issues = detect_issue(review_str)
        if len(issues) == 0:
            issues = ["Other"]
    elif str(sentiment).lower() == "positive":
        positive_features = detect_positive_features(review_str)
        if len(positive_features) == 0:
            positive_features = ["General Satisfaction"]

    return {
        "review": review_str,
        "sentiment": sentiment,
        "issue": issues,
        "positive_features": positive_features
    }


# ==============================================================================
# TEST HARNESS
# ==============================================================================
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting predictor test diagnostics...")

    test_reviews = [
        "Amazing product. Highly recommended.",
        "Worth every penny and excellent quality.",
        "Worst purchase ever. Complete waste of money.",
        "The package arrived damaged and I am disappointed.",
        "Customer support never replied.",
        "The product stopped working after 2 days."
    ]

    # Test single predictions
    for rev in test_reviews:
        res = analyze_review(rev)
        print(f"Review: {rev}\nResult: {res}\n" + "-" * 50)

    # Test batch predictions
    batch_preds = predictor.predict_batch(test_reviews)
    print(f"\nBatch Predictions: {batch_preds}")

    # Test health check
    print(f"\nHealth Check: {predictor.health_check()}")