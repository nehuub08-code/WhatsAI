import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('whatsai_api_url');
    if (saved) return saved;
    if (window.location.hostname.includes('github.io')) {
      return 'https://ktrtl-103-68-11-123.run.pinggy-free.link';
    }
  }
  return import.meta.env.VITE_API_URL || '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Pinggy-No-Screen': 'true',
    'bypass-tunnel-reminder': 'true',
  },
});

// Request interceptor to attach JWT token and ensure baseURL and bypass headers are fresh
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl();
    config.headers['X-Pinggy-No-Screen'] = 'true';
    config.headers['bypass-tunnel-reminder'] = 'true';
    const token = localStorage.getItem('whatsai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.hash.includes('login') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('whatsai_token');
        localStorage.removeItem('whatsai_admin');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
