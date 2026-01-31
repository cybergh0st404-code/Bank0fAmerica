export async function POST(request) {
  try {
    const { email, password, twoFactorCode } = await request.json();
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bankofamerica.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2024!Secure';
    const USER_EMAIL = process.env.DEFAULT_USER_EMAIL || 'user@bankofamerica.com';
    const USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'User@2024!Secure';
    const USER_2FA = process.env.DEFAULT_2FA_CODE || '123456';

    if (typeof email !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ message: 'Invalid payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user = { id: 'admin-1', name: 'Admin User', email, role: 'admin' };
      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (email === USER_EMAIL && password === USER_PASSWORD) {
      if (!twoFactorCode) {
        return new Response(JSON.stringify({ require2fa: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (twoFactorCode === USER_2FA) {
        const user = { id: 'user-1', name: 'James M Nelson', email, role: 'user' };
        return new Response(JSON.stringify({ user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Invalid two-factor code.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ message: 'Server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
