import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Summarize options without executing NextAuth handler
    const providers = (authOptions.providers || []) as any[];
    const names = providers.map((p: any) => p?.name || p?.id || 'unknown');
    const hasAdapter = Boolean((authOptions as any).adapter);
    return NextResponse.json({
      ok: true,
      providers: names,
      count: names.length,
      hasAdapter,
      secretSet: Boolean((authOptions as any).secret),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
