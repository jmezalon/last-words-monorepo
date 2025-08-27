import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { getAuthOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Simple token generation without JWT library
    const token = Buffer.from(
      JSON.stringify({
        sub: session.user.id,
        email: session.user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      })
    ).toString('base64');

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
