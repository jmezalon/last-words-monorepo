/* eslint-disable security/detect-object-injection */
import { NextResponse } from 'next/server';

export async function GET() {
  const keys = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL',
    'WEBAUTHN_ORIGIN',
    'WEBAUTHN_RP_ID',
    'AUTH_TRUST_HOST',
  ] as const;

  const present = Object.fromEntries(
    keys.map(k => [k, Boolean(process.env[k])])
  ) as Record<string, boolean>;

  return NextResponse.json({
    present,
    runtime: process.env.NEXT_RUNTIME || 'node',
    nodeEnv: process.env.NODE_ENV,
  });
}
