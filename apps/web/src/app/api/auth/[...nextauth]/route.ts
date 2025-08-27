import NextAuth from 'next-auth';

import { getAuthOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ensure host header checks don't break behind proxies (Amplify/CloudFront)
const handler = NextAuth({ ...(getAuthOptions() as any), trustHost: true });

export { handler as GET, handler as POST };
