/** @type {import('next').NextConfig} */
/* global process */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const apiBase =
      process.env.API_BASE_URL ||
      (isDev ? 'http://localhost:4000' : 'https://api-mausam.farhankhan.site');
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${apiBase}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
