import NextAuth from 'next-auth';

import { getAuthOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ensure host header checks don't break behind proxies (Amplify/CloudFront)
const authOptions = getAuthOptions();
const handler = NextAuth({
  ...authOptions,
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
