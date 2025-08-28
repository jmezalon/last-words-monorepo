import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { env, validateEnv } from './env';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Build options at runtime to avoid build-time env snapshotting
export function getAuthOptions(): NextAuthOptions {
  const providers = [] as any[];

  // Validate environment variables
  validateEnv();

  // Debug environment variables (in all environments for troubleshooting)
  console.log('Auth Configuration Debug:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- NEXTAUTH_URL:', env.NEXTAUTH_URL);
  console.log('- NEXTAUTH_SECRET:', env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
  console.log('- Raw GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  console.log(
    '- Raw GOOGLE_CLIENT_SECRET:',
    process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
  );
  console.log(
    '- env.GOOGLE_CLIENT_ID:',
    env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
  );
  console.log(
    '- env.GOOGLE_CLIENT_SECRET:',
    env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
  );

  // Add Google OAuth provider
  console.log('Checking Google OAuth conditions:');
  console.log('- env.GOOGLE_CLIENT_ID exists:', !!env.GOOGLE_CLIENT_ID);
  console.log('- env.GOOGLE_CLIENT_SECRET exists:', !!env.GOOGLE_CLIENT_SECRET);
  console.log(
    '- Both conditions met:',
    !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  );

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      })
    );
    console.log('✅ Google OAuth provider configured successfully');
    console.log('- Providers array length:', providers.length);
  } else {
    console.error('❌ Google OAuth credentials not found:');
    console.error(
      '- GOOGLE_CLIENT_ID:',
      env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'
    );
    console.error(
      '- GOOGLE_CLIENT_SECRET:',
      env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
    );
    console.error(
      'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    );
  }

  // If no providers are configured, use a fallback provider to prevent crashes
  if (providers.length === 0) {
    console.warn('⚠️ No OAuth providers configured, using fallback provider');
    // Add a simple fallback provider that always fails gracefully
    providers.push({
      id: 'fallback',
      name: 'Fallback',
      type: 'credentials',
      credentials: {},
      async authorize() {
        return null; // Always return null to indicate failure
      },
    });
  }

  const baseOptions: NextAuthOptions = {
    secret: env.NEXTAUTH_SECRET,
    providers,
    session: { strategy: 'jwt' },
    useSecureCookies: env.isProduction,
    callbacks: {
      async jwt({ token, user }: { token: any; user: any }) {
        if (user) token.id = user.id;
        return token;
      },
      async session({ session, token }: { session: any; token: any }) {
        if (token && session.user) session.user.id = token.id as string;
        return session;
      },
      async redirect({ url, baseUrl }) {
        // Force production URL for redirects
        const productionUrl = 'https://main.d3ste5u3f3aspp.amplifyapp.com';
        if (env.isProduction) {
          if (url.startsWith('/')) return `${productionUrl}${url}`;
          if (url.startsWith(productionUrl)) return url;
          return productionUrl;
        }
        // Development behavior
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      },
    },
    pages: { signIn: '/auth/signin', error: '/auth/error' },
    debug: env.isDevelopment,
  };

  return baseOptions;
}
