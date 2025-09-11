/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@last-words/shared'],
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN,
    WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'true',
    AUTH_DISABLE_ADAPTER: process.env.AUTH_DISABLE_ADAPTER,
    ENABLE_APPLE: process.env.ENABLE_APPLE,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Add webpack configuration to resolve path aliases and handle WebAssembly
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    // Enable WebAssembly support for argon2-browser
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
  // Add proper error handling for Amplify
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Ensure proper static generation
  output: 'standalone',
  // Comprehensive security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Strict Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "connect-src 'self' https://api.stripe.com https://checkout.stripe.com wss: https:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "manifest-src 'self'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
          // HTTP Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Cross-Origin Embedder Policy
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          // Cross-Origin Opener Policy
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Cross-Origin Resource Policy
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // X-Frame-Options (backup for older browsers)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-Content-Type-Options
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-DNS-Prefetch-Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          // X-Download-Options
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          // X-Permitted-Cross-Domain-Policies
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()',
              'payment=(self)',
              'usb=()',
              'bluetooth=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()',
              'ambient-light-sensor=()',
              'autoplay=(self)',
            ].join(', '),
          },
        ],
      },
      // API routes with relaxed CSP for server-side operations
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
