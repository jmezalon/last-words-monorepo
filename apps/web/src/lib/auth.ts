import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

import { env, validateEnv } from './env';

// Initialize Prisma with error handling
let prisma: PrismaClient;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  // Fallback for when database is not available
  prisma = null as any;
}

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

  // Replace OAuth with simple email-only credentials login.
  // This issues a JWT session and creates the user record if needed.
  providers.push(
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: { email: { label: 'Email', type: 'email' } },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toString().trim().toLowerCase();
          if (!email) return null;

          if (!prisma) {
            console.error('Prisma client not available');
            return null;
          }

          const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: { email },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name || null,
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

  return process.env.AUTH_DISABLE_ADAPTER === 'true'
    ? baseOptions
    : {
        ...baseOptions,
        adapter: prisma ? (PrismaAdapter(prisma) as any) : undefined,
      };
}
