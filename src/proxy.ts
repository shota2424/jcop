// ============================================================
// JCOP v4.0 - Auth Proxy (Next.js 16, Node.js runtime)
// ============================================================
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';

// API routes accessible without Google auth (used by LIFF and GAS scripts)
const PUBLIC_API_ROUTES = [
  '/api/events',       // LIFF: event list for attendance form
  '/api/attendances',  // LIFF: submit attendance from LINE
  '/api/ai/parse-text', // GAS: LINE webhook AI parsing
];

export const proxy = auth((req: NextAuthRequest) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const isLoginPage = nextUrl.pathname === '/login';
  const isApiRoute = nextUrl.pathname.startsWith('/api');
  const isLiffRoute = nextUrl.pathname.startsWith('/liff');

  // Allow LIFF routes without Google auth (LINE auth is used instead)
  if (isLiffRoute) return NextResponse.next();

  // Allow auth API routes
  if (nextUrl.pathname.startsWith('/api/auth')) return NextResponse.next();

  // Allow public API routes (LIFF + GAS)
  if (PUBLIC_API_ROUTES.includes(nextUrl.pathname)) return NextResponse.next();

  // API routes: return 401 JSON (not redirect)
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Redirect authenticated users away from login
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
