"""Classifier Benchmarking and Comparison Suite.

Runs all shortlisted classical estimators under identical preprocessing, TF-IDF
vectorization, feature selection, and data splits to output baseline comparative
tables and visualization plots for academic publications.
"""

import os
import sys
import json
import argparse
import logging
import time
from datetime import datetime, timezone
import pandas as pd
from typing import List, Dict, Any

# Ensure backend and ML source directories are in sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC not in sys.path:
    sys.path.insert(0, ML_SRC)

import config
from cross_validation import load_dataset_for_training, evaluate_pipeline_cv
from pipeline_builder import build_sentiment_pipeline

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.linear_model import SGDClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

# Initialize Logger
logger = logging.getLogger("SentimentScope.CompareModels")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def get_classifier_suite() -> Dict[str, Any]:
    """Returns the dictionary of initialized candidate ML classifiers."""
    suite = {
        "Multinomial Naive Bayes": MultinomialNB(),
        "Logistic Regression": LogisticRegression(
            C=1.0, 
            solver="lbfgs", 
            max_iter=1000, 
            random_state=config.FEATURE_RANDOM_STATE
        ),
        "Linear SVC": LinearSVC(
            C=1.0, 
            loss="squared_hinge", 
            dual="auto", 
            max_iter=2000, 
            random_state=config.FEATURE_RANDOM_STATE
        ),
        "SGD Classifier (Hinge)": SGDClassifier(
            loss="hinge", 
            random_state=config.FEATURE_RANDOM_STATE
        ),
        "SGD Classifier (Log Loss)": SGDClassifier(
            loss="log_loss", 
            random_state=config.FEATURE_RANDOM_STATE
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100, 
            n_jobs=-1, 
            random_state=config.FEATURE_RANDOM_STATE
        )
    }
    return suite


def plot_confusion_matrix(cm: List[List[int]], classes: List[str], classifier_name: str, output_dir: str) -> None:
    """Plots and exports a publication-quality confusion matrix heatmap."""
    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm, 
        annot=True, 
        fmt='d', 
        cmap='Blues', 
        xticklabels=classes, 
        yticklabels=classes,
        annot_kws={"size": 10}
    )
    plt.title(f"Confusion Matrix: {classifier_name}", fontsize=12, fontweight='bold', pad=15)
    plt.ylabel("Actual Sentiment", fontsize=10)
    plt.xlabel("Predicted Sentiment", fontsize=10)
    plt.tight_layout()
    
    file_name = f"confusion_matrix_{classifier_name.lower().replace(' ', '_').replace('(', '').replace(')', '')}.png"
    plot_path = os.path.join(output_dir, file_name)
    plt.savefig(plot_path, dpi=300)
    plt.close()
    logger.info(f"Saved confusion matrix plot: {plot_path}")


def plot_comparative_metrics(df_results: pd.DataFrame, output_dir: str) -> None:
    """Generates and exports comparative model metrics bar charts."""
    metrics = {
        "Accuracy": "Accuracy Score",
        "Macro F1": "Macro F1-Score",
        "Training Time (s)": "Training Time (seconds)",
        "Prediction Latency (ms/review)": "Prediction Latency (ms/review)"
    }
    
    # Sort for visual alignment matching best Macro F1
    df_sorted = df_results.sort_values(by="Macro F1", ascending=False)
    
    for col, label in metrics.items():
        plt.figure(figsize=(8, 5))
        sns.barplot(data=df_sorted, x=col, y="Classifier", palette="viridis", hue="Classifier", legend=False)
        plt.title(f"Model Comparison - {label}", fontsize=12, fontweight='bold', pad=15)
        plt.xlabel(label, fontsize=10)
        plt.ylabel("Classifier", fontsize=10)
        plt.tight_layout()
        
        file_name = f"comparison_{col.lower().split(' ')[0].replace('(', '')}.png"
        plot_path = os.path.join(output_dir, file_name)
        plt.savefig(plot_path, dpi=300)
        plt.close()
        logger.info(f"Saved comparative metrics plot: {plot_path}")


def run_benchmark(quick_mode: bool = False) -> pd.DataFrame:
    """Executes the benchmarking runner across all classifiers.

    Args:
        quick_mode: If True, uses a small subsample of the dataset for validation.

    Returns:
        Pandas DataFrame containing aggregated benchmark metrics.
    """
    logger.info("Starting SentimentScope benchmarking framework...")
    
    # Create output directories
    plots_dir = os.path.join(config.REPORT_DIR, "plots")
    metrics_dir = os.path.join(config.REPORT_DIR, "metrics")
    tables_dir = os.path.join(config.REPORT_DIR, "tables")
    
    os.makedirs(plots_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    os.makedirs(tables_dir, exist_ok=True)
    
    # 1. Load dataset
    dataset_path = config.BALANCED_DATA_PATH
    X, y = load_dataset_for_training(dataset_path)

    raw_dataset_size = len(X)
    if quick_mode:
        logger.info("Quick Mode active. Subsampling first 1000 reviews for evaluation.")
        X = X.head(1000)
        y = y.head(1000)

    # 2. Stratified train/test split (80/20)
    logger.info("Executing stratified train/test split...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=0.20, 
        random_state=config.RANDOM_STATE, 
        stratify=y
    )
    
    classes_list = sorted(list(y.unique()))
    num_classes = len(classes_list)
    class_dist = y.value_counts(normalize=True).to_dict()

    # 3. Instantiate classifiers
    classifiers = get_classifier_suite()
    results = []

    # 4. Benchmark loop
    for name, clf in classifiers.items():
        logger.info(f"====== Benchmarking Classifier: {name} ======")
        
        # Build unified pipeline
        pipeline = build_sentiment_pipeline(clf)
        
        # Run 5-Fold Cross Validation on the training set
        logger.info(f"Evaluating {name} with Stratified 5-Fold CV on training split...")
        cv_summary = evaluate_pipeline_cv(pipeline, X_train, y_train, n_splits=5)
        
        # Train on full train split
        logger.info(f"Training final {name} model on complete training split...")
        start_fit = time.time()
        pipeline.fit(X_train, y_train)
        fit_time = time.time() - start_fit
        
        # Predict on isolated test split
        logger.info(f"Testing {name} on isolated test split...")
        start_pred = time.time()
        y_pred = pipeline.predict(X_test)
        pred_time = time.time() - start_pred
        
        # Calculate test performance
        acc = accuracy_score(y_test, y_pred)
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
        
        # Generate Confusion Matrix
        cm = confusion_matrix(y_test, y_pred).tolist()
        plot_confusion_matrix(cm, classes_list, name, plots_dir)
        
        report = classification_report(y_test, y_pred, output_dict=True)
        
        # Latency calculation: time per review in milliseconds
        latency_ms = (pred_time / len(X_test)) * 1000
        
        results.append({
            "Classifier": name,
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "Macro F1": f1,
            "Mean CV Score (F1)": cv_summary["mean_f1"],
            "Std CV Score (F1)": cv_summary["std_f1"],
            "Training Time (s)": fit_time,
            "Prediction Latency (ms/review)": latency_ms,
            "Confusion Matrix": cm,
            "Classification Report": report
        })

    # 5. Compile & Sort results by Macro F1 descending
    df_results = pd.DataFrame(results)
    df_results = df_results.sort_values(by="Macro F1", ascending=False).reset_index(drop=True)
    
    # 6. Generate Comparative Bar Charts
    plot_comparative_metrics(df_results, plots_dir)
    
    # 7. Export Benchmark Summaries
    reports_json_path = os.path.join(metrics_dir, "benchmark_results.json")
    reports_csv_path = os.path.join(tables_dir, "benchmark_summary.csv")
    
    with open(reports_json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
        
    df_results.drop(columns=["Confusion Matrix", "Classification Report"]).to_csv(reports_csv_path, index=False)
    
    # 8. Export Metadata Report
    metadata_json_path = os.path.join(metrics_dir, "benchmark_metadata.json")
    metadata = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dataset_statistics": {
            "total_raw_records": raw_dataset_size,
            "total_evaluated_records": len(X),
            "number_of_classes": num_classes,
            "class_labels": classes_list,
            "class_distribution": class_dist
        },
        "pipeline_version": "1.3",
        "random_seed": config.RANDOM_STATE,
        "feature_engineering_configurations": {
            "tfidf_max_features": config.TFIDF_MAX_FEATURES,
            "tfidf_ngram_range": config.TFIDF_NGRAM_RANGE,
            "tfidf_min_df": config.TFIDF_MIN_DF,
            "tfidf_max_df": config.TFIDF_MAX_DF,
            "tfidf_sublinear_tf": config.TFIDF_SUBLINEAR_TF,
            "tfidf_use_idf": config.TFIDF_USE_IDF,
            "tfidf_smooth_idf": config.TFIDF_SMOOTH_IDF,
            "tfidf_norm": config.TFIDF_NORM,
            "chi2_enabled": config.CHI2_ENABLED,
            "chi2_features_k": config.CHI2_FEATURES_K
        }
    }
    with open(metadata_json_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4, ensure_ascii=False)
        
    logger.info(f"Saved benchmark JSON report: {reports_json_path}")
    logger.info(f"Saved benchmark CSV summary: {reports_csv_path}")
    logger.info(f"Saved benchmark metadata report: {metadata_json_path}")
    
    return df_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SentimentScope Model Benchmarking Suite")
    parser.add_argument("--quick", action="store_true", help="Run in quick mode on 1000 sample reviews")
    args = parser.parse_args()

    # Reconfigure stdout to support unicode prints
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    results_df = run_benchmark(quick_mode=args.quick)
    
    print("\n" + "=" * 80)
    print("                      BENCHMARKING RESULTS COMPARATIVE SUMMARY")
    print("=" * 80)
    print(results_df.drop(columns=["Confusion Matrix", "Classification Report"]).to_string(index=False))
    print("=" * 80)
