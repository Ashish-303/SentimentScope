# SentimentScope: A Hybrid Business Intelligence Framework for Automated E-Commerce Review Analytics

SentimentScope is a comprehensive hybrid Machine Learning and Business Intelligence platform developed as a final-year B.Tech CSE (specializing in Machine Learning & AI) project at P P Savani University. 

The system transitions raw, unstructured consumer reviews into granular aspect-level highlights and operational issue categorizations. Unlike standard sentiment classifiers that only predict macro polarity (Positive, Neutral, Negative), SentimentScope utilizes a calibrated machine learning engine in sequence with a rule-based conditional extraction pipeline to detect specific customer friction points (e.g., delivery delays, quality concerns, packaging failures) and positive value markers (e.g., durability, ease of use).

---

## Features

* **Calibrated Sentiment Classification**: High-accuracy sentiment parsing (Positive, Neutral, Negative) powered by a trained Random Forest model.
* **Aspect-Based Complaint Mining**: Deep-dive operational feedback extraction covering:
  * Quality, Performance, Battery, Compatibility, Service, Pricing, Features, Disappointment, Durability, Content, Size & Fit.
* **Aspect-Based Positive Highlights Extraction**: Positive marker extraction including Value for Money, Design, Ease of Use, and Quality.
* **In-Memory Analytical Ingestion**: Streamlined aggregate computation generating metrics for product-wise sentiment distribution and category trends.
* **Operational Reporting**: Automated generation and export of ranked comparative performance tables (`model_comparison.csv` and `model_comparison.xlsx`) along with performance visualization charts.

---

## Technology Stack

### Machine Learning & Data Mining
* **Scikit-learn**: Calibrated Random Forest Classifier, TF-IDF Vectorization.
* **Pandas & NumPy**: Data wrangling and aggregate calculations.
* **Joblib**: Model serialization and deserialization.

### Backend API
* **Flask**: Python web application framework.
* **Flask-CORS**: Cross-Origin Resource Sharing enablement.

### Frontend Dashboard
* **React & Vite**: Single Page Application structure.
* **Tailwind CSS**: Dashboard styling.
* **Recharts**: Interactive data charting.
* **Axios**: Async API calls.

---

## Project Structure

```
SentimentScope/
├── backend/
│   ├── app.py                      # Flask API Gateway and blueprint router
│   ├── routes/
│   │   ├── analyze.py              # Single text analysis route
│   │   └── upload.py               # Bulk CSV upload and analytical parser
│   ├── ml/
│   │   ├── data/
│   │   │   ├── balanced_reviews.csv # 26.4k balanced training dataset
│   │   │   └── sample_reviews.csv   # Target validation sample reviews
│   │   ├── models/
│   │   │   ├── sentiment_model.pkl  # Active serialized production model (Random Forest)
│   │   │   └── tfidf_vectorizer.pkl # Active TF-IDF representation vectorizer
│   │   ├── notebooks/
│   │   │   ├── 05_Balanced_Dataset.ipynb
│   │   │   ├── 06_Model_Comparison.ipynb
│   │   │   ├── 07_Linear_SVM.ipynb
│   │   │   ├── 08_Logistic_Regression.ipynb
│   │   │   ├── 09_Multinomial_Naive_Bayes.ipynb
│   │   │   ├── 10_Random_Forest.ipynb
│   │   │   └── 11_XGBoost.ipynb
│   │   ├── reports/                 # Auto-generated benchmark statistics
│   │   │   ├── model_comparison.csv
│   │   │   ├── model_comparison.xlsx
│   │   │   └── *.png               # Comparative accuracy/recall/time plots
│   │   └── src/
│   │       ├── text_normalizer.py  # Input cleaning regex engine
│   │       ├── complaint_detector.py # Heuristic issue classification rules
│   │       ├── positive_detector.py  # Heuristic value classification rules
│   │       ├── predictor.py        # Core model prediction loader
│   │       ├── csv_analyzer.py     # Row-by-row batch csv parser
│   │       └── dashboard_generator.py # In-memory aggregation engine
│   └── uploads/                    # Temporary staging folder for processing
├── frontend/
│   ├── package.json
│   ├── src/                        # React source components
│   └── vite.config.js
├── .gitignore                      # Environment and cache ignore configuration
└── README.md                       # Comprehensive deployment documentation
```

---

## Installation & Setup

### Prerequisites
* Python 3.8+ (Anaconda recommended)
* Node.js 16+

### 1. Backend Server Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install flask flask-cors pandas numpy joblib scikit-learn openpyxl
   ```
4. Start the backend Flask server:
   ```bash
   python app.py
   ```
   The API will run on `http://127.0.0.1:5000/`.

### 2. Frontend Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The client will run on `http://localhost:5173/`.

---

## API Endpoints

### 1. Single Review Analysis
* **Route**: `POST /analyze`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
      "review": "Fast delivery and exceptional quality."
  }
  ```
* **Response**:
  ```json
  {
      "status": "success",
      "data": {
          "sentiment": "Positive",
          "positive_features": ["Delivery", "Quality"]
      }
  }
  ```

### 2. Bulk File Analysis
* **Route**: `POST /upload`
* **Content-Type**: `multipart/form-data`
* **Request Payload**: A CSV file containing headers corresponding to customer reviews (auto-mapped via `validators.py`).
* **Response**: A full JSON payload aggregating total review counts, sentiment distributions, complaint category percentages, and positive highlights.

---

## Future Enhancements
* **Expected Calibration Error (ECE) Optimization**: Apply Isotonic Regression to formally calibrate prediction output confidence scores.
* **Association Rule Prescriptive Engine**: Integrate FP-Growth rule mining to discover co-occurring e-commerce operational defect patterns.
* **Database Persistence Layer**: Port transient in-memory analytics to PostgreSQL for historical trend tracking.

---

## License
This project is licensed under the MIT License - see the LICENSE file for details. Developed strictly for academic, research, and educational purposes.