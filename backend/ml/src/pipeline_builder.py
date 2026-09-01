"""Unified Scikit-learn Pipeline Builder.

Constructs a unified, leakage-free Scikit-learn Pipeline combining text preprocessing,
TF-IDF vectorization, Chi-Square feature selection, and any dynamically injected
classification estimator.
"""

import os
import sys
import logging
from typing import Any, Union

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

ML_SRC = os.path.join(BASE_DIR, "ml", "src")
if ML_SRC not in sys.path:
    sys.path.insert(0, ML_SRC)

import config
from text_normalizer import clean_text

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.pipeline import Pipeline

logger = logging.getLogger("SentimentScope.PipelineBuilder")


class DynamicSelectKBest(SelectKBest):
    """Custom SelectKBest that clips K to fit input feature counts dynamically.

    Prevents Scikit-learn from raising UserWarnings during fitting operations when
    vocabulary sizes are smaller than the configured K limit.
    """
    
    def fit(self, X, y=None):
        n_features = X.shape[1]
        
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
    """Builds a unified, leakage-free Scikit-learn Pipeline."""
    logger.info("Starting unified Scikit-learn Pipeline construction...")

    if classifier is None:
        raise ValueError("Classifier estimator instance cannot be None.")
    
    if not (hasattr(classifier, "fit") and (hasattr(classifier, "predict") or hasattr(classifier, "predict_proba"))):
        raise TypeError("Classifier must be an instantiated Scikit-learn estimator.")

    if not isinstance(max_features, int) or max_features <= 0:
        raise ValueError(f"Invalid max_features '{max_features}'. Must be a positive integer.")
    
    if not isinstance(ngram_range, tuple) or len(ngram_range) != 2 or ngram_range[0] < 1 or ngram_range[1] < ngram_range[0]:
        raise ValueError(f"Invalid ngram_range '{ngram_range}'. Must be a tuple of (min_n, max_n).")

    vectorizer = TfidfVectorizer(
        preprocessor=clean_text,
        max_features=max_features,
        ngram_range=ngram_range,
        min_df=config.TFIDF_MIN_DF,
        max_df=config.TFIDF_MAX_DF,
        sublinear_tf=config.TFIDF_SUBLINEAR_TF,
        use_idf=config.TFIDF_USE_IDF,
        smooth_idf=config.TFIDF_SMOOTH_IDF,
        norm=config.TFIDF_NORM
    )

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

        selector = DynamicSelectKBest(score_func=chi2, k=k_val)
        pipeline_steps.append(("chi2", selector))

    pipeline_steps.append(("classifier", classifier))
    return Pipeline(pipeline_steps)
