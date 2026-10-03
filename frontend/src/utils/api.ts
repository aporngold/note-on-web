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
    // If running on public domain (e.g. Vercel), ALWAYS prioritize production backend over localhost env!
    if (!['localhost', '127.0.0.1'].includes(host)) {
      if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
      return 'https://note-on-web.onrender.com/api';
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:5000/api';
};

/**
 * Robust Root Backend URL resolver (e.g. https://note-on-web.onrender.com or http://localhost:5000)
 * Safely strips trailing /api so uploads/audio/static files resolve correctly on Vercel
 */
export const getResolvedBackendUrl = (): string => {
  return getResolvedApiUrl().replace(/\/api\/?$/, '');
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
    // If running on public domain (e.g. Vercel), ALWAYS prioritize production backend over localhost env!
    if (!['localhost', '127.0.0.1'].includes(host)) {
      if (process.env.NEXT_PUBLIC_WS_URL && !process.env.NEXT_PUBLIC_WS_URL.includes('localhost')) {
        return process.env.NEXT_PUBLIC_WS_URL;
      }
      return 'https://note-on-web.onrender.com';
    }
  }
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
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
