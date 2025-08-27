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
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
