import { findUserByEmail } from '../../../../lib/db.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { email, password, twoFactorCode } = await request.json();
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ message: 'Invalid payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check admin credentials if configured in environment
    if (ADMIN_EMAIL && ADMIN_PASSWORD && email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      const user = { id: 'admin-1', name: 'Administrator', email: ADMIN_EMAIL, role: 'admin' };
      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check dynamic user database
    const dbUser = await findUserByEmail(email);

    if (dbUser && dbUser.password === password) {
      if (dbUser.status === 'flagged') {
        return new Response(JSON.stringify({ message: 'Account is restricted. Contact support.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If user has a 2FA code configured and none was provided yet in this request
      if (dbUser.twoFactorCode && !twoFactorCode) {
        return new Response(JSON.stringify({ require2fa: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If 2FA is required, verify exact match
      if (dbUser.twoFactorCode) {
        if (twoFactorCode !== dbUser.twoFactorCode) {
          return new Response(JSON.stringify({ message: 'Invalid two-factor code.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      const sessionUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role || 'user',
        allowedPages: dbUser.allowedPages || null,
        notice: dbUser.notice || null,
      };

      return new Response(JSON.stringify({ user: sessionUser }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      });
    }

    return new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ message: 'Server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
