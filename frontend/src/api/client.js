import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('whatsai_api_url');
    if (saved) return saved;
    if (window.location.hostname.includes('github.io')) {
      return 'https://exjvd-103-68-11-123.free.pinggy.net';
    }
  }
  return import.meta.env.VITE_API_URL || '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
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
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('whatsai_token');
        localStorage.removeItem('whatsai_admin');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
