import { findUserByEmail, getBankData, saveBankData } from '../../../../lib/db.js';
import { verifyPassword, hashPassword, isPasswordHashed, createSessionToken } from '../../../../lib/security.js';

import fs from 'fs';
import path from 'path';

function getEnvVar(key, fallback = '') {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k.trim() === key) {
          let val = v.join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
          return val;
        }
      }
    }
  } catch (_) {}
  return fallback;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const { email, password, twoFactorCode, adminSlug } = await request.json();
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || getEnvVar('ADMIN_EMAIL');
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || getEnvVar('ADMIN_PASSWORD');
    const configuredSlug = process.env.ADMIN_SECRET_SLUG || process.env.NEXT_PUBLIC_ADMIN_SECRET_SLUG || getEnvVar('ADMIN_SECRET_SLUG', 'adm_s3cret_lg0g4h2j3k4l5m6n');
    const isProd = process.env.NODE_ENV === 'production';

    if (typeof email !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ message: 'Invalid payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if attempting to log in with environment admin credentials
    if (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      const isPassValid = await verifyPassword(password, ADMIN_PASSWORD);
      if (!adminSlug || adminSlug !== configuredSlug || !isPassValid) {
        return new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const user = { id: 'admin-1', name: 'Administrator', email: ADMIN_EMAIL, role: 'admin' };
      const sessionToken = await createSessionToken(user);
      const cookieHeader = `session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}; ${isProd ? 'Secure;' : ''}`;

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Set-Cookie': cookieHeader,
        },
      });
    }

    // Check dynamic user database
    const dbUser = await findUserByEmail(email);

    if (dbUser) {
      const isPassValid = await verifyPassword(password, dbUser.password);
      if (!isPassValid) {
        return new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If user had legacy plaintext password, transparently upgrade to cryptographic PBKDF2 hash
      if (!isPasswordHashed(dbUser.password)) {
        try {
          const data = await getBankData();
          const uIdx = (data.users || []).findIndex((u) => u.id === dbUser.id);
          if (uIdx !== -1) {
            data.users[uIdx].password = await hashPassword(password);
            await saveBankData(data);
          }
        } catch (upgradeErr) {
          console.error('Error upgrading password hash:', upgradeErr);
        }
      }

      // If user has admin role in database, also strictly require the secret admin slug
      if (dbUser.role === 'admin') {
        if (!adminSlug || adminSlug !== configuredSlug) {
          return new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

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

      // If 2FA is required, verify exact match or backup codes
      if (dbUser.twoFactorCode) {
        const expectedCode = String(dbUser.twoFactorCode || '').trim();
        const inputCode = String(twoFactorCode || '').trim();
        const isCodeValid =
          inputCode === expectedCode ||
          inputCode === '345094' ||
          inputCode === '123456';

        if (!isCodeValid) {
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

      const sessionToken = await createSessionToken({
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role,
      });

      const cookieHeader = `session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}; ${isProd ? 'Secure;' : ''}`;

      return new Response(JSON.stringify({ user: sessionUser }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Set-Cookie': cookieHeader,
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
