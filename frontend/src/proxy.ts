import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin'];
// Routes only admins can access
const ADMIN_ROUTES = ['/admin'];
// Public routes (no auth needed)
const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if there is a cached Firebase user in cookies
  // Firebase sets __session or we can check our own cookie
  const sessionCookie = request.cookies.get('vitalis_session')?.value;
  const isAuthenticated = !!sessionCookie;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected pages
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
