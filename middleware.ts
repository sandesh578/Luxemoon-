import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── ADMIN AUTH ──────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Skip login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const cookie = request.cookies.get('session')?.value;

    if (!cookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await decrypt(cookie);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/admin/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('session');
      return redirectResponse;
    }
  }

  // ─── USER AUTH (account pages) ───────────────
  if (pathname.startsWith('/account')) {
    const cookie = request.cookies.get('user-session')?.value;

    if (!cookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await decrypt(cookie);
      if (payload.role !== 'user') {
        throw new Error('Invalid role');
      }
      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete('user-session');
      return redirectResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};