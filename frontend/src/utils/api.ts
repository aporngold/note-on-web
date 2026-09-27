import axios from 'axios';

const isLanIp = (hostname: string) => {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.endsWith('.local');
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Only use local LAN IP if accessed via private IP (e.g. 192.168.x.x)
    if (isLanIp(host)) {
      const isHttps = window.location.protocol === 'https:';
      return `${isHttps ? 'https' : 'http'}://${host}:5000/api`;
    }
  }
  // If explicit NEXT_PUBLIC_API_URL is configured (e.g. production on Vercel)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Only adjust baseURL dynamically if accessing via local LAN IP
    if (isLanIp(host)) {
      const isHttps = window.location.protocol === 'https:';
      config.baseURL = `${isHttps ? 'https' : 'http'}://${host}:5000/api`;
    }
    const token = localStorage.getItem('secure_note_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // If token expired or invalid, clear local auth
      const isAuthPath = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthPath) {
        localStorage.removeItem('secure_note_token');
        localStorage.removeItem('secure_note_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
