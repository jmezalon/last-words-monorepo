// Environment variable validation and fallbacks
export const env = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'fallback-secret-for-development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  WEBAUTHN_ORIGIN: process.env.WEBAUTHN_ORIGIN,
  WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  AUTH_DISABLE_ADAPTER: process.env.AUTH_DISABLE_ADAPTER,
  ENABLE_APPLE: process.env.ENABLE_APPLE,
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
} as const;

// Validate required environment variables
export function validateEnv() {
  const required = ['NEXTAUTH_SECRET'];
  const missing = required.filter(key => !env[key as keyof typeof env]);

  if (missing.length > 0) {
    console.warn(
      `Missing required environment variables: ${missing.join(', ')}`
    );
    return false;
  }

  return true;
}
