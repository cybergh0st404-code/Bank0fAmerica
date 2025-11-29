import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  const userRole = JSON.parse(request.cookies.get('user')?.value || '{}').role;

  // Handle website closed for non-admins. This now acts as the global access restriction.
  let websiteIsOpen = true; // Default to true
  try {
    // Use a fetch request to the API route. This allows revalidation to work correctly.
    // The cache-busting parameter and headers are included as a fallback for stubborn caches.
    const cacheBusterUrl = new URL(`/api/website-status?_=${Date.now()}`, request.url);
    const websiteStatusRes = await fetch(cacheBusterUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    if (websiteStatusRes.ok) {
      const statusData = await websiteStatusRes.json();
      websiteIsOpen = statusData.isOpen;
    } else {
      console.error('Failed to fetch website status from API:', websiteStatusRes.status);
    }
  } catch (error) {
    console.error('Error fetching website status in middleware:', error);
  }

  // If website is closed and the user is not an admin, redirect them to the 404 page.
  // Admins can always access the site.
  if (!websiteIsOpen && userRole !== 'admin') {
    if (pathname !== '/404') { // Allow access to 404 page itself
      return NextResponse.redirect(new URL('/404', request.url));
    }
  } else if (pathname === '/404' && (websiteIsOpen || userRole === 'admin')) {
    // If the website is open, or if an admin tries to access the 404 page, redirect them to the home page.
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect authenticated users from login/landing
  if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL(userRole === 'admin' ? '/admin' : '/dashboard', request.url));
  }

  // Protect dashboard and other user pages
  if (['/dashboard', '/transfer', '/transactions', '/settings'].includes(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect admin pages
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated || userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
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
     * - /api/auth (authentication API routes)
     * - /api/website-status (public API for website status)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/website-status).*)',
  ],
};
