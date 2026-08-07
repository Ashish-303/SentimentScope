"""Hyperparameter Optimization Engine.

Implements GridSearchCV and RandomizedSearchCV sweeps for baseline and ensemble
models to identify optimal regularization strengths, estimators, and depth parameters,
ensuring leakage-free cross-validation.
"""

import os
import sys
import json
import argparse
import logging
import time
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Union

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

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.linear_model import SGDClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, GridSearchCV, RandomizedSearchCV, train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# Initialize Logger
logger = logging.getLogger("SentimentScope.HyperparameterTuning")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def get_parameter_grids() -> Dict[str, Dict[str, Any]]:
    """Returns the parameter grids and search strategies for all classifiers."""
    grids = {
        "Multinomial Naive Bayes": {
            "search_type": "grid",
            "grid": {
                "classifier__alpha": [0.01, 0.1, 1.0, 10.0],
                "classifier__fit_prior": [True, False]
            }
        },
        "Logistic Regression": {
            "search_type": "grid",
            "grid": {
                "classifier__C": [0.01, 0.1, 1.0, 10.0],
                "classifier__solver": ["lbfgs", "liblinear"],
                "classifier__class_weight": [None, "balanced"]
            }
        },
        "Linear SVC": {
            "search_type": "grid",
            "grid": {
                "classifier__C": [0.01, 0.1, 1.0, 10.0],
                "classifier__dual": [True, False]
            }
        },
        "SGD Classifier": {
            "search_type": "random",
            "grid": {
                "classifier__loss": ["hinge", "log_loss"],
                "classifier__alpha": [1e-5, 1e-4, 1e-3, 1e-2],
                "classifier__penalty": ["l1", "l2", "elasticnet"],
                "classifier__learning_rate": ["optimal", "constant"]
            }
        },
        "Random Forest": {
            "search_type": "random",
            "grid": {
                "classifier__n_estimators": [50, 100, 200],
                "classifier__max_depth": [10, 20, None],
                "classifier__min_samples_split": [2, 5],
                "classifier__min_samples_leaf": [1, 2]
            }
        }
    }
    return grids


def run_parameter_search(
    pipeline: Any,
    param_grid: Dict[str, Any],
    X_train: Any,
    y_train: Any,
    cv_splitter: Any,
    use_random_search: bool = False,
    n_iter: int = 10,
    random_state: int = config.RANDOM_STATE
) -> Dict[str, Any]:
    """Performs parameter tuning using Grid or Randomized search.

    Args:
        pipeline: Target pipeline to tune.
        param_grid: Dict mapping parameter keys to values/distributions.
        X_train: Preprocessed text features.
        y_train: Target sentiment labels.
        cv_splitter: Cross-validation split generator.
        use_random_search: If True, uses RandomizedSearchCV, else GridSearchCV.
        n_iter: Number of parameter settings that are sampled (for random search).
        random_state: Random state seed.

    Returns:
        Dict containing best parameters, best score, and optimization logs.
    """
    if use_random_search:
        logger.info(f"Initializing RandomizedSearchCV with n_iter={n_iter}...")
        search = RandomizedSearchCV(
            estimator=pipeline,
            param_distributions=param_grid,
            n_iter=n_iter,
            scoring="f1_macro",
            cv=cv_splitter,
            random_state=random_state,
            n_jobs=-1,
            refit=True
        )
    else:
        logger.info("Initializing GridSearchCV...")
        search = GridSearchCV(
            estimator=pipeline,
            param_grid=param_grid,
            scoring="f1_macro",
            cv=cv_splitter,
            n_jobs=-1,
            refit=True
        )

    start_time = time.time()
    search.fit(X_train, y_train)
    search_duration = time.time() - start_time
    
    logger.info(f"Search complete in {search_duration:.2f} seconds. Winning F1-Macro: {search.best_score_:.4f}")
    
    return {
        "best_estimator": search.best_estimator_,
        "best_params": search.best_params_,
        "best_score": search.best_score_,
        "cv_results": search.cv_results_,
        "search_duration": search_duration
    }


def plot_optimization_visualizations(df_comp: pd.DataFrame, output_dir: str) -> None:
    """Generates comparative baseline vs tuned visualization bar charts."""
    # 1. Macro F1 comparison
    plt.figure(figsize=(10, 6))
    df_melted_f1 = pd.melt(
        df_comp, 
        id_vars=["Classifier"], 
        value_vars=["Baseline Macro F1", "Tuned Macro F1"],
        var_name="Evaluation", 
        value_name="Macro F1"
    )
    sns.barplot(data=df_melted_f1, x="Macro F1", y="Classifier", hue="Evaluation", palette="muted")
    plt.title("Performance Comparison: Baseline vs Tuned (Macro F1)", fontsize=12, fontweight='bold', pad=15)
    plt.xlabel("Macro F1-Score", fontsize=10)
    plt.ylabel("Classifier", fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "comparison_f1_baseline_vs_tuned.png"), dpi=300)
    plt.close()

    # 2. Performance Gain
    plt.figure(figsize=(10, 6))
    sns.barplot(data=df_comp, x="F1 Improvement", y="Classifier", palette="viridis", hue="Classifier", legend=False)
    plt.title("Macro F1-Score Improvement (Performance Gain)", fontsize=12, fontweight='bold', pad=15)
    plt.xlabel("Macro F1 Improvement Delta", fontsize=10)
    plt.ylabel("Classifier", fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "performance_gain_chart.png"), dpi=300)
    plt.close()

    # 3. Training Time Comparison
    plt.figure(figsize=(10, 6))
    df_melted_time = pd.melt(
        df_comp, 
        id_vars=["Classifier"], 
        value_vars=["Baseline Fit Time (s)", "Tuned Fit Time (s)"],
        var_name="Evaluation", 
        value_name="Training Time (s)"
    )
    sns.barplot(data=df_melted_time, x="Training Time (s)", y="Classifier", hue="Evaluation", palette="coolwarm")
    plt.title("Computational Complexity: Baseline vs Tuned Fit Time", fontsize=12, fontweight='bold', pad=15)
    plt.xlabel("Training Time (seconds)", fontsize=10)
    plt.ylabel("Classifier", fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "comparison_fit_time_baseline_vs_tuned.png"), dpi=300)
    plt.close()


def main(quick_mode: bool = False) -> None:
    """Executes the hyperparameter optimization sweeps."""
    logger.info("Starting hyperparameter optimization pipeline...")
    
    # 1. Load dataset
    X, y = load_dataset_for_training(config.BALANCED_DATA_PATH)
    
    if quick_mode:
        logger.info("Quick Mode active. Subsampling first 1000 reviews for parameter sweeps.")
        X = X.head(1000)
        y = y.head(1000)
        n_cv_splits = 3  # Faster CV for test runs
        random_search_iter = 3
    else:
        n_cv_splits = 5
        random_search_iter = 10

    # 2. Stratified Train/Test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.20, 
        random_state=config.RANDOM_STATE, 
        stratify=y
    )

    # Load baseline comparative results
    baseline_metrics_path = os.path.join(config.REPORT_DIR, "metrics", "benchmark_results.json")
    if not os.path.exists(baseline_metrics_path):
        logger.warning(f"Baseline results not found at: {baseline_metrics_path}. Please execute compare_models.py first.")
        sys.exit(1)
        
    with open(baseline_metrics_path, "r", encoding="utf-8") as f:
        baseline_results = json.load(f)
    
    # Map baseline results for quick lookups
    baseline_map = {r["Classifier"]: r for r in baseline_results}
    
    cv_splitter = StratifiedKFold(n_splits=n_cv_splits, shuffle=True, random_state=config.RANDOM_STATE)
    grids = get_parameter_grids()
    
    classifiers = {
        "Multinomial Naive Bayes": MultinomialNB(),
        "Logistic Regression": LogisticRegression(random_state=config.FEATURE_RANDOM_STATE, max_iter=1000),
        "Linear SVC": LinearSVC(loss="squared_hinge", dual="auto", max_iter=2000, random_state=config.FEATURE_RANDOM_STATE),
        "SGD Classifier": SGDClassifier(random_state=config.FEATURE_RANDOM_STATE),
        "Random Forest": RandomForestClassifier(random_state=config.FEATURE_RANDOM_STATE, n_jobs=-1)
    }

    best_params_out = {}
    tuned_summary = []
    metadata_runs = []

    for name, grid_info in grids.items():
        logger.info(f"====== Tuning Classifier: {name} ======")
        clf = classifiers[name]
        
        # Build baseline pipeline
        pipeline = build_sentiment_pipeline(clf)
        
        # Determine search strategy
        is_random = grid_info["search_type"] == "random"
        param_grid = grid_info["grid"]
        
        search_res = run_parameter_search(
            pipeline=pipeline,
            param_grid=param_grid,
            X_train=X_train,
            y_train=y_train,
            cv_splitter=cv_splitter,
            use_random_search=is_random,
            n_iter=random_search_iter
        )
        
        best_pipeline = search_res["best_estimator"]
        best_params = search_res["best_params"]
        best_params_out[name] = best_params
        
        # Evaluate tuned pipeline on test set
        logger.info(f"Evaluating final tuned {name} model on test partition...")
        start_fit = time.time()
        best_pipeline.fit(X_train, y_train)
        tuned_fit_time = time.time() - start_fit
        
        start_pred = time.time()
        y_pred = best_pipeline.predict(X_test)
        tuned_pred_time = time.time() - start_pred
        
        acc = accuracy_score(y_test, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
        
        # Map baseline comparisons
        # Linear SVC might match baseline name or SGD Classifier (Hinge/Log Loss) might need name mapping
        base_name = name
        if name == "SGD Classifier":
            # Map to Hinge baseline by default for comparison
            base_name = "SGD Classifier (Hinge)"
        elif name == "Linear SVC":
            base_name = "Linear SVC"
            
        base_metric = baseline_map.get(base_name, {"Macro F1": 0.0, "Training Time (s)": 0.0, "Prediction Latency (ms/review)": 0.0})
        
        improvement = f1 - base_metric["Macro F1"]
        latency_ms = (tuned_pred_time / len(X_test)) * 1000
        
        tuned_summary.append({
            "Classifier": name,
            "Baseline Macro F1": base_metric["Macro F1"],
            "Tuned Macro F1": f1,
            "F1 Improvement": improvement,
            "Baseline Fit Time (s)": base_metric["Training Time (s)"],
            "Tuned Fit Time (s)": tuned_fit_time,
            "Baseline Latency (ms)": base_metric["Prediction Latency (ms/review)"],
            "Tuned Latency (ms)": latency_ms,
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "Mean CV Score (F1)": search_res["best_score"]
        })
        
        metadata_runs.append({
            "classifier": name,
            "search_strategy": grid_info["search_type"],
            "parameter_grid": param_grid,
            "best_parameters": best_params,
            "f1_improvement": improvement
        })

    # Save reports
    reports_metrics_dir = os.path.join(config.REPORT_DIR, "metrics")
    reports_tables_dir = os.path.join(config.REPORT_DIR, "tables")
    plots_dir = os.path.join(config.REPORT_DIR, "plots")
    
    os.makedirs(reports_metrics_dir, exist_ok=True)
    os.makedirs(reports_tables_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    # 1. tuned_results.json
    with open(os.path.join(reports_metrics_dir, "tuned_results.json"), "w", encoding="utf-8") as f:
        json.dump(tuned_summary, f, indent=4, ensure_ascii=False)
        
    # 2. best_parameters.json
    with open(os.path.join(reports_metrics_dir, "best_parameters.json"), "w", encoding="utf-8") as f:
        json.dump(best_params_out, f, indent=4, ensure_ascii=False)

    # 3. hyperparameter_summary.csv
    df_comp = pd.DataFrame(tuned_summary)
    df_comp = df_comp.sort_values(by="Tuned Macro F1", ascending=False).reset_index(drop=True)
    df_comp.to_csv(os.path.join(reports_tables_dir, "hyperparameter_summary.csv"), index=False)

    # 4. hyperparameter_metadata.json
    metadata = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dataset_statistics": {
            "total_records": len(X),
            "classes": sorted(list(y.unique()))
        },
        "random_state": config.RANDOM_STATE,
        "cv_folds": n_cv_splits,
        "search_runs": metadata_runs
    }
    with open(os.path.join(reports_metrics_dir, "hyperparameter_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4, ensure_ascii=False)

    # 5. Visualizations
    plot_optimization_visualizations(df_comp, plots_dir)

    logger.info("Hyperparameter optimization reporting files compiled successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SentimentScope Model Tuning Engine")
    parser.add_argument("--quick", action="store_true", help="Run in quick mode on 1000 sample reviews")
    args = parser.parse_args()

    # Reconfigure stdout to support unicode prints
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    main(quick_mode=args.quick)
