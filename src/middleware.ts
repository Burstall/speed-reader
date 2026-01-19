import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page and auth API
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for valid session
  const sessionCookie = request.cookies.get('sr_session');

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isValid = await validateSessionToken(sessionCookie.value);

  if (!isValid) {
    // Clear invalid session and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sr_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
