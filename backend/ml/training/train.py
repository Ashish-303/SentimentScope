"""Model Training Pipeline for SentimentScope.

Provides a reusable training runner that loads clean datasets, constructs
pipelines, and serializes final model binaries after hyperparameter sweeps.
"""

import os
import sys
import time
import logging
import argparse
import joblib
import json
from typing import Any, Dict

# Ensure backend and ML source directories are in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC not in sys.path:
    sys.path.insert(0, ML_SRC)

import config
from cross_validation import load_dataset_for_training
from pipeline_builder import build_sentiment_pipeline
from sklearn.linear_model import LogisticRegression

# Initialize Logger
logger = logging.getLogger("SentimentScope.Train")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def train_final_model(
    dataset_path: str = config.BALANCED_DATA_PATH,
    output_model_path: str = config.MODEL_PATH,
    classifier: Any = None
) -> Dict[str, Any]:
    """Fits the unified sentiment pipeline on the complete training set and serializes it.

    NOTE: In publication-grade workflows, this runner is deferred and executed
    strictly after hyperparameter optimization sweeps are complete to prevent
    leakage and configuration inconsistencies.

    Args:
        dataset_path: Absolute filepath to the source balanced reviews CSV.
        output_model_path: Target path to save the serialized sklearn Pipeline.
        classifier: Instantiated classifier. If None, defaults to baseline LogisticRegression.

    Returns:
        A dictionary containing training duration and overall fit statistics.
    """
    logger.info("Initializing SentimentScope final production model training...")
    
    # 1. Load and clean dataset
    X, y = load_dataset_for_training(dataset_path)
    
    # 2. Build Pipeline
    if classifier is None:
        summary_path = os.path.join(config.REPORT_DIR, "metrics", "research_summary.json")
        params_path = os.path.join(config.REPORT_DIR, "metrics", "best_parameters.json")
        
        if os.path.exists(summary_path) and os.path.exists(params_path):
            try:
                with open(summary_path, "r", encoding="utf-8") as f:
                    summary = json.load(f)
                with open(params_path, "r", encoding="utf-8") as f:
                    best_params = json.load(f)
                
                winning_name = summary.get("winning_model")
                logger.info(f"Resolved winning model dynamically from reports: {winning_name}")
                
                if winning_name == "Random Forest":
                    from sklearn.ensemble import RandomForestClassifier
                    clf_class = RandomForestClassifier
                elif winning_name == "Logistic Regression":
                    from sklearn.linear_model import LogisticRegression
                    clf_class = LogisticRegression
                elif winning_name == "Linear SVC":
                    from sklearn.svm import LinearSVC
                    clf_class = LinearSVC
                elif winning_name == "SGD Classifier":
                    from sklearn.linear_model import SGDClassifier
                    clf_class = SGDClassifier
                elif winning_name == "Multinomial Naive Bayes":
                    from sklearn.naive_bayes import MultinomialNB
                    clf_class = MultinomialNB
                else:
                    raise ValueError(f"Unknown winning classifier: {winning_name}")
                
                clf_params_raw = best_params.get(winning_name, {})
                clf_params = {}
                for k, v in clf_params_raw.items():
                    if k.startswith("classifier__"):
                        clf_params[k.replace("classifier__", "")] = v
                    else:
                        clf_params[k] = v
                
                # Inject random state and defaults if missing
                if "random_state" not in clf_params and winning_name in ["Logistic Regression", "Linear SVC", "SGD Classifier", "Random Forest"]:
                    clf_params["random_state"] = config.FEATURE_RANDOM_STATE
                if "n_jobs" not in clf_params and winning_name == "Random Forest":
                    clf_params["n_jobs"] = -1
                if "max_iter" not in clf_params and winning_name in ["Logistic Regression", "Linear SVC"]:
                    clf_params["max_iter"] = 1000
                
                logger.info(f"Instantiating winning model with parameters: {clf_params}")
                classifier = clf_class(**clf_params)
                
            except Exception as e:
                logger.warning(f"Failed to load winning model dynamically: {e}. Falling back to baseline Logistic Regression.")
                classifier = None
        else:
            logger.info("Research summary or parameters files not found. Falling back to baseline Logistic Regression.")
            
        if classifier is None:
            from sklearn.linear_model import LogisticRegression
            classifier = LogisticRegression(
                C=1.0, 
                solver="lbfgs", 
                max_iter=1000, 
                random_state=config.FEATURE_RANDOM_STATE
            )
    
    logger.info(f"Assembling unified pipeline using: {classifier.__class__.__name__}")
    pipeline = build_sentiment_pipeline(classifier)
    
    # 3. Fit Pipeline on entire dataset
    logger.info("Fitting unified pipeline on complete training partitions...")
    start_time = time.time()
    pipeline.fit(X, y)
    duration = time.time() - start_time
    logger.info(f"Model fit completed in {duration:.2f} seconds.")
    
    # 4. Serialize to disk
    logger.info(f"Serializing unified pipeline binary to: {output_model_path}")
    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    joblib.dump(pipeline, output_model_path)
    logger.info("Pipeline serialization complete.")
    
    stats = {
        "training_duration_seconds": duration,
        "model_file_size_bytes": os.path.getsize(output_model_path),
        "total_training_records": len(X),
        "classifier_name": classifier.__class__.__name__
    }
    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SentimentScope Model Training Pipeline")
    parser.add_argument("--dataset", type=str, default=config.BALANCED_DATA_PATH, help="Path to input CSV dataset")
    parser.add_argument("--output", type=str, default=config.MODEL_PATH, help="Output path for the serialized pipeline")
    args = parser.parse_args()

    # Reconfigure stdout to support unicode prints
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    try:
        metrics = train_final_model(args.dataset, args.output)
        print("\n" + "=" * 60)
        print("                      TRAINING PIPELINE SUCCESS")
        print("=" * 60)
        for k, v in metrics.items():
            print(f"  {k}: {v}")
        print("=" * 60)
    except Exception as e:
        logger.exception(f"Training pipeline execution failed: {e}")
        sys.exit(1)
