/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@last-words/shared'],
  experimental: {
    // Make critical server/edge env vars available at runtime
    runtimeEnv: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN,
      WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      AUTH_DISABLE_ADAPTER: process.env.AUTH_DISABLE_ADAPTER,
      ENABLE_APPLE: process.env.ENABLE_APPLE,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  },
  // Add webpack configuration to resolve path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
  // Add proper error handling for Amplify
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Ensure proper static generation
  output: 'standalone',
  // Add proper headers for Amplify
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
