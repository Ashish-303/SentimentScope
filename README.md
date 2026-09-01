# SentimentScope 🔍

**AI Product Review Intelligence & Sentiment Analysis Platform**

SentimentScope is a modern, full-stack AI platform designed to convert unstructured e-commerce product reviews into actionable business intelligence. It combines an optimized NLP Machine Learning classifier with automated aspect mining algorithms to extract category-specific complaints, positive strengths, and customer sentiment analytics.

---

## ✨ Features

- **Batch CSV Analysis:** Upload customer review spreadsheets to analyze thousands of product reviews in seconds.
- **Single-Review Ingestion:** Instantly analyze individual review text to inspect sentiment scores and aspect highlights.
- **Aspect Mining & Complaint Extraction:** Automatically identifies product grievances (e.g., Quality, Packaging, Price, Service) and strengths (e.g., Performance, Usability).
- **Interactive Analytics Dashboard:** Real-time visualization of sentiment distributions, category ratings, and feedback trends using responsive Recharts widgets.
- **Dual Theme Support:** Toggle between **Dark Intelligence** mode and high-contrast **Light Research** mode.
- **RESTful API Gateway:** Clean Flask API backend serving lightweight JSON payloads.

---

## 🛠️ Technology Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
- **Backend:** Python 3.11+, Flask, Flask-CORS, Gunicorn
- **Machine Learning & NLP:** Scikit-learn (TF-IDF Vectorization + Logistic Regression), Pandas, NumPy, Joblib

---

## 🏗️ Project Architecture

```text
SentimentScope/
├── frontend/                 # React + Vite Client Application
│   ├── src/
│   │   ├── api/              # Axios API client hooks
│   │   ├── components/       # UI Cards, Sidebars, Drawers & Badges
│   │   ├── context/          # App & Theme state context
│   │   ├── pages/            # Dashboard views (Home, Analytics, Data, Highlights, About)
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json           # Vercel SPA Routing Configuration
│
├── backend/                  # Flask REST API Gateway & Inference Server
│   ├── app.py                # Main Flask entry point
│   ├── config.py             # Path & runtime configuration manager
│   ├── routes/               # API route blueprints (/upload, /analyze, /dashboard)
│   ├── ml/
│   │   ├── models/           # Production trained ML model (.pkl)
│   │   ├── data/             # Runtime sample datasets
│   │   └── src/              # Preprocessing, predictors & aspect detectors
│   ├── requirements.txt
│   └── Procfile              # Render production startup configuration
│
├── README.md
├── LICENSE
├── render.yaml               # Render Infrastructure-as-Code spec
├── vercel.json               # Monorepo Vercel routing configuration
└── requirements.txt          # Root Python dependencies
```

---

## 📋 Required CSV Format

When uploading datasets for batch processing, the CSV file must contain the following header columns:

```csv
product_title,category,review_text
Wireless Headphones,Electronics,The sound quality is crisp and battery life is impressive.
Smart Watch,Electronics,Strap broke after two days of light use. Poor durability.
Running Shoes,Footwear,Extremely comfortable for daily workouts and great arch support.
```

- **`product_title`**: Name of the product (String)
- **`category`**: Product domain (e.g., Electronics, Footwear, Clothing) (String)
- **`review_text`**: Raw customer review sentence (String)

---

## ⚙️ Local Installation & Execution

### Prerequisites

- **Node.js** (v18.0 or higher) & `npm`
- **Python** (v3.10 or higher) & `pip`

---

### 1. Backend Setup (Flask Server)

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run the Flask backend server
python app.py
```

The Flask backend will start at `http://localhost:5000`. You can test API health by navigating to `http://localhost:5000/health`.

---

### 2. Frontend Setup (React Client)

```bash
# Navigate to the frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```

The React frontend will start at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🌐 Environment Variables

Copy `.env.example` to `.env` in your project root or configure the variables in your hosting provider's dashboard:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Render Backend API URL (Frontend) | `https://sentimentscope-backend.onrender.com` |
| `PORT` | Backend server port | `5000` |
| `SECRET_KEY` | Flask session secret key | `your_production_secret_key` |
| `LOG_LEVEL` | Application logging verbosity | `INFO` |

---

## 🚀 Deployment Instructions

### Deploying Frontend to Vercel

1. Push your repository to **GitHub**.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `SentimentScope` GitHub repository.
4. Configure the project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   - Key: `VITE_API_URL`
   - Value: `https://<your-render-backend-url>.onrender.com`
6. Click **Deploy**.

---

### Deploying Backend to Render

1. Log in to [Render](https://render.com/) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your `SentimentScope` GitHub repository.
3. Configure the web service:
   - **Name:** `sentimentscope-backend`
   - **Root Directory:** `backend` (or leave blank if using root `Procfile`)
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app` (or `gunicorn --chdir backend app:app`)
4. Under **Advanced**, add Environment Variables (`PORT` = `5000`, `LOG_LEVEL` = `INFO`).
5. Click **Create Web Service**.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.