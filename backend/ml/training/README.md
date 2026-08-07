# Model Training & Optimization Modules

This directory contains the machine learning pipelines, baseline comparison engines, cross-validation scripts, and hyperparameter tuning sweeps for the **SentimentScope** project.

## Purpose & Responsibilities
To isolate the development, tuning, and optimization of our classifiers from the inference and deployment code. All code here runs off-line or asynchronously, exporting model outputs and pipeline pickles to the shared models directory.

## Future Files & Extensions
* `grid_searches.json`: Stores hyperparameter configurations.
* `baseline_scores.json`: Keeps a history of local classifier benchmark runs.

## Training Pipeline Workflow
1. Load dataset (`balanced_reviews.csv`).
2. Run model comparisons across 5 estimators under 5-Fold Cross Validation.
3. Perform randomized hyperparameter optimization on top models.
4. Export the finalized unified pipeline artifact (`sentiment_model.pkl`) to `backend/ml/models/`.
