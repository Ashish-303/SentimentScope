"""Centralized Configuration Manager for SentimentScope.

This module organizes all project constants, directory paths, upload rules,
and machine learning parameters into logical sections. It automatically
validates and creates required directories on startup.
"""

import os
from typing import Set

# Load environment variables from .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==============================================================================
# GENERAL APPLICATION CONFIGURATION
# ==============================================================================
# Global application random state for reproducibility
RANDOM_STATE: int = 42

# Base directory of the backend folder
BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))

# ==============================================================================
# PATH CONFIGURATION
# ==============================================================================
# ML root directory
ML_DIR: str = os.path.join(BASE_DIR, "ml")

# ML core source directory (used for path resolution)
ML_SRC_DIR: str = os.path.join(ML_DIR, "src")

# Pre-packaged configs directory
CONFIGS_DIR: str = os.path.join(BASE_DIR, "configs")

# Dynamic aspect mining keywords path
ASPECT_KEYWORDS_PATH: str = os.path.join(CONFIGS_DIR, "aspect_keywords.json")

# ==============================================================================
# UPLOAD CONFIGURATION
# ==============================================================================
# Temporary storage for uploaded CSV files
UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))

# Maximum permitted CSV upload size: 10 MB
MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_UPLOAD_SIZE", 10 * 1024 * 1024))

# Allowed file extensions for batch processing
ALLOWED_EXTENSIONS: Set[str] = {"csv"}

# ==============================================================================
# MACHINE LEARNING CONFIGURATION
# ==============================================================================
# Directory holding serializable model artifacts
MODEL_DIR: str = os.path.join(ML_DIR, "models")

# Deployed production model pipeline and TF-IDF files
SENTIMENT_MODEL_PATH: str = os.getenv("SENTIMENT_MODEL_PATH", os.path.join(MODEL_DIR, "sentiment_model.pkl"))
MODEL_PATH: str = SENTIMENT_MODEL_PATH

# Reference training data path
DATA_DIR: str = os.path.join(ML_DIR, "data")
BALANCED_DATA_PATH: str = os.path.join(DATA_DIR, "balanced_reviews.csv")
ANALYZED_DATA_PATH: str = os.path.join(DATA_DIR, "analyzed_reviews.csv")

# TF-IDF Feature configuration
TFIDF_MAX_FEATURES: int = 15000
TFIDF_MIN_DF: int = 2
TFIDF_MAX_DF: float = 0.90
TFIDF_NGRAM_RANGE: tuple = (1, 2)
TFIDF_SUBLINEAR_TF: bool = True
TFIDF_USE_IDF: bool = True
TFIDF_SMOOTH_IDF: bool = True
TFIDF_NORM: str = "l2"

# Chi-Square Feature Selection configuration
CHI2_ENABLED: bool = True
CHI2_FEATURES_K: int = 10000

# Feature Extraction Reproducibility
FEATURE_RANDOM_STATE: int = 42

# Advanced Text Preprocessing Configuration
ENABLE_UNICODE_NORMALIZATION: bool = True
ENABLE_HTML_REMOVAL: bool = True
ENABLE_URL_REPLACEMENT: bool = True
ENABLE_EMAIL_REPLACEMENT: bool = True
ENABLE_MENTION_REPLACEMENT: bool = True
ENABLE_HASHTAG_NORMALIZATION: bool = True
ENABLE_EMOJI_TRANSLATION: bool = True
ENABLE_CONTRACTION_EXPANSION: bool = True
ENABLE_LOWERCASE: bool = True
ENABLE_REPEATED_CHAR_NORMALIZATION: bool = True
ENABLE_PUNCTUATION_NORMALIZATION: bool = True
ENABLE_NUMBER_HANDLING: bool = True  # Keep numbers as string tokens
ENABLE_NEGATION_PRESERVATION: bool = True
ENABLE_LEMMATIZATION: bool = True
ENABLE_STOPWORD_REMOVAL: bool = True

DEFAULT_LANGUAGE: str = "english"
DEFAULT_ENCODING: str = "utf-8"

# Preprocessing Replacement Tokens
URL_REPLACEMENT_TOKEN: str = ""
EMAIL_REPLACEMENT_TOKEN: str = ""
MENTION_REPLACEMENT_TOKEN: str = ""

# ==============================================================================
# REPORT & LOGGING CONFIGURATION
# ==============================================================================
# Reporting root directory
REPORT_DIR: str = os.path.join(ML_DIR, "reports")

# Subdirectories for visual, tabular, and model run reports
REPORT_TABLES_DIR: str = os.path.join(REPORT_DIR, "tables")
REPORT_FIGURES_DIR: str = os.path.join(REPORT_DIR, "figures")
REPORT_METRICS_DIR: str = os.path.join(REPORT_DIR, "metrics")
REPORT_STATS_DIR: str = os.path.join(REPORT_DIR, "statistical_tests")
REPORT_LOGS_DIR: str = os.path.join(REPORT_DIR, "logs")

# Runtime application log filepath
APP_LOG_PATH: str = os.path.join(REPORT_LOGS_DIR, "app.log")

# Environment security credentials
SECRET_KEY: str = os.getenv("SECRET_KEY", "default_dev_secret_key_sentiment_scope_71829")
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

# ==============================================================================
# CONFIGURATION VALIDATION
# ==============================================================================
# Automatically create all required runtime directories on startup
for folder_path in [
    UPLOAD_FOLDER,
    REPORT_DIR,
    REPORT_TABLES_DIR,
    REPORT_FIGURES_DIR,
    REPORT_METRICS_DIR,
    REPORT_STATS_DIR,
    REPORT_LOGS_DIR,
    CONFIGS_DIR,
    MODEL_DIR,
    DATA_DIR
]:
    os.makedirs(folder_path, exist_ok=True)
