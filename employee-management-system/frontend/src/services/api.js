import axios from 'axios';

// Normalize base URL so trailing slashes or missing /api never cause 404s
let rawUrl = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
if (!rawUrl.endsWith('/api') && rawUrl.startsWith('http')) {
  rawUrl += '/api';
}

const api = axios.create({
  baseURL: rawUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach Bearer token and Google Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const directGoogleToken = localStorage.getItem('google_access_token');
    let googleToken = directGoogleToken;
    if (!googleToken) {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          googleToken = u.googleAccessToken;
        } catch (_) {}
      }
    }
    if (googleToken) {
      config.headers['x-google-access-token'] = googleToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

