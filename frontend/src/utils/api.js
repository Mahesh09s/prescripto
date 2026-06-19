import axios from 'axios';

/**
 * Axios instance for all API calls.
 *
 * In development:  Vite proxies /api → http://localhost:5000 (via vite.config.js).
 * In production:   VITE_API_URL must be set on Vercel to the Render backend URL,
 *                  e.g. https://prescripto-backend.onrender.com/api
 *
 * The env var takes precedence; /api is the local-dev fallback.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Warn clearly if running in production without the required env var
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error(
    '[Prescripto] ⚠️  VITE_API_URL is not set!\n' +
    'All API calls will fail in production.\n' +
    'Set VITE_API_URL=https://your-render-backend.onrender.com/api in Vercel environment variables.'
  );
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 s — Render free tier can have cold-start latency up to ~20s
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT from localStorage ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');

      // Redirect to login only if not already there (prevent redirect loops)
      // Also avoid redirecting for the login endpoint itself (wrong credentials)
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/login') || url.includes('/register') || url.includes('/google-auth');
      if (!isAuthEndpoint && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
