import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth';

const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isRoot = pathname === '/';

  // Unauthenticated user hitting a protected route → login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated user hitting login/register/root → dashboard
  if (token && (isPublic || isRoot)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on page routes only — skip Next.js internals, static files, and API proxy routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
