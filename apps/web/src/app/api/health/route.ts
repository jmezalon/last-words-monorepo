import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
      env: {
        NEXTAUTH_URL:
          process.env.NEXTAUTH_URL ||
          'NOT_SET (falling back to localhost:3000)',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
          ? 'SET'
          : 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV,
      },
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Check for issues
    if (
      !process.env.NEXTAUTH_URL ||
      process.env.NEXTAUTH_URL === 'http://localhost:3000'
    ) {
      healthData.issues.push('NEXTAUTH_URL is not set or is using localhost');
      healthData.recommendations.push(
        'Set NEXTAUTH_URL to your production domain (e.g., https://main.d3ste5u3f3aspp.amplifyapp.com)'
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      healthData.issues.push('Google OAuth credentials are not configured');
      healthData.recommendations.push(
        'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
      );
    }

    if (!process.env.NEXTAUTH_SECRET) {
      healthData.issues.push('NEXTAUTH_SECRET is not set');
      healthData.recommendations.push(
        'Set NEXTAUTH_SECRET to a secure random string'
      );
    }

    if (healthData.issues.length > 0) {
      healthData.status = 'needs_configuration';
    }

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
