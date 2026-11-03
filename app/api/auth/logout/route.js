import { verifyRequestOrigin } from '../../../../lib/security.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  const originCheck = verifyRequestOrigin(request);
  if (!originCheck.valid) {
    return new Response(JSON.stringify({ message: 'Forbidden: Invalid request origin.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const isProd = process.env.NODE_ENV === 'production';
  const clearSessionCookie = `session_token=; Path=/; HttpOnly; Max-Age=0; ${isProd ? 'Secure;' : ''}`;
  const clearAuthCookie = `isAuthenticated=; Path=/; Max-Age=0; ${isProd ? 'Secure;' : ''}`;
  const clearUserCookie = `user=; Path=/; Max-Age=0; ${isProd ? 'Secure;' : ''}`;

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
  });
  headers.append('Set-Cookie', clearSessionCookie);
  headers.append('Set-Cookie', clearAuthCookie);
  headers.append('Set-Cookie', clearUserCookie);

  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully.' }), {
    status: 200,
    headers,
  });
}
