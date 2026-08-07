# SentimentScope: AI-Powered Product Review Intelligence Platform

[![Backend CI status](https://github.com/Ashish-303/SentimentScope/actions/workflows/backend.yml/badge.svg)](https://github.com/Ashish-303/SentimentScope/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/Python-3.11-brightgreen.svg)](https://www.python.org/)
[![Flask Version](https://img.shields.io/badge/Flask-3.0.0-red.svg)](https://flask.palletsprojects.com/)
[![React Version](https://img.shields.io/badge/React-18.2-blue.svg)](https://react.dev/)

SentimentScope is an advanced, publication-grade product review intelligence platform that transitions raw, unstructured customer reviews into actionable aspect-level analytics and business intelligence. 

Unlike standard sentiment engines that only classify macro sentiment polarity (Positive, Neutral, Negative), SentimentScope combines a scientifically validated, leakage-free machine learning pipeline with a rule-based aspect mining system to extract specific operational friction points (e.g., defective products, packaging damage, service failures) and positive value markers (e.g., durability, cost-efficiency).

---

## 1. Features
* **Calibrated Sentiment Classification**: Calibration-optimized inference powered by a serialized unified Scikit-learn Pipeline (Logistic Regression).
* **Calibrated Confidence Scoring**: Full probability distributions mapped via `predict_proba()` to estimate prediction confidence.
* **Aspect-Based Feature Mining**: Automatic rule-based feature tagging:
  * **Negative Concerns**: Defective Product, Customer Service, Damaged Product, Sizing Issues, Refund/Return, Delivery Delay, Battery Issues, Value for Money.
  * **Positive Highlights**: Ease of Use, Quality / Performance, Value for Money, Design / Aesthetics, Customer Service, Durability.
* **Optimized Vectorized Batch Predictions**: Replaces row-by-row prediction loops with vectorized matrix inference (`predict_batch()`), accelerating CSV ingestion to **~2,840 reviews/second**.
* **DevOps Containerization**: Full Docker environment support with automated multi-stage builds.
* **Swagger/OpenAPI Documentation**: Interactive REST API documentation served live at `/docs`.
* **GitHub Actions CI**: Automated compilation, syntax checks, import validation, and integration tests on push and pull requests.

---

## 2. Platform Architecture
SentimentScope utilizes a decoupled client-server architecture:
```
                [ React / Vite Frontend Client ]
                               │
                (HTTPS / JSON REST Transactions)
                               │
                               ▼
                        [ Flask REST API ]
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         [ /analyze ]      [ /upload ]    [ /dashboard ]
               │               │               │
       (Single Review)    (Batch CSV)    (Aggregates BI)
               │               │               │
               ▼               ▼               ▼
         ┌───────────────────────────────────────────┐
         │       SentimentPredictor (Singleton)      │
         │   - Lazy Loading (Sub-second startup)     │
         │   - Thread-Safe mutex Lock activation     │
         │   - Unified Pipeline (sentiment_model.pkl)│
         └───────────────────────────────────────────┘
```

### Visual Interface Mockups (Placeholder)
![SentimentScope UI Dashboard Mockup](https://raw.githubusercontent.com/Ashish-303/SentimentScope/main/backend/ml/reports/figures/ui_mockup.png)
*(Interactive React charts and aspect-based distributions visual panels)*

---

## 3. Folder Structure
```
SentimentScope/
├── .github/workflows/          # GitHub CI/CD Actions YAML files
├── backend/
│   ├── app.py                  # Main Flask entrypoint and Swagger router
│   ├── config.py               # Environment configuration and folder setups
│   ├── routes/                 # Flask REST API Blueprints
│   │   ├── analyze.py          # Single text analysis endpoint
│   │   ├── upload.py           # Bulk CSV upload and process handler
│   │   └── dashboard.py        # BI report aggregates retrieval route
│   ├── configs/                # Shared application configurations
│   │   ├── aspect_keywords.json # Regex aspect mapping dictionary
│   │   └── swagger.json        # OpenAPI 3.0 API spec specification
│   ├── ml/
│   │   ├── data/               # Reference datasets (balanced, sample, analyzed)
│   │   ├── models/             # Production unified Scikit-learn Pipeline
│   │   │   └── archive/        # Archived legacy classifiers and vectorizers
│   │   ├── src/                # Machine learning processing engines
│   │   │   ├── predictor.py    # Calibrated SentimentPredictor
│   │   │   ├── csv_analyzer.py # Vectorized CSV analytics processor
│   │   │   ├── text_normalizer.py # Preprocessing & text cleaning module
│   │   │   └── benchmark_deployment.py # Performance profiling script
│   │   └── reports/            # Auto-generated visual and tabular metrics
│   └── uploads/                # Dynamic CSV staging folder
├── frontend/                   # React web application (Vite project)
├── Dockerfile                  # Slim production Docker recipe
├── docker-compose.yml          # Container orchestration recipe
├── requirements.txt            # Locked runtime python dependencies
├── .env.example                # Deployment environment template
└── README.md                   # Repository landing documentation
```

---

## 4. Getting Started

### Local Setup
#### Prerequisites
* Python 3.11+
* Node.js 18+

#### 1. Backend Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies from root-locked manifest:
   ```bash
   pip install -r ../requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   cp ../.env.example .env
   ```
5. Start the Flask application:
   ```bash
   python app.py
   ```
   The backend API will run on `http://127.0.0.1:5000/`.

#### 2. Frontend client Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development Vite server:
   ```bash
   npm run dev
   ```
   The client will run on `http://localhost:5173/`.

### Docker Container Setup
To spin up the entire backend containerized environment in production or development mode:
1. Make sure Docker and Docker Compose are installed.
2. Spin up containers using docker-compose:
   ```bash
   docker-compose up --build
   ```
   The containerized backend will start automatically and expose API services on `http://localhost:5000/`.

---

## 5. API Documentation

Exhaustive interactive API documentation is served live at `http://127.0.0.1:5000/docs` (or `/swagger`) via Swagger UI.

### Summary of Endpoints

#### 1. `POST /analyze`
Runs real-time sentiment parsing and aspect-level keyword extraction.
* **Payload**:
  ```json
  {
      "review": "The customer support was unresponsive, and the item arrived broken."
  }
  ```
* **Response**:
  ```json
  {
      "status": "success",
      "data": {
          "review": "The customer support was unresponsive, and the item arrived broken.",
          "sentiment": "Negative",
          "issue": ["Customer Service", "Damaged Product"],
          "positive_features": []
      }
  }
  ```

#### 2. `POST /upload`
Uploads a bulk CSV reviews dataset. Triggers optimized vectorized predictions and computes aggregates.
* **Payload**: `multipart/form-data` with `file` parameter.
* **Response**:
  ```json
  {
      "status": "success",
      "filename": "reviews.csv",
      "rows_processed": 100,
      "dashboard": { ... }
  }
  ```

#### 3. `GET /dashboard`
Retrieves aggregated metrics compiled from the current database.
* **Response**:
  ```json
  {
      "status": "success",
      "data": {
          "positive_reviews": 435,
          "neutral_reviews": 120,
          "negative_reviews": 310,
          "category_summary": { ... }
      }
  }
  ```

#### 4. `GET /health`
Returns pipeline diagnostics, load status, and deployment version metadata.
* **Response**:
  ```json
  {
      "status": "healthy",
      "model_loaded": true,
      "model": "Logistic Regression",
      "pipeline": "Unified",
      "version": "1.6.0"
  }
  ```

---

## 6. Research Methodology & Validation
SentimentScope is built to address computational overhead and lack of explainability in deep learning NLP. It evaluates optimized classical classifiers (Logistic Regression, SVM) under a strict **leakage-free experimental protocol**:
1. **Deduplication**: 15,829 unique records from e-commerce platforms.
2. **Pipelines**: TF-IDF (bigrams, sublinear scaling) and Chi-Square feature selection are fitted strictly inside cross-validation folds.
3. **Cross-Validation**: 5-Fold Stratified Cross-Validation.
4. **Calibrated Comparison**: Logistic Regression (Macro F1 = 0.7701) is statistically equivalent to SGDClassifier (Macro F1 = 0.7799) with McNemar test ($p = 0.0852 \ge 0.05$). Logistic Regression is chosen as the production champion due to lower latency overhead, sub-megabyte footprint, and structural explainability.

---

## 7. Future Work
* **Prescriptive Rule Mining**: Implement FP-growth rules to detect correlated aspect defect pairs.
* **Isotonic Regression Calibration**: Further calibrate probability thresholds to optimize accuracy-rejection rates.
* **Database Migration**: Move flat CSV databases to PostgreSQL for live time-series analytical views.

---

## 8. Authors
* **Ashish Bavaliya** - P P Savani University (Final Year B.Tech CSE)

---

## 9. Acknowledgements
* Department of Computer Science & Engineering, P P Savani University.
* Under guidance of university project review supervisors.

---

## 10. License
This project is licensed under the MIT License - see the `LICENSE` file for details. Built strictly for research and academic review purposes.