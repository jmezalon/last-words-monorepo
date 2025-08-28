import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

import { getAuthOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ensure host header checks don't break behind proxies (Amplify/CloudFront)
let authOptions: NextAuthOptions;
try {
  authOptions = getAuthOptions();
} catch (error) {
  console.error('Failed to initialize auth options:', error);
  // Fallback configuration
  authOptions = {
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
    providers: [],
    session: { strategy: 'jwt' as const },
    pages: { signIn: '/auth/signin', error: '/auth/error' },
    debug: process.env.NODE_ENV === 'development',
  };
}

const handler = NextAuth({
  ...authOptions,
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
