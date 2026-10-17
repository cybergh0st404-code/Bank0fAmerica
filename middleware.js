import { NextResponse } from 'next/server';
import { verifySessionToken, getAdminSecretSlug } from './lib/security.js';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Cryptographically verify session token (tamper-proof)
  const sessionToken = request.cookies.get('session_token')?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;
  const isAuthenticated = Boolean(session);
  const userRole = session?.role || null;

  // The secret admin slug (strictly from environment, no hardcoded fallbacks)
  const secretSlug = getAdminSecretSlug();
  const isAdminLogin = Boolean(secretSlug && pathname === `/admin/${secretSlug}/login`);

  // Explicitly block /admin/login and rewrite to 404
  if (pathname === '/admin/login') {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // Fetch live website status from the status API
  let websiteIsOpen = true;
  try {
    const statusRes = await fetch(new URL('/api/website-status', request.url), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (typeof statusData.isOpen === 'boolean') {
        websiteIsOpen = statusData.isOpen;
      }
    }
  } catch (_) {
    const websiteCookie = request.cookies.get('websiteIsOpen')?.value;
    websiteIsOpen = websiteCookie === undefined ? true : websiteCookie === 'true';
  }

  // If website is closed and the user is not an admin, redirect them to 404.
  // Admins can always access the site, and the secret admin login route is allowed.
  if (!websiteIsOpen && userRole !== 'admin') {
    if (pathname !== '/404' && !isAdminLogin) {
      return NextResponse.redirect(new URL('/404', request.url));
    }
  }

  // Redirect authenticated admin users away from login pages to the admin dashboard
  if (isAuthenticated && userRole === 'admin' && (pathname === '/login' || pathname === '/' || isAdminLogin)) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Redirect authenticated regular users from login/landing
  if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated visitors from root directly to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect dashboard and other user pages
  if (['/dashboard', '/transfer', '/transactions', '/cards', '/statements', '/wire-transfer', '/bill-pay', '/deposit', '/credit-score', '/security', '/messages', '/settings'].includes(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect all /admin routes (excluding the secret admin login route)
  // If not authenticated as admin, rewrite to 404 (pretend the route doesn't exist)
  if (pathname.startsWith('/admin') && !isAdminLogin) {
    if (!isAuthenticated || userRole !== 'admin') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
