# Performance Evaluation & Research Validation Modules

This directory contains statistical tests, latency-accuracy charting engines, confusion matrix calculators, and error analyzers to support the academic validation of the **SentimentScope** project.

## Purpose & Responsibilities
To decouple performance evaluation and significance testing from training code. This enforces the academic constraint that model comparison and significance calculations are evaluated out-of-band on holdout datasets.

## Future Files & Extensions
* `ablation_matrix_generator.py`: Generates the LaTeX formatted ablation tables.
* `inter_annotator_kappa.py`: Computes Cohen's Kappa for validation agreement.

## Workflow
1. Load test predictions of the benchmark models.
2. Calculate ECE and Brier scores.
3. Generate and export plots to `reports/figures/` (including the Accuracy-Latency Pareto plot).
4. Run Wilcoxon Signed-Rank and McNemar's significance tests.
