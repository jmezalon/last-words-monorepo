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

  // Add Google OAuth provider
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      })
    );
  } else {
    console.warn(
      'Google OAuth credentials not found. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    );
  }

  const baseOptions: NextAuthOptions = {
    secret: env.NEXTAUTH_SECRET,
    providers,
    session: { strategy: 'jwt' },
    callbacks: {
      async jwt({ token, user }: { token: any; user: any }) {
        if (user) token.id = user.id;
        return token;
      },
      async session({ session, token }: { session: any; token: any }) {
        if (token && session.user) session.user.id = token.id as string;
        return session;
      },
    },
    pages: { signIn: '/auth/signin', error: '/auth/error' },
    debug: env.isDevelopment,
  };

  return baseOptions;
}
