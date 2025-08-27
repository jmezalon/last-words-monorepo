import NextAuth from 'next-auth';

import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ensure host header checks don't break behind proxies (Amplify/CloudFront)
const handler = NextAuth({ ...(authOptions as any), trustHost: true });

export { handler as GET, handler as POST };
