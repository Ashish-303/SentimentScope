# SentimentScope — E-Commerce Review Intelligence Platform

[![Backend CI Status](https://github.com/Ashish-303/SentimentScope/actions/workflows/backend.yml/badge.svg)](https://github.com/Ashish-303/SentimentScope/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/Python-3.11%2B-brightgreen.svg)](https://www.python.org/)
[![Flask Version](https://img.shields.io/badge/Flask-3.0.0-red.svg)](https://flask.palletsprojects.com/)

SentimentScope is an AI-powered product review intelligence platform designed to convert unstructured customer feedback into actionable aspect-level analytics and operational business intelligence.

By combining machine-learning sentiment classification with product-category-aware aspect extraction heuristics, SentimentScope surfaces specific operational friction points (e.g., product defects, packaging issues, sizing mismatch, delivery delays) alongside key positive highlights (e.g., quality, value, aesthetics, durability).

---

## Features

- **3-Class Sentiment Classification**: Classifies text reviews into **Positive**, **Neutral**, or **Negative** with native confidence probability scores.
- **Product-Category-Aware Aspect Extraction**: Rule-based complaint and highlight detection tailored across product categories (Home & Kitchen, Electronics, Fashion, Beauty, Sports & Outdoors, etc.).
- **Vectorized Batch Processing**: High-throughput CSV ingestion and bulk prediction pipeline for enterprise analytics.
- **Interactive REST API**: Served via Flask with Swagger/OpenAPI 3.0 interactive documentation at `/docs`.
- **Business Intelligence Dashboard API**: Real-time aggregation of sentiment trends, rating distributions, and category-level aspect breakdowns.
- **Docker Containerization**: Multi-stage build setup for containerized deployment.
- **Automated CI Integration**: GitHub Actions workflow for linting, syntax verification, and API integration testing.

---

## Architecture Overview

SentimentScope utilizes a decoupled client-server architecture:

```
                      ┌─────────────────────────────────┐
                      │    Client Application / Web UI  │
                      └────────────────┬────────────────┘
                                       │
                         (REST API / JSON Transactions)
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │        Flask REST Server        │
                      └────────────────┬────────────────┘
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             ▼                         ▼                         ▼
      [ POST /analyze ]         [ POST /upload ]        [ GET /dashboard ]
    Single Review Analysis     Batch CSV Ingestion      BI Aggregation API
             │                         │                         │
             └─────────────────────────┼─────────────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │   SentimentPredictor Engine     │
                      │  - Thread-Safe Singleton        │
                      │  - Scikit-Learn ML Pipeline     │
                      │  - Category-Aware Aspect Mining │
                      └─────────────────────────────────┘
```

---

## Project Structure

```
SentimentScope/
├── .github/
│   └── workflows/
│       └── backend.yml         # GitHub Actions CI workflow
├── backend/
│   ├── app.py                  # Flask REST application & OpenAPI router
│   ├── config.py               # Application configuration
│   ├── configs/
│   │   ├── aspect_keywords.json # Universal & category-aware keyword rules
│   │   └── swagger.json        # OpenAPI 3.0 specification
│   ├── ml/
│   │   ├── data/               # Staging & sample review datasets
│   │   ├── models/             # Machine learning model artifacts
│   │   └── src/                # Core ML & text processing modules
│   │       ├── complaint_detector.py        # Complaint aspect detector
│   │       ├── csv_analyzer.py              # Batch CSV analytics processor
│   │       ├── dashboard_generator.py       # BI metrics aggregator
│   │       ├── data_cleaner.py              # Text cleaning utilities
│   │       ├── positive_detector.py         # Highlight aspect detector
│   │       ├── predictor.py                 # SentimentPredictor singleton
│   │       ├── product_category_taxonomy.py # Category taxonomy rules
│   │       ├── text_encoding_utils.py       # Encoding repair utilities
│   │       └── text_normalizer.py           # Text normalization pipeline
│   ├── routes/                 # Flask REST API routes
│   │   ├── analyze.py          # Single text analysis endpoint
│   │   ├── dashboard.py        # Aggregated BI dashboard endpoint
│   │   └── upload.py           # CSV batch upload endpoint
│   └── tests/                  # Integration test suite
│       └── integration/
│           └── test_api.py
├── .env.example                # Environment configuration template
├── .gitignore                  # Git untracked pattern definitions
├── Dockerfile                  # Container build recipe
├── docker-compose.yml          # Service orchestration setup
├── package.json                # Frontend/web build definitions
└── requirements.txt            # Python dependencies
```

---

## Installation & Quick Start

### Prerequisites
- **Python**: 3.11+
- **pip** and **virtualenv**

### 1. Clone & Setup Environment

```bash
git clone https://github.com/Ashish-303/SentimentScope.git
cd SentimentScope

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Run the Backend API Server

```bash
python backend/app.py
```

The server starts locally at `http://127.0.0.1:5000`.
- Interactive API Docs (Swagger): `http://127.0.0.1:5000/docs`
- Health Check Endpoint: `http://127.0.0.1:5000/api/health`

---

## API Usage & Examples

### Single Review Analysis (`POST /api/analyze`)

**Request:**

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "review_text": "The battery life is terrible and the screen flickers, but the camera is decent.",
    "category": "Electronics"
  }'
```

**Response:**

```json
{
  "sentiment": "Negative",
  "confidence": 0.842,
  "detected_category": "Electronics",
  "complaints": [
    "Battery Issues",
    "Display & Screen"
  ],
  "highlights": [
    "Camera & Media"
  ]
}
```

---

### Batch CSV Upload (`POST /api/upload`)

Upload a CSV file containing `review_text` and optional `category` columns for high-throughput batch processing:

```bash
curl -X POST http://127.0.0.1:5000/api/upload \
  -F "file=@backend/ml/data/sample_reviews.csv"
```

---

### BI Dashboard Aggregates (`GET /api/dashboard`)

Retrieve aggregated metrics for visual dashboard rendering:

```bash
curl -X GET http://127.0.0.1:5000/api/dashboard
```

---

## Docker Deployment

To run the application using Docker:

```bash
# Build and run container
docker-compose up --build -d
```

The container exposes port `5000` with automated health checks enabled.

---

## Running Tests

Run the integration test suite via `pytest`:

```bash
pytest backend/tests/ -v
```

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.


---

## 5. Getting Started

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
      "version": "2.7.1"
  }
  ```

---

## 6. Research Methodology & Validation
SentimentScope is built to address computational overhead and lack of explainability in deep learning NLP. It evaluates optimized classical classifiers under a strict **leakage-free experimental protocol**:
1. **Deduplication**: $15,829$ unique records from the frozen canonical dataset (`backend/ml/data/balanced_reviews.csv`, SHA-256: `9eee7d...`).
2. **Pipelines**: TF-IDF ($15,000$ bigrams, sublinear scaling) and Chi-Square feature selection ($10,000$ features) are fitted strictly inside cross-validation folds.
3. **Cross-Validation**: Repeated 5x2-Fold Stratified Cross-Validation ($N=10$ paired evaluations on 80% Development partition, $N=12,663$) and isolated 20% holdout test partition ($N=3,166$).
4. **Statistical Validation & Selection**: In Repeated 5x2-CV, `SGD Classifier (Log Loss)` (Macro F1 = 0.7632), `SGD Classifier (Hinge)` (Macro F1 = 0.7603), and `Logistic Regression` (Macro F1 = 0.7599) form a top linear performance cluster. Pairwise Wilcoxon signed-rank tests with Holm step-down correction establish that performance differences among these three models are not statistically significant ($p_{\text{Holm}} > 0.05$). On the isolated holdout test set ($N=3,166$), McNemar's exact test ($p = 0.5436 \ge 0.05$) and paired 10,000-resample bootstrap 95% CI ($[-0.0051, +0.0149]$, spanning zero) confirm error rates are statistically indistinguishable. `Logistic Regression` (`C=1.0, class_weight='balanced', solver='lbfgs'`) is confirmed as the operational production classifier through a multi-criteria engineering decision based on native probability support via `predict_proba()`, deterministic L-BFGS convergence, lowest cross-validation standard deviation ($\pm 0.0041$), batch-amortized holdout latency ($0.82\text{ ms/review}$ in Python evaluation runtime), and lightweight memory profile ($774.2\text{ KB}$).

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