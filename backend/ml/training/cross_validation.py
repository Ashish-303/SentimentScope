"""Leakage-Free Cross-Validation Runner.

Executes Stratified 5-Fold Cross-Validation, ensuring that vectorizers, feature
selectors, and estimators are fit strictly on training folds and evaluated on isolated
validation partitions to guarantee statistical validity.
"""

import os
import sys
import time
import logging
import pandas as pd
import numpy as np
from typing import Any, Dict, List, Tuple

# Ensure backend and ML source directories are in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC not in sys.path:
    sys.path.insert(0, ML_SRC)

import config
from validators import validate_columns
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# Initialize Logger
logger = logging.getLogger("SentimentScope.CrossValidation")


def load_dataset_for_training(dataset_path: str) -> Tuple[pd.Series, pd.Series]:
    """Loads, validates, and cleans the reviews dataset for training runs.

    Args:
        dataset_path: Absolute path to the source CSV file.

    Returns:
        A tuple of (X_features, y_labels) as pandas Series.

    Raises:
        FileNotFoundError: If the CSV file is missing.
        ValueError: If required columns cannot be identified.
    """
    logger.info(f"Loading dataset from: {dataset_path}")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found at: {dataset_path}")

    df = pd.read_csv(dataset_path, encoding=config.DEFAULT_ENCODING)
    original_shape = df.shape

    # Re-use existing validators to map text and label columns
    (product_col, text_col, category_col, rating_col) = validate_columns(df)
    
    # We also require a target label column or we infer it
    label_col = None
    for col in ["sentiment", "Sentiment", "class", "label"]:
        if col in df.columns:
            label_col = col
            break

    if not label_col:
        raise ValueError("CSV dataset must contain a target sentiment/label column.")

    # Drop rows missing text or class labels
    df = df.dropna(subset=[text_col, label_col])
    
    # Drop duplicates to prevent synthetic leakage
    df = df.drop_duplicates(subset=[text_col])
    logger.info(f"Loaded dataset: original_shape={original_shape}, final_shape={df.shape}")

    # Shuffle using central RANDOM_STATE for reproducibility
    df = df.sample(frac=1.0, random_state=config.RANDOM_STATE).reset_index(drop=True)

    X = df[text_col]
    y = df[label_col]

    # Report class distribution statistics
    class_dist = y.value_counts(normalize=True).to_dict()
    logger.info(f"Target class distributions: {class_dist}")

    return X, y


def evaluate_pipeline_cv(
    pipeline: Any,
    X: pd.Series,
    y: pd.Series,
    n_splits: int = 5,
    random_state: int = config.RANDOM_STATE
) -> Dict[str, Any]:
    """Runs Stratified K-Fold cross-validation on the pipeline.

    Args:
        pipeline: Target Scikit-learn Pipeline.
        X: Raw or cleaned text series.
        y: Ground truth sentiment labels.
        n_splits: Number of CV folds.
        random_state: Random state for splitting reproducibility.

    Returns:
        A dictionary mapping evaluation metric keys to mean and std scores.
    """
    logger.info(f"Initiating Stratified {n_splits}-Fold CV (shuffle=True, random_state={random_state})...")
    
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    
    fold_accuracies: List[float] = []
    fold_precisions: List[float] = []
    fold_recalls: List[float] = []
    fold_f1s: List[float] = []
    
    train_times: List[float] = []
    pred_times: List[float] = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), start=1):
        logger.info(f"Processing CV Fold {fold}/{n_splits}...")
        
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        # Reset pipeline to prevent fit memory contamination between folds
        # Scikit-learn pipeline clone is implicitly done by calling fit
        
        # Fit vectorizer, Chi-Square, and classifier strictly on training fold (prevent data leakage)
        start_train = time.time()
        pipeline.fit(X_train, y_train)
        train_duration = time.time() - start_train
        train_times.append(train_duration)

        # Predict on validation fold
        start_pred = time.time()
        y_pred = pipeline.predict(X_val)
        pred_duration = time.time() - start_pred
        pred_times.append(pred_duration)

        # Calculate metrics for the fold
        acc = accuracy_score(y_val, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(y_val, y_pred, average="macro")

        fold_accuracies.append(acc)
        fold_precisions.append(prec)
        fold_recalls.append(rec)
        fold_f1s.append(f1)
        
        logger.info(f"Fold {fold} complete: F1-Macro={f1:.4f}, TrainTime={train_duration:.2f}s, PredTime={pred_duration:.2f}s")

    # Aggregate metric summary
    metrics_summary = {
        "mean_accuracy": float(np.mean(fold_accuracies)),
        "std_accuracy": float(np.std(fold_accuracies)),
        "mean_precision": float(np.mean(fold_precisions)),
        "std_precision": float(np.std(fold_precisions)),
        "mean_recall": float(np.mean(fold_recalls)),
        "std_recall": float(np.std(fold_recalls)),
        "mean_f1": float(np.mean(fold_f1s)),
        "std_f1": float(np.std(fold_f1s)),
        "mean_train_time": float(np.mean(train_times)),
        "mean_pred_time": float(np.mean(pred_times))
    }

    logger.info(
        f"CV Complete. Aggregates: Mean F1-Macro={metrics_summary['mean_f1']:.4f} ± {metrics_summary['std_f1']:.4f}, "
        f"Mean Train Time={metrics_summary['mean_train_time']:.2f}s"
    )
    return metrics_summary


# ==========================================
# VERIFICATION RUNNER
# ==========================================
if __name__ == "__main__":
    import config
    from pipeline_builder import build_sentiment_pipeline
    from sklearn.linear_model import LogisticRegression

    print("Executing Cross Validation Validation Run...")
    print("=" * 60)

    try:
        # Load sample balanced data
        CSV_PATH = config.BALANCED_DATA_PATH
        if os.path.exists(CSV_PATH):
            X, y = load_dataset_for_training(CSV_PATH)
            
            # Subsample for extremely fast local verification run (e.g. 500 records)
            X_sub = X.head(500)
            y_sub = y.head(500)
            
            clf = LogisticRegression(random_state=config.FEATURE_RANDOM_STATE)
            pipeline = build_sentiment_pipeline(clf)
            
            print("Running Stratified 5-Fold Cross-Validation on Subsample...")
            summary = evaluate_pipeline_cv(pipeline, X_sub, y_sub, n_splits=5)
            print("\nCross-Validation Aggregates:")
            for k, v in summary.items():
                print(f"  {k}: {v}")
            print("\nCV validation run completed successfully.")
        else:
            print(f"Baseline balanced reviews CSV not found at: {CSV_PATH}. Skipping split run.")
            
    except Exception as e:
        print(f"Exception during verification: {e}")
        sys.exit(1)
