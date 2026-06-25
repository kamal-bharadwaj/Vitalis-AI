import { NextRequest, NextResponse } from 'next/server';

/**
 * Firebase Auth uses IndexedDB (client-side only), not cookies,
 * so server-side route protection based on cookies is not reliable.
 *
 * Auth protection is handled client-side in each page via useEffect:
 *   - /dashboard/page.tsx  → redirects to /login if not authenticated
 *   - /admin/page.tsx      → redirects to /dashboard if not admin
 *   - /login/page.tsx      → AuthContext.signIn redirects to /dashboard
 *
 * This proxy simply passes all requests through.
 */
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
