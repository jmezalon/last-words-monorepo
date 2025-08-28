import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testData = {
      status: 'testing_oauth',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      oauth_config: {
        client_id: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        auth_url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/api/auth/callback/google`)}&response_type=code&scope=openid%20email%20profile`,
      },
      recommendations: [] as string[],
    };

    // Check for common OAuth issues
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      testData.recommendations.push('Google OAuth credentials are not set');
    }

    if (!process.env.NEXTAUTH_URL) {
      testData.recommendations.push('NEXTAUTH_URL is not set');
    }

    if (
      process.env.NEXTAUTH_URL &&
      process.env.NEXTAUTH_URL.includes('localhost')
    ) {
      testData.recommendations.push(
        'NEXTAUTH_URL should be your production domain, not localhost'
      );
    }

    return NextResponse.json(testData, { status: 200 });
  } catch (error) {
    console.error('OAuth test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
