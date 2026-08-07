"""Unified Scikit-learn Pipeline Builder.

Constructs a unified, leakage-free Scikit-learn Pipeline combining text preprocessing,
TF-IDF vectorization, Chi-Square feature selection, and any dynamically injected
classification estimator.
"""

import os
import sys
import logging
from typing import Any, Union

# Ensure backend and ML source directories are in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC not in sys.path:
    sys.path.insert(0, ML_SRC)

import config
from text_normalizer import clean_text

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.pipeline import Pipeline

# Initialize Logger
logger = logging.getLogger("SentimentScope.PipelineBuilder")


class DynamicSelectKBest(SelectKBest):
    """Custom SelectKBest that clips K to fit input feature counts dynamically.

    Prevents Scikit-learn from raising UserWarnings during fitting operations when
    vocabulary sizes are smaller than the configured K limit.
    """
    
    def fit(self, X, y=None):
        n_features = X.shape[1]
        
        # Save original k parameter if not cached
        if not hasattr(self, "_original_k"):
            self._original_k = self.k
            
        if isinstance(self.k, str):
            if self.k.lower() != "all":
                raise ValueError(f"Invalid string value for k: '{self.k}'. Did you mean 'all'?")
            k_val = "all"
        elif isinstance(self.k, (int, float)):
            k_val = int(self.k)
            if k_val > n_features:
                logger.info(f"Vocabulary features count ({n_features}) is less than K limit ({k_val}). "
                            f"Clipping SelectKBest K to {n_features} to prevent warnings.")
                k_val = n_features
        else:
            k_val = self.k
            
        self.k = k_val
        return super().fit(X, y)


def build_sentiment_pipeline(
    classifier: Any,
    max_features: int = config.TFIDF_MAX_FEATURES,
    ngram_range: tuple = config.TFIDF_NGRAM_RANGE,
    chi2_k: Union[int, str] = config.CHI2_FEATURES_K,
    chi2_enabled: bool = config.CHI2_ENABLED
) -> Pipeline:
    """Builds a unified, leakage-free Scikit-learn Pipeline.

    Args:
        classifier: Instantiated sklearn-compatible estimator class.
        max_features: Maximum feature limit for TF-IDF.
        ngram_range: N-gram range tuple configuration.
        chi2_k: Top K features to retain in Chi-Square selection (or "all").
        chi2_enabled: Flag indicating if Chi-Square selection should be included.

    Returns:
        An un-fit Scikit-learn Pipeline wrapper object.

    Raises:
        TypeError: If classifier is missing fit/predict/predict_proba interfaces.
        ValueError: If configuration or validation parameters are invalid.
    """
    logger.info("Starting unified Scikit-learn Pipeline construction...")

    # ==========================================
    # CLASSIFIER VALIDATION
    # ==========================================
    if classifier is None:
        raise ValueError("Classifier estimator instance cannot be None.")
    
    if not (hasattr(classifier, "fit") and (hasattr(classifier, "predict") or hasattr(classifier, "predict_proba"))):
        raise TypeError("Classifier must be an instantiated Scikit-learn estimator.")

    # ==========================================
    # TF-IDF PARAMETER VALIDATION & INITIALIZATION
    # ==========================================
    if not isinstance(max_features, int) or max_features <= 0:
        raise ValueError(f"Invalid max_features '{max_features}'. Must be a positive integer.")
    
    if not isinstance(ngram_range, tuple) or len(ngram_range) != 2 or ngram_range[0] < 1 or ngram_range[1] < ngram_range[0]:
        raise ValueError(f"Invalid ngram_range '{ngram_range}'. Must be a tuple of (min_n, max_n).")

    logger.info(
        f"Initializing TfidfVectorizer: max_features={max_features}, ngram_range={ngram_range}, "
        f"sublinear_tf={config.TFIDF_SUBLINEAR_TF}, min_df={config.TFIDF_MIN_DF}, max_df={config.TFIDF_MAX_DF}"
    )

    vectorizer = TfidfVectorizer(
        preprocessor=clean_text,  # Clean text string directly on feature extraction fit/transform
        max_features=max_features,
        ngram_range=ngram_range,
        min_df=config.TFIDF_MIN_DF,
        max_df=config.TFIDF_MAX_DF,
        sublinear_tf=config.TFIDF_SUBLINEAR_TF,
        use_idf=config.TFIDF_USE_IDF,
        smooth_idf=config.TFIDF_SMOOTH_IDF,
        norm=config.TFIDF_NORM
    )

    # ==========================================
    # CHI-SQUARE VALIDATION & INITIALIZATION
    # ==========================================
    pipeline_steps = [("tfidf", vectorizer)]

    if chi2_enabled:
        if isinstance(chi2_k, str):
            if chi2_k.lower() != "all":
                raise ValueError(f"Invalid Chi-Square K string value '{chi2_k}'. Did you mean 'all'?")
            k_val = "all"
        elif isinstance(chi2_k, int):
            if chi2_k <= 0:
                raise ValueError(f"Invalid Chi-Square K value '{chi2_k}'. Must be positive.")
            k_val = chi2_k
        else:
            raise TypeError(f"Invalid Chi-Square K type '{type(chi2_k)}'. Must be int or string 'all'.")

        logger.info(f"Initializing Chi-Square Selector (DynamicSelectKBest): score_func=chi2, k={k_val}")
        selector = DynamicSelectKBest(score_func=chi2, k=k_val)
        pipeline_steps.append(("chi2", selector))
    else:
        logger.info("Chi-Square Feature Selection is disabled in configuration. Skipping step.")

    # ==========================================
    # CLASSIFIER INJECTION & PIPELINE BUILD
    # ==========================================
    pipeline_steps.append(("classifier", classifier))
    
    logger.info(f"Dynamically injecting classifier: {classifier.__class__.__name__}")
    pipeline = Pipeline(pipeline_steps)

    logger.info("Unified Scikit-learn Pipeline compiled successfully.")
    return pipeline


# ==========================================
# TEST RUNNER
# ==========================================
if __name__ == "__main__":
    from sklearn.linear_model import LogisticRegression
    import joblib

    print("Executing Pipeline Construction Verification Run...")
    print("=" * 60)
    
    try:
        clf = LogisticRegression(random_state=config.FEATURE_RANDOM_STATE)
        sentiment_pipeline = build_sentiment_pipeline(clf)
        
        # Test Serialization
        temp_model_path = os.path.join(config.MODEL_DIR, "test_pipeline_structure.pkl")
        print(f"Testing pipeline serialization to: {temp_model_path}")
        joblib.dump(sentiment_pipeline, temp_model_path)
        
        # Test Deserialization
        print("Testing pipeline deserialization...")
        loaded_pipeline = joblib.load(temp_model_path)
        print("Deserialization complete.")
        
        # Cleanup
        if os.path.exists(temp_model_path):
            os.remove(temp_model_path)
            
        print("Pipeline verification completed successfully with zero exceptions.")
        
    except Exception as e:
        print(f"Exception during verification: {e}")
        sys.exit(1)
