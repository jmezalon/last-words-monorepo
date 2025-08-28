import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    // Show first few characters to verify it's the right value
    GOOGLE_CLIENT_ID_PREVIEW:
      process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
  });
}
