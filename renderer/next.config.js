// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/toolbar',
        destination: '/toolbar.html',
      },
    ];
  }
};

module.exports = nextConfig;