import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
// jwt import no longer used after removing OAuth providers

const prisma = new PrismaClient();

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
  const env = process.env as Record<string, string | undefined>;

  // Replace OAuth with simple email-only credentials login.
  // This issues a JWT session and creates the user record if needed.
  providers.push(
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: { email: { label: 'Email', type: 'email' } },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        if (!email) return null;
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
      },
    })
  );

  const baseOptions: NextAuthOptions = {
    // Read at runtime and fall back to JWT_SECRET if provided
    secret: env['NEXTAUTH_SECRET'] || env['JWT_SECRET'],
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
  };

  return process.env.AUTH_DISABLE_ADAPTER === 'true'
    ? baseOptions
    : { ...baseOptions, adapter: PrismaAdapter(prisma) as any };
}
