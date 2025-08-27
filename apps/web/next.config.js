/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@last-words/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
