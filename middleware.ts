import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin Auth Check — skip login page
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

export const config = {
  matcher: ['/admin/:path*'],
};