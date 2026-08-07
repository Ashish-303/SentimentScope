"""Pairwise Statistical Validation Engine.

Performs Wilcoxon Signed-Rank Tests across all candidate classifiers using
cross-validation fold scores, and McNemar Tests on predictions of the top-2 models.
Exports standardized reports and datasets for academic peer review.
"""

import os
import sys
import json
import csv
import time
import logging
import argparse
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from scipy.stats import wilcoxon, binom

def compute_mcnemar(table: List[List[int]]) -> Tuple[float, float]:
    """Calculates McNemar Chi-Square and exact Binomial p-value.

    If discordant cells (b + c) < 25, uses exact binomial distribution.
    Otherwise uses standard Chi-Square test with continuity correction.
    """
    b = table[0][1]
    c = table[1][0]
    total_discordant = b + c
    
    if total_discordant == 0:
        return 0.0, 1.0
        
    # Standard Chi-Square statistic with continuity correction
    chi2_stat = float(((abs(b - c) - 1.0) ** 2) / total_discordant)
    
    # Exact binomial p-value
    # Null hypothesis: prob of being correct by either model is equal (p=0.5)
    k = min(b, c)
    p_value = float(2.0 * binom.cdf(k, total_discordant, 0.5))
    p_value = min(p_value, 1.0)
    
    return chi2_stat, p_value

# Ensure backend and ML source directories are in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC not in sys.path:
    sys.path.insert(0, ML_SRC)

ML_TRAINING = os.path.join(BACKEND_DIR, "ml", "training")
if ML_TRAINING not in sys.path:
    sys.path.insert(0, ML_TRAINING)

import config
from cross_validation import load_dataset_for_training
from pipeline_builder import build_sentiment_pipeline
from compare_models import get_classifier_suite
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# Initialize Logger
logger = logging.getLogger("SentimentScope.StatisticalTests")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def load_best_parameters() -> Dict[str, Dict[str, Any]]:
    """Loads optimal parameters compiled in the tuning phase."""
    params_path = os.path.join(config.REPORT_DIR, "metrics", "best_parameters.json")
    if not os.path.exists(params_path):
        raise FileNotFoundError(f"Tuned parameters file not found at: {params_path}")
    with open(params_path, "r", encoding="utf-8") as f:
        return json.load(f)


def collect_fold_scores(
    X_train: pd.Series,
    y_train: pd.Series,
    best_params: Dict[str, Dict[str, Any]],
    n_splits: int = 5
) -> Dict[str, List[float]]:
    """Runs Stratified CV to compile raw fold-by-fold Macro F1 scores for all classifiers.

    Args:
        X_train: Training features.
        y_train: Training labels.
        best_params: Nested dictionary of winning parameters.
        n_splits: Number of CV splits.

    Returns:
        Dictionary mapping classifier name to its list of fold F1 scores.
    """
    logger.info("Collecting fold-by-fold cross-validation scores...")
    classifiers = get_classifier_suite()
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=config.RANDOM_STATE)
    
    cv_scores = {}
    
    # Align model keys to match get_classifier_suite outputs
    # best_parameters.json uses:
    # "Multinomial Naive Bayes", "Logistic Regression", "Linear SVC", "SGD Classifier", "Random Forest"
    for name, clf in classifiers.items():
        logger.info(f"Computing fold scores for: {name}")
        
        # Load best params (handling name mapping)
        param_key = name
        if name == "Linear SVC":
            param_key = "Linear SVC"
        elif "SGD Classifier" in name:
            param_key = "SGD Classifier"
            
        clf_params = best_params.get(param_key, {})
        pipeline = build_sentiment_pipeline(clf)
        
        # Set parameters on the pipeline
        if clf_params:
            try:
                pipeline.set_params(**clf_params)
            except Exception as e:
                logger.warning(f"Could not apply all params for {name}: {e}")

        fold_f1s = []
        for fold, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train), start=1):
            X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
            
            pipeline.fit(X_tr, y_tr)
            y_pred = pipeline.predict(X_val)
            _, _, f1, _ = precision_recall_fscore_support(y_val, y_pred, average="macro")
            fold_f1s.append(f1)
            
        cv_scores[name] = fold_f1s
        logger.info(f"{name} Fold Scores: {fold_f1s}")
        
    return cv_scores


def run_pairwise_wilcoxon(cv_scores: Dict[str, List[float]]) -> List[Dict[str, Any]]:
    """Calculates pairwise Wilcoxon Signed-Rank Tests between all models.

    Args:
        cv_scores: Dictionary of model fold F1 scores.

    Returns:
        List of dictionaries with comparison results.
    """
    logger.info("Executing pairwise Wilcoxon Signed-Rank tests...")
    names = list(cv_scores.keys())
    results = []
    
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            name1 = names[i]
            name2 = names[j]
            scores1 = np.array(cv_scores[name1])
            scores2 = np.array(cv_scores[name2])
            
            diff = scores1 - scores2
            if np.all(diff == 0):
                stat, pval = 0.0, 1.0
            else:
                try:
                    stat, pval = wilcoxon(scores1, scores2)
                except Exception as e:
                    logger.warning(f"Wilcoxon error between {name1} and {name2}: {e}. Defaulting to p=1.0")
                    stat, pval = 0.0, 1.0
            
            significant = bool(pval < 0.05)
            results.append({
                "model_A": name1,
                "model_B": name2,
                "statistic": float(stat),
                "p_value": float(pval),
                "significant": significant,
                "decision": "Reject Null (Significant)" if significant else "Fail to Reject Null (Insignificant)"
            })
            logger.info(f"Wilcoxon: {name1} vs {name2} -> p-value={pval:.4f} (significant={significant})")
            
    return results


def run_mcnemar_test(
    pipeline1: Any,
    pipeline2: Any,
    X_train: pd.Series,
    y_train: pd.Series,
    X_test: pd.Series,
    y_test: pd.Series
) -> Tuple[List[List[int]], Dict[str, Any]]:
    """Constructs 2x2 contingency table and runs McNemar exact test on predictions.

    Args:
        pipeline1: First model pipeline.
        pipeline2: Second model pipeline.
        X_train: Train features.
        y_train: Train labels.
        X_test: Test features.
        y_test: Test labels.

    Returns:
        A tuple of (contingency_table, test_results).
    """
    logger.info("Executing McNemar exact statistical significance test...")
    
    # Train both pipelines on full training split
    pipeline1.fit(X_train, y_train)
    pipeline2.fit(X_train, y_train)
    
    # Predict on isolated test set
    y_pred1 = pipeline1.predict(X_test)
    y_pred2 = pipeline2.predict(X_test)
    
    # Compute contingency table
    # a: both correct, b: p1 correct p2 incorrect
    # c: p1 incorrect p2 correct, d: both incorrect
    a = int(np.sum((y_pred1 == y_test) & (y_pred2 == y_test)))
    b = int(np.sum((y_pred1 == y_test) & (y_pred2 != y_test)))
    c = int(np.sum((y_pred1 != y_test) & (y_pred2 == y_test)))
    d = int(np.sum((y_pred1 != y_test) & (y_pred2 != y_test)))
    
    table = [[a, b], [c, d]]
    logger.info(f"Contingency Table: a={a}, b={b}, c={c}, d={d}")
    
    chi2_stat, p_val = compute_mcnemar(table)
    significant = bool(p_val < 0.05)
    
    mcnemar_res = {
        "contingency_table": table,
        "statistic": chi2_stat,
        "p_value": p_val,
        "significant": significant,
        "decision": "Reject Null (Significant Difference)" if significant else "Fail to Reject Null (No Significant Difference)"
    }
    
    logger.info(f"McNemar complete: statistic={chi2_stat}, p-value={p_val:.4f}")
    return table, mcnemar_res


def main(quick_mode: bool = False) -> None:
    """Executes the statistical validation pipeline."""
    logger.info("Starting scientific validation and statistical testing sweeps...")
    
    # Ensure output folders exist
    stat_dir = os.path.join(config.REPORT_DIR, "statistical_tests")
    tables_dir = os.path.join(config.REPORT_DIR, "tables")
    os.makedirs(stat_dir, exist_ok=True)
    os.makedirs(tables_dir, exist_ok=True)
    
    # Load dataset
    X, y = load_dataset_for_training(config.BALANCED_DATA_PATH)
    if quick_mode:
        X = X.head(1000)
        y = y.head(1000)
        n_splits = 3
    else:
        n_splits = 5
        
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.20, 
        random_state=config.RANDOM_STATE, 
        stratify=y
    )
    
    # Load best hyperparameters
    best_params = load_best_parameters()
    
    # 1. Wilcoxon Signed-Rank Test
    cv_scores = collect_fold_scores(X_train, y_train, best_params, n_splits=n_splits)
    wilcoxon_results = run_pairwise_wilcoxon(cv_scores)
    
    # Export Wilcoxon JSON and CSV
    wilcoxon_json_path = os.path.join(stat_dir, "wilcoxon_results.json")
    with open(wilcoxon_json_path, "w", encoding="utf-8") as f:
        json.dump(wilcoxon_results, f, indent=4, ensure_ascii=False)
        
    wilcoxon_csv_path = os.path.join(tables_dir, "wilcoxon_results.csv")
    df_wilcoxon = pd.DataFrame(wilcoxon_results)
    df_wilcoxon.to_csv(wilcoxon_csv_path, index=False)
    
    # 2. McNemar Test on top 2 models
    # Pick top 2 models based on F1-score from tuned_results.json
    tuned_results_path = os.path.join(config.REPORT_DIR, "metrics", "tuned_results.json")
    if not os.path.exists(tuned_results_path):
        raise FileNotFoundError(f"Tuned results not found at: {tuned_results_path}")
        
    with open(tuned_results_path, "r", encoding="utf-8") as f:
        tuned_results = json.load(f)
        
    sorted_tuned = sorted(tuned_results, key=lambda x: x["Tuned Macro F1"], reverse=True)
    top1_name = sorted_tuned[0]["Classifier"]
    top2_name = sorted_tuned[1]["Classifier"]
    
    logger.info(f"Top 2 Tuned Classifiers identified: 1. {top1_name}, 2. {top2_name}")
    
    classifiers = get_classifier_suite()
    
    # Handle name mapping for instantiating pipelines
    def get_pipeline_for_tuning_name(t_name: str) -> Any:
        # Match names
        if t_name == "Multinomial Naive Bayes":
            clf_obj = classifiers["Multinomial Naive Bayes"]
        elif t_name == "Logistic Regression":
            clf_obj = classifiers["Logistic Regression"]
        elif t_name == "Linear SVC":
            clf_obj = classifiers["Linear SVC"]
        elif t_name == "SGD Classifier":
            # Default to Hinge in comparison
            clf_obj = classifiers["SGD Classifier (Hinge)"]
        elif t_name == "Random Forest":
            clf_obj = classifiers["Random Forest"]
        else:
            raise ValueError(f"Unknown classifier name: {t_name}")
            
        p = build_sentiment_pipeline(clf_obj)
        params = best_params.get(t_name, {})
        if params:
            p.set_params(**params)
        return p

    pipeline1 = get_pipeline_for_tuning_name(top1_name)
    pipeline2 = get_pipeline_for_tuning_name(top2_name)
    
    table, mcnemar_results = run_mcnemar_test(
        pipeline1, pipeline2, 
        X_train, y_train, 
        X_test, y_test
    )
    
    mcnemar_results["model_A"] = top1_name
    mcnemar_results["model_B"] = top2_name
    
    # Export McNemar JSON and CSV
    mcnemar_json_path = os.path.join(stat_dir, "mcnemar_results.json")
    with open(mcnemar_json_path, "w", encoding="utf-8") as f:
        json.dump(mcnemar_results, f, indent=4, ensure_ascii=False)
        
    mcnemar_csv_path = os.path.join(tables_dir, "mcnemar_results.csv")
    df_mcnemar = pd.DataFrame([{
        "model_A": top1_name,
        "model_B": top2_name,
        "statistic": mcnemar_results["statistic"],
        "p_value": mcnemar_results["p_value"],
        "significant": mcnemar_results["significant"],
        "decision": mcnemar_results["decision"]
    }])
    df_mcnemar.to_csv(mcnemar_csv_path, index=False)
    
    # Save raw CV fold scores mapping for plotting scripts
    cv_scores_json_path = os.path.join(stat_dir, "cv_fold_scores.json")
    with open(cv_scores_json_path, "w", encoding="utf-8") as f:
        json.dump(cv_scores, f, indent=4, ensure_ascii=False)

    logger.info("Statistical tests execution and exporting complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SentimentScope Pairwise Statistical Validation Engine")
    parser.add_argument("--quick", action="store_true", help="Run in quick mode on 1000 sample reviews")
    args = parser.parse_args()
    main(quick_mode=args.quick)
