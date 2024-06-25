/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, path: false };
    }

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/toolbar',
        destination: '/toolbar.html',
      },
      {
        source: '/v1/:path*',
        destination: 'http://192.168.0.222/v1/:path*', // Proxy to backend
      },
    ];
  },
};

module.exports = nextConfig