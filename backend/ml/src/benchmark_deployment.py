"""Performance Benchmarking Script for SentimentScope.

Measures memory usage, model pipeline loading latency, single prediction latency,
batch prediction latency, and CSV processing throughput. Writes findings to JSON.
"""

import os
import sys
import time
import json
import logging
import psutil
import pandas as pd

# Ensure backend directory is in system path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

ML_SRC_DIR = os.path.join(BACKEND_DIR, "ml", "src")
if ML_SRC_DIR not in sys.path:
    sys.path.insert(0, ML_SRC_DIR)

import config
from predictor import SentimentPredictor
from csv_analyzer import analyze_csv

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SentimentScope.Benchmark")


def run_benchmark():
    logger.info("Initializing deployment performance benchmarks...")

    # Initialize diagnostic variables
    process = psutil.Process(os.getpid())
    
    # 1. Measure memory usage before loading the model
    mem_before_mb = process.memory_info().rss / (1024 * 1024)
    logger.info(f"Memory footprint before model load: {mem_before_mb:.2f} MB")

    # 2. Measure pipeline loading time
    predictor = SentimentPredictor()
    start_load_time = time.time()
    predictor.load_model()
    load_time_seconds = time.time() - start_load_time
    logger.info(f"Unified pipeline loading time: {load_time_seconds:.4f} seconds")

    # 3. Measure memory usage after loading the model
    mem_after_mb = process.memory_info().rss / (1024 * 1024)
    model_memory_overhead_mb = mem_after_mb - mem_before_mb
    logger.info(f"Memory footprint after model load: {mem_after_mb:.2f} MB (Overhead: {model_memory_overhead_mb:.2f} MB)")

    # 4. Measure single prediction latency
    sample_text = "Amazing quality, very durable, easy to use, highly recommended."
    single_iterations = 200
    single_latencies = []
    
    logger.info(f"Running single prediction benchmark ({single_iterations} iterations)...")
    for _ in range(single_iterations):
        t0 = time.time()
        predictor.predict(sample_text)
        single_latencies.append((time.time() - t0) * 1000)  # to ms
        
    avg_single_latency_ms = sum(single_latencies) / len(single_latencies)
    logger.info(f"Average single prediction latency: {avg_single_latency_ms:.4f} ms")

    # 5. Measure batch prediction latency
    batch_sizes = [10, 50, 100, 500]
    batch_benchmarks = {}
    
    for size in batch_sizes:
        batch_text = [sample_text] * size
        batch_iterations = 20
        batch_latencies = []
        
        logger.info(f"Running batch prediction benchmark (Batch size={size}, {batch_iterations} iterations)...")
        for _ in range(batch_iterations):
            t0 = time.time()
            predictor.predict_batch(batch_text)
            batch_latencies.append((time.time() - t0) * 1000)
            
        avg_batch_latency_ms = sum(batch_latencies) / len(batch_latencies)
        per_review_latency_ms = avg_batch_latency_ms / size
        batch_benchmarks[f"batch_size_{size}"] = {
            "avg_batch_latency_ms": avg_batch_latency_ms,
            "per_review_latency_ms": per_review_latency_ms
        }
        logger.info(f"Batch size={size}: total={avg_batch_latency_ms:.2f}ms, per-review={per_review_latency_ms:.4f}ms")

    # 6. Measure CSV throughput
    csv_path = os.path.join(config.DATA_DIR, "sample_reviews.csv")
    csv_throughput_rows_per_second = 0.0
    csv_total_time_seconds = 0.0
    
    if os.path.exists(csv_path):
        df_len = len(pd.read_csv(csv_path))
        logger.info(f"Running CSV throughput benchmark on: {csv_path} ({df_len} reviews)...")
        
        t0 = time.time()
        result_df = analyze_csv(csv_path)
        csv_total_time_seconds = time.time() - t0
        csv_throughput_rows_per_second = df_len / csv_total_time_seconds
        logger.info(f"CSV throughput: {csv_throughput_rows_per_second:.2f} reviews/sec (Total time: {csv_total_time_seconds:.4f}s)")
    else:
        logger.warning(f"Benchmark CSV not found at: {csv_path}. Skipping throughput measurement.")

    # 7. Compile deployment metrics report
    metrics_report = {
        "metadata": {
            "timestamp": time.asctime(),
            "model_type": "Logistic Regression",
            "pipeline": "Unified (sentiment_model.pkl)",
            "version": "1.6.0"
        },
        "loading_time_s": load_time_seconds,
        "memory_usage": {
            "before_load_mb": mem_before_mb,
            "after_load_mb": mem_after_mb,
            "overhead_mb": model_memory_overhead_mb
        },
        "prediction_latency": {
            "single_review_avg_ms": avg_single_latency_ms,
            "batch_inference": batch_benchmarks
        },
        "csv_throughput": {
            "total_processing_time_s": csv_total_time_seconds,
            "rows_per_second": csv_throughput_rows_per_second
        }
    }

    # Save to metrics report folder
    metrics_dir = os.path.dirname(config.APP_LOG_PATH) # backend/ml/reports/logs/ -> parent is reports/
    # wait, config.py has REPORT_METRICS_DIR configured!
    output_dir = config.REPORT_METRICS_DIR
    os.makedirs(output_dir, exist_ok=True)
    
    output_filepath = os.path.join(output_dir, "deployment_metrics.json")
    with open(output_filepath, "w", encoding="utf-8") as f:
        json.dump(metrics_report, f, indent=4, ensure_ascii=False)
        
    logger.info(f"Performance benchmarks completed. Metrics saved to: {output_filepath}")


if __name__ == "__main__":
    run_benchmark()
