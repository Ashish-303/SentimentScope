import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE,
  timeout: 120000, // 2 min — large CSVs can take time
});


// ── Health ──────────────────────────────────────────────────
export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}

// ── Upload CSV ───────────────────────────────────────────────
export async function uploadCSV(file, onUploadProgress) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return data; // { status, filename, rows_processed, dashboard, review_data }
}

// ── Get Dashboard ────────────────────────────────────────────
export async function getDashboard() {
  const { data } = await api.get('/dashboard');
  return data; // { status, data: dashboard, review_data }
}

// ── Analyze single review ─────────────────────────────────────
export async function analyzeReview(reviewText) {
  const { data } = await api.post('/analyze', { review: reviewText });
  return data; // { status, data: { review, sentiment, issue, positive_features } }
}
