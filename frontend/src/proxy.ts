import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin'];
// Public routes (no auth needed)
const PUBLIC_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for a Firebase session cookie (set by AuthContext on sign-in)
  const sessionCookie = request.cookies.get('vitalis_session')?.value;
  const isAuthenticated = !!sessionCookie;

  // Redirect authenticated users away from auth pages → dashboard
  if (isAuthenticated && PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected pages → login
  if (!isAuthenticated && PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
