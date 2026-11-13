import { NextResponse } from 'next/server';
import { verifySessionToken, getAdminSecretSlug } from './lib/security.js';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Normalize /superadmin* (without hyphen) to /super-admin*
  if (pathname === '/superadmin' || pathname.startsWith('/superadmin/')) {
    const newPath = pathname.replace(/^\/superadmin/, '/super-admin');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Cryptographically verify session token (tamper-proof)
  const sessionToken = request.cookies.get('session_token')?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;
  const isAuthenticated = Boolean(session);
  const userRole = session?.role || null;

  // The secret super-admin slug (strictly from environment, no hardcoded fallbacks)
  const secretSlug = getAdminSecretSlug();

  // Redirect legacy /admin/[secretSlug]/* to /super-admin/[secretSlug]/login
  if (
    secretSlug &&
    (pathname === `/admin/${secretSlug}` || pathname === `/admin/${secretSlug}/login`)
  ) {
    return NextResponse.redirect(new URL(`/super-admin/${secretSlug}/login`, request.url));
  }

  const isSuperAdminLogin = Boolean(
    secretSlug &&
      (pathname === `/super-admin/${secretSlug}/login` || pathname === `/super-admin/${secretSlug}`)
  );
  const isRegularAdminLogin = pathname === '/admin/login';

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

  const isAdminRole = userRole === 'admin' || userRole === 'superadmin';

  // If website is closed and the user is not an admin, redirect them to 404.
  // Super Admin login and Admin login routes remain accessible so admins can log in.
  if (!websiteIsOpen && !isAdminRole) {
    if (pathname !== '/404' && !isSuperAdminLogin && !isRegularAdminLogin) {
      return NextResponse.redirect(new URL('/404', request.url));
    }
  }

  // Redirect authenticated superadmin away from login pages to /super-admin
  if (
    isAuthenticated &&
    userRole === 'superadmin' &&
    (pathname === '/login' || pathname === '/' || isSuperAdminLogin || isRegularAdminLogin)
  ) {
    return NextResponse.redirect(new URL('/super-admin', request.url));
  }

  // Redirect authenticated regular admin away from login pages to /admin
  if (
    isAuthenticated &&
    userRole === 'admin' &&
    (pathname === '/login' || pathname === '/' || isRegularAdminLogin)
  ) {
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
  if (
    [
      '/dashboard',
      '/transfer',
      '/transactions',
      '/cards',
      '/statements',
      '/wire-transfer',
      '/bill-pay',
      '/deposit',
      '/credit-score',
      '/security',
      '/messages',
      '/settings',
    ].includes(pathname)
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect all /super-admin routes (excluding the secret super-admin login route)
  if (pathname.startsWith('/super-admin') && !isSuperAdminLogin) {
    if (!isAuthenticated || userRole !== 'superadmin') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  // Protect all /admin routes (excluding /admin/login)
  if (pathname.startsWith('/admin') && !isRegularAdminLogin) {
    if (!isAuthenticated || !isAdminRole) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
    if (userRole === 'superadmin') {
      const targetPath = pathname.replace(/^\/admin/, '/super-admin');
      return NextResponse.redirect(new URL(targetPath, request.url));
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
