/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api-mausam.farhankhan.site/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'https://api-mausam.farhankhan.site/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
