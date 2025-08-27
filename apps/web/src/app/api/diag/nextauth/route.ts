import { NextResponse } from 'next/server';

import { getAuthOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Summarize options without executing NextAuth handler
    const options = getAuthOptions();
    const providers = (options.providers || []) as any[];
    const names = providers.map((p: any) => p?.name || p?.id || 'unknown');
    const hasAdapter = Boolean((options as any).adapter);
    return NextResponse.json({
      ok: true,
      providers: names,
      count: names.length,
      hasAdapter,
      secretSet: Boolean((options as any).secret),
      // Raw env visibility snapshot from this runtime context
      env: {
        GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
        GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
        ENABLE_APPLE: process.env.ENABLE_APPLE || undefined,
        AUTH_DISABLE_ADAPTER: process.env.AUTH_DISABLE_ADAPTER || undefined,
        NODE_ENV: process.env.NODE_ENV,
        NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
