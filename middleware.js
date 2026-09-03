import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  let userRole = null;
  try {
    userRole = JSON.parse(request.cookies.get('user')?.value || '{}').role;
  } catch (_) {
    userRole = null;
  }

  // The secret admin slug
  const secretSlug = process.env.ADMIN_SECRET_SLUG || 'adm_s3cret_lg0g4h2j3k4l5m6n';
  const isAdminLogin = pathname === `/admin/${secretSlug}/login`;

  // Explicitly block /admin/login and redirect to 404
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/404', request.url));
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

  // Protect dashboard and other user pages
  if (['/dashboard', '/transfer', '/transactions', '/cards', '/statements', '/wire-transfer', '/bill-pay', '/deposit', '/credit-score', '/security', '/messages', '/settings'].includes(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect all /admin routes (excluding the secret admin login route)
  // If not authenticated as admin, redirect to 404 (pretend the route doesn't exist)
  if (pathname.startsWith('/admin') && !isAdminLogin) {
    if (!isAuthenticated || userRole !== 'admin') {
      return NextResponse.redirect(new URL('/404', request.url));
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
