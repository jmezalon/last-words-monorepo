import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Generate Apple client secret JWT
function generateAppleClientSecret() {
  // Skip during build time when env vars aren't available
  if (!process.env.APPLE_PRIVATE_KEY || !process.env.APPLE_TEAM_ID || !process.env.APPLE_ID || !process.env.APPLE_KEY_ID) {
    return 'build-time-placeholder'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 86400 * 180, // 180 days
    aud: "https://appleid.apple.com",
    sub: process.env.APPLE_ID,
  }

  return jwt.sign(payload, process.env.APPLE_PRIVATE_KEY!, {
    algorithm: "ES256",
    header: {
      alg: "ES256",
      kid: process.env.APPLE_KEY_ID,
    },
  })
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: generateAppleClientSecret(),
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
