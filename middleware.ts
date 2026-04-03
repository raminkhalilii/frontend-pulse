import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth';

// Routes that only unauthenticated users should access
const AUTH_ROUTES = ['/login', '/register'] as const;

// The landing page is publicly accessible — unauthenticated visitors should
// see it instead of being bounced straight to /login.
const LANDING_PATH = '/';

// /api/* paths are excluded from the matcher below and are proxied to the
// backend, which enforces its own JWT guard — no middleware check needed.

export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isLanding   = pathname === LANDING_PATH;

  // ── Unauthenticated ───────────────────────────────────────────────────────
  // Landing page and auth screens pass through freely.
  // Every other route requires a token → redirect to /login.
  if (!token) {
    if (isLanding || isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  // Authenticated users have no reason to view the landing page or auth
  // screens — send them directly to the dashboard.
  if (isLanding || isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run only on page routes.
  // Skips: Next.js internals, static assets, images, and all /api/* paths.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
};
