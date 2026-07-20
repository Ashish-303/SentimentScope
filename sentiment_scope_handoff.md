# SentimentScope - Comprehensive Technical Handoff Document

This document contains the complete technical specifications, architecture, codebase state, and implementation roadmap for **SentimentScope**, an AI-powered customer review analytics dashboard. It is designed to provide another AI agent with full, high-fidelity context to continue development immediately.

---

## 1. Project Metadata & Context
* **Project Name**: SentimentScope
* **Academic Context**: User Defined Project (UDP) for B.Tech Computer Science Engineering (Machine Learning & AI), 7th Semester.
* **Student**: Ashish Bavaliya
* **University**: P P Savani University
* **Target Users**: E-commerce sellers, product managers, marketing teams, and business analysts.
* **Core Value Proposition**: Beyond simple sentiment classification (Positive/Neutral/Negative), this system acts as a business intelligence platform. It answers *why* sentiment is positive or negative by extracting specific product strengths (themes) and operational complaints (issues) from unstructured review text.

---

## 2. Directory Structure & File Registry

The repository is structured as a Python Flask backend (incorporating the machine learning assets and processing pipelines) and a React frontend.

```
SentimentScope/
├── .gitignore
├── SentimentScope_Revised_Blueprint.docx (63.6 KB)  # Word blueprint detailing academic requirements
├── SentimentScope_Presentation.pptx.pptx (2.98 MB)  # PowerPoint presentation slides
├── SentimentScope_Presentation.pptx.pdf (1.01 MB)   # PDF version of the presentation slides
├── sentimentscope_v2.js (73.6 KB)                   # Node.js script using the 'docx' library for report generation
├── dashboard.png (1.40 MB)                          # Dashboard mockup/design reference screenshot
├── dataset/                                         # [Empty directory]
├── deployment/                                      # [Empty directory]
├── docs/                                            # [Empty directory]
├── frontend/                                        # [Empty directory] React app placeholder
└── backend/
    ├── app.py (0 bytes)                             # [Empty file] Main Flask application entry point
    ├── uploads/                                     # Directory for temporary CSV file storage
    ├── routes/
    │   ├── analyze.py (1.74 KB)                     # Blueprint for single text analysis
    │   └── upload.py (2.74 KB)                      # Blueprint for bulk CSV upload and dashboard generation
    └── ml/
        ├── data/
        │   ├── raw_reviews.csv (341.39 MB)          # Raw dataset containing 4,000,002 labeled reviews
        │   ├── balanced_reviews.csv (2.1 MB) # Balanced sampled dataset (8,800 per class)
        │   ├── sample_reviews.csv (11.69 KB)        # 100 sample reviews extracted for quick testing
        │   └── analyzed_reviews.csv (22.20 KB)      # Output dataset generated from sample_reviews.csv
        ├── models/
        │   ├── sentiment_model.pkl (93.4 MB)        # Serialized Random Forest model
        │   └── tfidf_vectorizer.pkl (556 KB)        # Serialized TF-IDF vectorizer
        ├── notebooks/
        │   ├── 01_EDA.ipynb (37.52 KB)              # Exploratory Data Analysis on a small 4,915-row dataset
        │   ├── 03_Sentiment_Model_V1.ipynb (12.16 KB)# Baseline model training (Logistic Regression, small dataset)
        │   ├── 04_Training_V2.ipynb (18.93 KB)      # Model training V2 (Logistic Regression, 100k samples)
        │   ├── 05_Balanced_Dataset.ipynb (5.14 KB)  # Script that samples raw data to make the 26.4k balanced set
        │   ├── 06_Model_Comparison.ipynb (0 bytes)  # [Empty] Planned notebook for comparing classifiers
        │   └── 07_Final_Model_Training.ipynb (0 bytes)# [Empty] Planned notebook for final retrained models
        └── src/
            ├── text_normalizer.py (223 bytes)       # Basic regex cleaning for input text
            ├── complaint_detector.py (4.05 KB)      # Rule-based negative feedback categorization
            ├── positive_detector.py (3.18 KB)       # Rule-based positive feedback categorization
            ├── predictor.py (2.74 KB)               # Integrated inference engine
            ├── validators.py (2.14 KB)              # CSV column header validation
            ├── csv_analyzer.py (3.91 KB)            # CSV batch-processing script
            └── dashboard_generator.py (5.93 KB)     # Aggregator converting dataframes to dashboard JSON
```

---

## 3. Dataset Information

### A. Raw Dataset (`raw_reviews.csv`)
* **Size**: 4,000,002 rows.
* **Columns**: `product_id`, `product_title`, `category`, `review_text`, `rating`, `sentiment`.
* **Class Distribution (Highly Imbalanced)**:
  * **Positive**: 2,063,406 reviews
  * **Neutral**: 1,231,769 reviews
  * **Negative**: 704,825 reviews
* **Usage**: Reserved exclusively for training data sampling.

### B. Balanced Dataset (`balanced_reviews.csv`)
* **Size**: 26,400 rows.
* **Columns**: Identical to `raw_reviews.csv`.
* **Class Distribution (Balanced)**:
  * **Positive**: 200,000 reviews
  * **Neutral**: 200,000 reviews
  * **Negative**: 200,000 reviews
* **Generation Code** (`05_Balanced_Dataset.ipynb`):
  ```python
  positive_sample = positive_df.sample(n=200000, random_state=42)
  neutral_sample = neutral_df.sample(n=200000, random_state=42)
  negative_sample = negative_df.sample(n=200000, random_state=42)
  balanced_df = pd.concat([positive_sample, neutral_sample, negative_sample])
  balanced_df = balanced_df.sample(frac=1, random_state=42).reset_index(drop=True)
  balanced_df.to_csv("../data/balanced_reviews.csv", index=False)
  ```

---

## 4. Machine Learning & Natural Language Processing Pipelines

### A. Natural Language Processing (`backend/ml/src/text_normalizer.py`)
Applies a regular expression cleaning pipeline to strip noise from raw review text:
```python
import re

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)       # Remove hyperlinks
    text = re.sub(r"[^a-zA-Z\s]", "", text)   # Remove punctuation and numbers
    text = re.sub(r"\s+", " ", text)          # Collapse consecutive whitespaces
    return text.strip()
```

### B. Model Training Status (`backend/ml/notebooks/10_Random_Forest.ipynb`)
The currently deployed models (`sentiment_model.pkl` and `tfidf_vectorizer.pkl`) were trained using the following pipeline configuration:
* **Sample Size**: 26,400 reviews balanced dataset (`balanced_reviews.csv` containing 8,800 per class).
* **Vectorization**: `TfidfVectorizer(ngram_range=(1, 2), max_features=15000, stop_words="english")` fit on cleaned reviews.
* **Split**: 80% train, 20% test (stratified).
* **Algorithm**: `RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)`.
* **Performance**:
  * **Overall Accuracy**: `77.65%`
  * **Cross Validation Accuracy**: `78.46%` (5-Fold)
  * **ROC-AUC**: `91.33%` (One-vs-Rest)
  * **Weighted Metrics**: Precision `0.7768`, Recall `0.7765`, F1-Score `0.7754`

### C. Rule-Based Heuristic Sub-Classifiers
To extract granular, actionable business intelligence, the system uses two fast, keyword-based classifiers that map reviews to business themes.

#### 1. Complaint Detector (`backend/ml/src/complaint_detector.py`)
Triggered only when the predicted sentiment is **Negative**. It searches the review text for specific substrings:
* **Delivery**: `"delivery"`, `"shipping"`, `"courier"`, `"late"`, `"delay"`, `"arrived late"`, `"delayed"`
* **Packaging**: `"package"`, `"packaging"`, `"box"`, `"sealed"`, `"damaged package"`, `"poor packaging"`
* **Quality**: `"broken"`, `"defective"`, `"faulty"`, `"damaged"`, `"poor quality"`, `"stopped working"`, `"not working"`, `"doesn't work"`, `"does not work"`, `"broke"`, `"cracked"`, `"quality"`, `"low quality"`
* **Performance**: `"slow"`, `"lag"`, `"lagging"`, `"freezing"`, `"performance"`, `"speed"`, `"sluggish"`
* **Battery**: `"battery"`, `"charging"`, `"charge"`, `"drains fast"`, `"battery life"`, `"overheating"`
* **Compatibility**: `"compatible"`, `"compatibility"`, `"connect"`, `"connection"`, `"bluetooth"`, `"pairing"`, `"sync"`, `"supported"`
* **Service**: `"customer support"`, `"support"`, `"refund"`, `"seller"`, `"service"`, `"replacement"`, `"help desk"`
* **Pricing**: `"expensive"`, `"overpriced"`, `"too costly"`, `"not worth the price"`, `"high price"`, `"cost"`
* **Features**: `"feature"`, `"function"`, `"option"`, `"missing feature"`, `"missing functionality"`
* **Disappointment**: `"disappointed"`, `"terrible"`, `"worst purchase"`, `"do not buy"`, `"bad experience"`, `"waste of money"`, `"not worth it"`
* **Durability**: `"wear out"`, `"lasted"`, `"durable"`, `"durability"`, `"fell apart"`
* **Size & Fit**: `"too small"`, `"too large"`, `"fit"`, `"fitting"`, `"size issue"`
* **Content**: `"boring"`, `"poor writing"`, `"confusing"`, `"bad story"`, `"bad content"`
* **Accuracy**: `"incorrect"`, `"wrong"`, `"inaccurate"`
* **Fallback**: Returns `["Other"]` if no keyword matches.

#### 2. Positive Feature Detector (`backend/ml/src/positive_detector.py`)
Triggered only when the predicted sentiment is **Positive**. It searches the review text for specific substrings:
* **Quality**: `"excellent quality"`, `"great quality"`, `"high quality"`, `"premium quality"`, `"well made"`, `"good quality"`, `"top notch"`, `"highly recommend"`, `"great product"`, `"excellent product"`
* **Performance**: `"works perfectly"`, `"great performance"`, `"performance"`, `"fast"`, `"smooth"`, `"responsive"`, `"efficient"`, `"works great"`, `"works flawlessly"`
* **Features**: `"great features"`, `"useful feature"`, `"feature rich"`, `"lots of features"`, `"excellent features"`, `"exactly what i needed"`
* **Packaging**: `"well packaged"`, `"beautiful packaging"`, `"good packaging"`, `"nicely packed"`, `"great packaging"`
* **Delivery**: `"fast delivery"`, `"quick delivery"`, `"arrived on time"`, `"delivered quickly"`, `"fast shipping"`
* **Value for Money**: `"worth the price"`, `"value for money"`, `"great value"`, `"good value"`, `"worth every penny"`, `"well worth the price"`
* **Design**: `"beautiful design"`, `"stylish"`, `"looks great"`, `"attractive"`, `"nice design"`
* **Ease of Use**: `"easy to use"`, `"user friendly"`, `"simple to use"`, `"easy setup"`
* **Durability**: `"durable"`, `"long lasting"`, `"sturdy"`, `"solid build"`
* **Fallback**: Returns `["General Satisfaction"]` if no keyword matches.

### D. Main Inference Orchestration (`backend/ml/src/predictor.py`)
Exposes `analyze_review(review)` which integrates ML predictions with the rule-based extractors:
```python
def analyze_review(review):
    review = str(review)
    sentiment = predict_sentiment(review) # Runs normalizer -> vectorizer -> Logistic Regression
    
    issues = ["Other"]
    positive_features = ["General Satisfaction"]
    
    if str(sentiment).lower() == "negative":
        issues = detect_issue(review)
    elif str(sentiment).lower() == "positive":
        positive_features = detect_positive_features(review)
        
    return {
        "review": review,
        "sentiment": sentiment,
        "issue": issues,
        "positive_features": positive_features
    }
```

---

## 5. Batch CSV Processing & Analytics Engine

### A. Column Validator (`backend/ml/src/validators.py`)
To handle arbitrary user uploads, the system automatically maps various common headers to core variables using substring matches:
* **Review Text**: Matches `review_text`, `reviewText`, `Review Content`, `review`, `review_content`, `text`.
* **Product Name**: Matches `product_title`, `product_name`, `product`, `Product Name`, `title`.
* **Category**: Matches `category`, `Category`, `product_category`.
* **Rating**: Matches `rating`, `overall`, `Review Rating`, `score`.
* **Constraints**: Raises a `ValueError` if a product column or review text column cannot be identified.

### B. CSV Analyzer (`backend/ml/src/csv_analyzer.py`)
Reads the uploaded CSV, executes `validators.py`, drops rows with null review texts, runs `analyze_review(review)` row-by-row, standardizes output columns, and appends `Predicted_Sentiment`, `Detected_Issues`, and `Positive_Features` (as comma-separated strings) to the dataframe.

### C. Dashboard Generator (`backend/ml/src/dashboard_generator.py`)
Accepts the analyzed dataframe and calculates aggregate JSON metrics:
1. **KPI Cards**:
   * `total_reviews`: Row count of the dataframe.
   * `total_products`: Unique count of standardized `Product_Name`.
   * `positive_reviews` / `neutral_reviews` / `negative_reviews`: Frequency of each class in `Predicted_Sentiment`.
2. **Sentiment Summary**: A dictionary of sentiment value counts.
3. **Issue Summary**: Frequencies of individual issues parsed from the comma-separated `Detected_Issues` column (omitting empty strings and `"Other"`).
4. **Positive Features Summary**: Frequencies of individual positive themes parsed from the comma-separated `Positive_Features` column (omitting empty strings and `"General Satisfaction"`).
5. **Category Summary**: Value counts of the `Category` column (limited to the top 10).
6. **Top Products**: Top 10 products ranked by their mean rating (`df.groupby("Product_Name")["Rating"].mean()`), rounded to 2 decimal places.
7. **Product Sentiment Breakdown**: A crosstabulation matrix of the top 10 products showing the counts of Positive, Neutral, and Negative reviews for each.
8. **Recent Negative Reviews**: A list of the first 5 negative reviews, mapping their product name, review text, and detected issues.

---

## 6. Backend API Endpoints (Flask)

### A. Single Text Analysis (`backend/routes/analyze.py`)
* **Endpoint**: `POST /analyze`
* **Input JSON**:
  ```json
  { "review": "This blender is works perfectly, but the shipping was extremely delayed." }
  ```
* **Processing**: Triggers `predictor.py -> analyze_review()`.
* **Success Output (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "review": "This blender is works perfectly, but the shipping was extremely delayed.",
      "sentiment": "Negative", // (Classification based on model prediction)
      "issue": ["Delivery"],
      "positive_features": ["General Satisfaction"]
    }
  }
  ```

### B. Bulk CSV Analysis (`backend/routes/upload.py`)
* **Endpoint**: `POST /upload`
* **Multipart Form-Data**: Key `file` mapped to a `.csv` file.
* **Processing**: Saves the file to `backend/uploads/`, runs `csv_analyzer.py -> analyze_csv()`, passes the output dataframe to `dashboard_generator.py -> generate_dashboard()`.
* **Success Output (200 OK)**:
  ```json
  {
    "status": "success",
    "filename": "sample_reviews.csv",
    "rows_processed": 100,
    "columns": ["product_id", "product_title", "category", "review_text", "rating", "sentiment", "Product_Name", "Review_Text", "Category", "Rating", "Predicted_Sentiment", "Detected_Issues", "Positive_Features"],
    "dashboard": {
      "total_reviews": 100,
      "total_products": 29,
      "positive_reviews": 53,
      "neutral_reviews": 30,
      "negative_reviews": 17,
      "sentiment_summary": { "Positive": 53, "Neutral": 30, "Negative": 17 },
      "issue_summary": { "Disappointment": 10, "Quality": 5, "Packaging": 4, "Features": 4 },
      "positive_features_summary": { "Quality": 22, "Performance": 19, "Packaging": 7, "Delivery": 7, "Value for Money": 6 },
      "category_summary": { "Sports & Outdoors": 17, "Fashion": 15 },
      "top_products": { "Noise-Canceling Headphones": 5.0, "Board Game Bundle": 4.75 },
      "product_sentiment_breakdown": {
        "Noise-Canceling Headphones": { "Negative": 0, "Neutral": 0, "Positive": 5 }
      },
      "recent_negative_reviews": [
        { "product": "Lipstick", "review": "Broken item.", "issue": "Quality" }
      ]
    }
  }
  ```

---

## 7. Current Technical Gaps

Before the application is fully operational, three key implementation gaps must be resolved:

### Gap 1: Flask Entry Point (`backend/app.py` is empty)
There is currently no server runner. `backend/app.py` must be implemented to:
1. Initialize the Flask application.
2. Configure Cross-Origin Resource Sharing (CORS) to allow requests from the React frontend port.
3. Register the `analyze_bp` and `upload_bp` blueprints.
4. Set up an app route or health check.
5. Boot the server on an designated port (e.g., `5000`).

### Gap 2: Final Model Retraining & Comparison
* Notebooks `06_Model_Comparison.ipynb` and `07_Final_Model_Training.ipynb` are empty.
* The system is currently running on a temporary model trained on a subset of 100,000 samples.
* To meet the academic blueprint requirements, a comparative analysis comparing Multinomial Naive Bayes, Logistic Regression, and Linear SVM must be executed on the full 600,000 balanced dataset, and the best-performing model must be saved as the production `sentiment_model.pkl`.

### Gap 3: React Frontend Dashboard
* The `frontend/` folder is empty.
* A single-page React application must be scaffolded and built, implementing the sidebar layout and rendering the JSON payload returned by `POST /upload`.

---

## 8. Frontend Design & Report Specifications

### A. Dashboard UI Design (Inspired by `dashboard.png`)
* **Theme**: Modern dark/light mode with a sidebar navigation layout.
* **Sidebar Items**:
  1. **Dashboard**: Main analytical summary.
  2. **Review Analyzer**: Interactive sandbox to test individual text inputs.
  3. **Product Insights**: Detailed metrics grouped by specific products.
  4. **Categories**: Distribution and ratings of sentiments across categories.
  5. **Upload CSV**: Dropzone area for batch uploads.
  6. **Reports**: System to export analytical reports.
* **Component Widgets**:
  * **KPI Cards**: Four grids (Total Reviews, Total Products, Positive Rate, Negative Rate) with micro-animations.
  * **Pie Chart**: Sentiment Distribution (Positive vs. Neutral vs. Negative).
  * **Horizontal Bar Charts**:
    * Customer Complaints (top operational issues).
    * Customer Favorites (top positive product themes).
  * **Category Distribution Chart**: Pie/Donut chart illustrating reviews per category.
  * **Tables**:
    * Top Rated Products (Product name, average rating, volume).
    * Recent Negative Reviews (Product, review text, identified issue badge).

### B. PDF/Word Report Generator (`sentimentscope_v2.js`)
The root directory contains a comprehensive JavaScript file (`sentimentscope_v2.js`) designed to generate styled Word docx reports. It establishes a complete design system:
* **Color Palette**:
  * Navy: `#1B3A6B` (Headers, titles)
  * Blue: `#2563EB` (Primary borders, highlights)
  * Light Blue: `#DBEAFE` (Shading, table accents)
  * Teal: `#0F766E` (Secondary headers)
  * Green/GreenBg: `#166534` / `#DCFCE7` (Positive callouts)
  * Amber/AmberBg: `#92400E` / `#FEF3C7` (Warning indicators)
  * Red/RedBg: `#991B1B` / `#FEE2E2` (Negative callouts)
  * Gray/GrayBg/Dark: `#374151` / `#F9FAFB` / `#111827` (Body text, layouts)
* **Helper Utilities**: Provides modular typography elements (`H1`, `H2`, `H3`, `P`, `B`, `bullet`, `num`, `CODE`, `spacer`, `divider`) and standard table builder factories `T(headers, rows, colW)` to output highly-structured corporate review audits.

---

## 9. Phase-by-Phase AI Implementation Guide

To complete the project, execute the following steps in sequence:

### Phase 1: Machine Learning Model Retraining
1. Open `backend/ml/notebooks/06_Model_Comparison.ipynb`. Load `backend/ml/data/balanced_reviews.csv`. Clean using the text normalizer. Run a TF-IDF vectorizer (max features 10,000). Split the data 80/20.
2. Train and evaluate three models:
   * `MultinomialNB()`
   * `LogisticRegression(max_iter=1000)`
   * `LinearSVC(max_iter=1000)` or `SGDClassifier(loss="hinge")`
3. Print comparative metrics (Accuracy, Precision, Recall, F1-Score).
4. Open `07_Final_Model_Training.ipynb`, import the best-performing model structure, train it on the full 600,000 dataset, and export it directly to `backend/ml/models/sentiment_model.pkl` and `tfidf_vectorizer.pkl`.

### Phase 2: Implement the Flask Server Runner
Create `backend/app.py` with the following implementation:
```python
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add routes and ML source to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, "routes"))
sys.path.append(os.path.join(BASE_DIR, "ml", "src"))

from analyze import analyze_bp
from upload import upload_bp

app = Flask(__name__)
CORS(app) # Allow React frontend cross-origin requests

# Register blueprints
app.register_blueprint(analyze_bp)
app.register_blueprint(upload_bp)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "project": "SentimentScope"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
```

### Phase 3: Scaffolding the React Frontend
1. Run Vite inside the `frontend/` directory to initialize a React template:
   ```bash
   npm create vite@latest . -- --template react
   npm install
   ```
2. Install necessary UI and charting packages:
   ```bash
   npm install lucide-react recharts axios
   ```
3. Establish an elegant CSS design system in `index.css` supporting light and dark modes with a modern glassmorphism aesthetic.
4. Implement the sidebar shell component containing navigation tabs: Dashboard, Review Analyzer, Product Insights, Categories, Upload CSV, and Reports.
5. Connect `Upload CSV` to `http://localhost:5000/upload` using `axios`. Upon a successful upload, store the returned `dashboard` JSON data object in the React state.
6. Build out the dashboard sub-components:
   * Render `total_reviews`, `total_products`, and positive/neutral/negative counts into animated KPI cards.
   * Render `sentiment_summary` into a Recharts Pie Chart.
   * Render `issue_summary` and `positive_features_summary` into horizontal Bar Charts.
   * Render `category_summary` into a pie or donut chart.
   * Render `top_products` and `recent_negative_reviews` into scrollable data tables.
7. Connect the `Review Analyzer` interactive sandbox page to the `http://localhost:5000/analyze` endpoint. Enable real-time analysis of single string sentences, rendering color-coded sentiment badges and tags for extracted complaints and strengths.
