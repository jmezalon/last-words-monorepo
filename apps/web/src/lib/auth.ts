import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  } else {
    console.warn(
      'Google provider missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET'
    );
  }

  // Apple requires ES256; opt-in with ENABLE_APPLE=true
  const {
    APPLE_ID,
    APPLE_TEAM_ID,
    APPLE_PRIVATE_KEY,
    APPLE_KEY_ID,
    ENABLE_APPLE,
  } = process.env;

  if (
    ENABLE_APPLE === 'true' &&
    APPLE_ID &&
    APPLE_TEAM_ID &&
    APPLE_PRIVATE_KEY &&
    APPLE_KEY_ID
  ) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const appleClientSecret = jwt.sign(
        {
          iss: APPLE_TEAM_ID,
          iat: now,
          exp: now + 60 * 60 * 24 * 180,
          aud: 'https://appleid.apple.com',
          sub: APPLE_ID,
        },
        (APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        { algorithm: 'ES256', keyid: APPLE_KEY_ID }
      );
      providers.push(
        AppleProvider({ clientId: APPLE_ID, clientSecret: appleClientSecret })
      );
    } catch (e) {
      console.warn('Failed to configure Apple provider:', e);
    }
  } else {
    console.warn(
      'Apple provider disabled or env vars incomplete; skipping Apple provider'
    );
  }

  const baseOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
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
