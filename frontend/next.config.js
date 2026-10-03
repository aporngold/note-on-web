const isProd = process.env.NODE_ENV === 'production';
const defaultApiUrl = isProd ? 'https://note-on-web.onrender.com/api' : 'http://localhost:5000/api';
const defaultWsUrl = isProd ? 'https://note-on-web.onrender.com' : 'http://localhost:5000';
const defaultRootApiUrl = isProd ? 'https://note-on-web.onrender.com' : 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || defaultApiUrl,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || defaultWsUrl,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || defaultRootApiUrl;
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

