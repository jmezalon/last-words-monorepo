import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

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

  // Simple email-only credentials login without database dependency
  providers.push(
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: { email: { label: 'Email', type: 'email' } },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toString().trim().toLowerCase();
          if (!email) return null;

          // For deployed environment, use a simple approach without database
          // Generate a consistent user ID based on email
          const userId = `user_${Buffer.from(email).toString('base64').slice(0, 8)}`;

          return {
            id: userId,
            email: email,
            name: email.split('@')[0], // Use email prefix as name
          } as any;
        } catch (error) {
          console.error('Error in authorize function:', error);
          return null;
        }
      },
    })
  );

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

  // Disable adapter for deployed environment to avoid database issues
  return baseOptions;
}
