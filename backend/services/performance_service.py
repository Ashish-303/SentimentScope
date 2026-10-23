"""Performance Service for SentimentScope.

Manages dataset loading, caching of analyzed reviews, and delegates aggregation to
performance_aggregations. Ensures zero redundant ML model executions for already analyzed datasets.
"""

import os
import sys
import logging
from typing import Dict, List, Any, Optional
import pandas as pd

# Path configuration
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC_DIR = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

import config
from csv_analyzer import analyze_csv
from utils.performance_aggregations import (
    aggregate_product_performance,
    DEFAULT_MIN_REVIEWS,
    DEFAULT_RISK_THRESHOLD
)

logger = logging.getLogger("SentimentScope.PerformanceService")

# In-memory dataframe cache: filename -> pd.DataFrame
_DATAFRAME_CACHE: Dict[str, pd.DataFrame] = {}


class PerformanceService:
    """Service layer for product performance analysis and dataset management."""

    @classmethod
    def get_available_datasets(cls) -> List[Dict[str, Any]]:
        """Scans allowed storage locations and returns genuine available datasets with metadata."""
        datasets = []
        seen_names = set()

        search_dirs = [
            config.UPLOAD_FOLDER,
            config.DATA_DIR
        ]

        for folder in search_dirs:
            if not os.path.exists(folder):
                continue
            for fname in os.listdir(folder):
                if not fname.lower().endswith(".csv") or fname.startswith(".") or fname.startswith("analyzed_"):
                    continue
                if fname in seen_names:
                    continue

                fpath = os.path.join(folder, fname)
                try:
                    size_bytes = os.path.getsize(fpath)
                    # Quick line count estimate without loading full CSV
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        row_count = max(0, sum(1 for _ in f) - 1)
                    
                    datasets.append({
                        "filename": fname,
                        "path": fpath,
                        "rows": row_count,
                        "size_bytes": size_bytes
                    })
                    seen_names.add(fname)
                except Exception as e:
                    logger.warning(f"Error inspecting dataset candidate {fpath}: {e}")

        # Also check analyzed_reviews.csv if available
        if os.path.exists(config.ANALYZED_DATA_PATH) and "analyzed_reviews.csv" not in seen_names:
            try:
                row_count = sum(1 for _ in open(config.ANALYZED_DATA_PATH, "r", encoding="utf-8", errors="ignore")) - 1
                datasets.append({
                    "filename": "analyzed_reviews.csv",
                    "path": config.ANALYZED_DATA_PATH,
                    "rows": max(0, row_count),
                    "size_bytes": os.path.getsize(config.ANALYZED_DATA_PATH)
                })
            except Exception:
                pass

        # Sort with SentimentScope_1000_random_reviews.csv first if present
        def sort_priority(item):
            name = item["filename"]
            if name == "SentimentScope_1000_random_reviews.csv":
                return (0, name)
            if name == "random_reviews_1000.csv":
                return (1, name)
            if name == "analyzed_reviews.csv":
                return (2, name)
            return (3, name)

        datasets.sort(key=sort_priority)
        return datasets

    @classmethod
    def resolve_dataset_path(cls, dataset_name: Optional[str] = None) -> Optional[str]:
        """Resolves the physical filepath for a requested dataset name."""
        if dataset_name:
            # Check in uploads
            p1 = os.path.join(config.UPLOAD_FOLDER, dataset_name)
            if os.path.exists(p1):
                return p1
            # Check in ml/data
            p2 = os.path.join(config.DATA_DIR, dataset_name)
            if os.path.exists(p2):
                return p2

        # Defaults in priority order:
        # 1. SentimentScope_1000_random_reviews.csv in uploads
        p_default = os.path.join(config.UPLOAD_FOLDER, "SentimentScope_1000_random_reviews.csv")
        if os.path.exists(p_default):
            return p_default

        # 2. analyzed_reviews.csv in ml/data
        if os.path.exists(config.ANALYZED_DATA_PATH):
            return config.ANALYZED_DATA_PATH

        # 3. Any available dataset
        candidates = cls.get_available_datasets()
        if candidates:
            return candidates[0]["path"]

        return None

    @classmethod
    def load_analyzed_dataframe(cls, dataset_path: str) -> pd.DataFrame:
        """Loads and caches the analyzed dataframe for a dataset path.
        
        If pre-analyzed cache exists on disk or in-memory, loads instantly.
        Otherwise performs batch CSV analysis and caches the enriched result.
        """
        filename = os.path.basename(dataset_path)

        # 1. In-memory cache
        if filename in _DATAFRAME_CACHE:
            logger.debug(f"Serving {filename} from in-memory cache.")
            return _DATAFRAME_CACHE[filename]

        # 2. Check if the file is already analyzed (has Predicted_Sentiment column)
        try:
            head_df = pd.read_csv(dataset_path, nrows=2, encoding="utf-8")
            if "Predicted_Sentiment" in head_df.columns:
                logger.info(f"Dataset {filename} is already analyzed. Reading full dataset.")
                full_df = pd.read_csv(dataset_path, encoding="utf-8")
                _DATAFRAME_CACHE[filename] = full_df
                return full_df
        except Exception as e:
            logger.warning(f"Could not inspect headers of {dataset_path}: {e}")

        # 3. Check for pre-existing disk cache in uploads
        cache_filename = f"analyzed_{filename}"
        cache_path = os.path.join(config.UPLOAD_FOLDER, cache_filename)
        if os.path.exists(cache_path):
            try:
                logger.info(f"Loading analyzed cache from {cache_path}")
                cached_df = pd.read_csv(cache_path, encoding="utf-8")
                _DATAFRAME_CACHE[filename] = cached_df
                return cached_df
            except Exception as e:
                logger.warning(f"Failed to read disk cache {cache_path}: {e}")

        # 4. Perform analysis
        logger.info(f"Performing batch analysis on {dataset_path}...")
        analyzed_df = analyze_csv(dataset_path)

        # Cache on disk
        try:
            analyzed_df.to_csv(cache_path, index=False, encoding="utf-8")
            logger.info(f"Saved analyzed cache to {cache_path}")
        except Exception as e:
            logger.warning(f"Could not write cache to {cache_path}: {e}")

        _DATAFRAME_CACHE[filename] = analyzed_df
        return analyzed_df

    @classmethod
    def get_performance_data(
        cls,
        dataset_name: Optional[str] = None,
        category: str = "All",
        sentiment: str = "All",
        search: str = "",
        min_reviews: int = DEFAULT_MIN_REVIEWS,
        risk_threshold: float = DEFAULT_RISK_THRESHOLD
    ) -> Dict[str, Any]:
        """Returns the full performance payload for the specified dataset and filters."""
        dataset_path = cls.resolve_dataset_path(dataset_name)
        if not dataset_path or not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Requested dataset '{dataset_name}' not found on server.")

        active_filename = os.path.basename(dataset_path)
        analyzed_df = cls.load_analyzed_dataframe(dataset_path)

        results = aggregate_product_performance(
            df=analyzed_df,
            min_reviews=min_reviews,
            risk_threshold=risk_threshold,
            category=category,
            sentiment=sentiment,
            search=search
        )

        results["active_dataset"] = {
            "filename": active_filename,
            "total_rows_in_file": len(analyzed_df),
            "available_datasets": [d["filename"] for d in cls.get_available_datasets()]
        }

        # Include raw review rows for client-side drilldown table
        display_cols = [c for c in [
            "Product_Name", "Category", "Review_Text",
            "Predicted_Sentiment", "Detected_Issues", "Positive_Features"
        ] if c in analyzed_df.columns]
        results["review_data"] = analyzed_df[display_cols].fillna("").to_dict(orient="records")

        return results
