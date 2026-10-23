/**
 * Performance Service for SentimentScope.
 * 
 * Fetches product performance intelligence, dataset listings, and
 * manages dataset switching.
 */

import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE,
  timeout: 120000,
});

/**
 * Fetches calculated performance aggregates from the backend API.
 */
export async function getPerformanceData(params = {}) {
  const { data } = await api.get('/api/performance', { params });
  return data; // { status, data: { kpis, top_products, ... } }
}

/**
 * Lists genuinely available CSV datasets on the server.
 */
export async function getAvailableDatasets() {
  const { data } = await api.get('/api/performance/datasets');
  return data; // { status, datasets: [...] }
}
