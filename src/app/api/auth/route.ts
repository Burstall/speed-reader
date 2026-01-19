import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateSessionToken } from '@/lib/auth';

const APP_PASSWORD = process.env.APP_PASSWORD || 'demo';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Simple password comparison (timing attacks less relevant for single-user personal app)
    if (password !== APP_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate session token
    const token = await generateSessionToken();

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('sr_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('sr_session');
  return NextResponse.json({ success: true });
}
