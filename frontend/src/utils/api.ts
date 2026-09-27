import axios from 'axios';

const isLanIp = (hostname: string) => {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.endsWith('.local');
};

/**
 * Robust API Base URL resolver with fail-safe fallbacks:
 * 1. If accessed via local numeric LAN IP (e.g. 192.168.x.x) -> use port 5000 on that LAN IP
 * 2. If NEXT_PUBLIC_API_URL is configured -> use it
 * 3. If running on public domain (e.g. Vercel) -> default to Render backend
 * 4. Localhost dev default -> http://localhost:5000/api
 */
export const getResolvedApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLanIp(host)) {
      const isHttps = window.location.protocol === 'https:';
      return `${isHttps ? 'https' : 'http'}://${host}:5000/api`;
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'https://note-on-web.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

/**
 * Robust WebSocket URL resolver with fail-safe fallbacks:
 */
export const getResolvedWsUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLanIp(host)) {
      const isHttps = window.location.protocol === 'https:';
      return `${isHttps ? 'https' : 'http'}://${host}:5000`;
    }
  }
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'https://note-on-web.onrender.com';
  }
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getResolvedApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = getResolvedApiUrl();
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
