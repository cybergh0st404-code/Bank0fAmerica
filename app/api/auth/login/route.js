import { findUserByEmail, getBankData, saveBankData } from '../../../../lib/db.js';
import {
  verifyPassword,
  hashPassword,
  isPasswordHashed,
  createSessionToken,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  getClientIp,
  verifyTwoFactorCode,
  hashTwoFactorCode,
  getAdminSecretSlug,
  createTwoFactorChallenge,
  verifyTwoFactorChallenge,
} from '../../../../lib/security.js';

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
    const clientIp = getClientIp(request);
    const body = await request.json();
    const { email, password, twoFactorCode, adminSlug, twoFactorTicket } = body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ message: 'Invalid payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // -------------------------------------------------------------------------
    // Rate Limiting Checks (5 attempts per 15 minutes window)
    // -------------------------------------------------------------------------
    const ipRate = checkRateLimit(`ip:${clientIp}`, 5, 15 * 60 * 1000);
    if (!ipRate.allowed) {
      return new Response(
        JSON.stringify({
          message: `Too many failed attempts from your network. Please try again in ${Math.ceil(ipRate.retryAfterSeconds / 60)} minute(s).`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(ipRate.retryAfterSeconds),
          },
        }
      );
    }

    if (normalizedEmail) {
      const accountRate = checkRateLimit(`account:${normalizedEmail}`, 5, 15 * 60 * 1000);
      if (!accountRate.allowed) {
        return new Response(
          JSON.stringify({
            message: `Account is temporarily locked due to repeated failed attempts. Please try again in ${Math.ceil(accountRate.retryAfterSeconds / 60)} minute(s).`,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(accountRate.retryAfterSeconds),
            },
          }
        );
      }
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || getEnvVar('ADMIN_EMAIL');
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || getEnvVar('ADMIN_PASSWORD');
    // Admin slug must be explicitly configured in environment; no hardcoded fallback
    const configuredSlug = getAdminSecretSlug() || getEnvVar('ADMIN_SECRET_SLUG') || null;
    const isProd = process.env.NODE_ENV === 'production';

    // -------------------------------------------------------------------------
    // Environment Admin Credentials Flow
    // -------------------------------------------------------------------------
    if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      const isPassValid = await verifyPassword(password, ADMIN_PASSWORD);
      if (!configuredSlug || !adminSlug || adminSlug !== configuredSlug || !isPassValid) {
        recordFailedAttempt(`ip:${clientIp}`);
        recordFailedAttempt(`account:${normalizedEmail}`);
        return new Response(JSON.stringify({ message: 'Invalid credentials.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Successful login clears rate limits
      clearRateLimit(`ip:${clientIp}`);
      clearRateLimit(`account:${normalizedEmail}`);

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

    // -------------------------------------------------------------------------
    // Dynamic Database User Flow
    // -------------------------------------------------------------------------
    const dbUser = await findUserByEmail(email);

    if (dbUser) {
      const isPassValid = await verifyPassword(password, dbUser.password);
      if (!isPassValid) {
        recordFailedAttempt(`ip:${clientIp}`);
        recordFailedAttempt(`account:${normalizedEmail}`);
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
        if (!configuredSlug || !adminSlug || adminSlug !== configuredSlug) {
          recordFailedAttempt(`ip:${clientIp}`);
          recordFailedAttempt(`account:${normalizedEmail}`);
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

      // -----------------------------------------------------------------------
      // Two-Factor Authentication Step
      // -----------------------------------------------------------------------
      if (dbUser.twoFactorCode) {
        // Step 1: User hasn't supplied 2FA code yet -> Issue short-lived challenge
        if (!twoFactorCode) {
          const challengeTicket = await createTwoFactorChallenge(dbUser.id, dbUser.email, dbUser.twoFactorCode);
          return new Response(
            JSON.stringify({
              require2fa: true,
              twoFactorTicket: challengeTicket,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        // Step 2: Validate 2FA code (strictly without static bypass codes)
        let isCodeValid = false;

        // Verify against challenge ticket if provided
        if (twoFactorTicket) {
          const ticketRes = await verifyTwoFactorChallenge(twoFactorTicket, twoFactorCode);
          if (ticketRes.valid && ticketRes.payload?.userId === dbUser.id) {
            isCodeValid = true;
          }
        }

        // Direct verification against user's stored 2FA code (hashed or legacy plaintext)
        if (!isCodeValid) {
          isCodeValid = await verifyTwoFactorCode(twoFactorCode, dbUser.twoFactorCode);
        }

        if (!isCodeValid) {
          recordFailedAttempt(`ip:${clientIp}`);
          recordFailedAttempt(`account:${normalizedEmail}`);
          return new Response(JSON.stringify({ message: 'Invalid two-factor code.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Transparently upgrade legacy plaintext 2FA code in DB to PBKDF2 hash
        if (!isPasswordHashed(dbUser.twoFactorCode)) {
          try {
            const data = await getBankData();
            const uIdx = (data.users || []).findIndex((u) => u.id === dbUser.id);
            if (uIdx !== -1) {
              data.users[uIdx].twoFactorCode = await hashTwoFactorCode(twoFactorCode);
              await saveBankData(data);
            }
          } catch (upgradeErr) {
            console.error('Error upgrading 2FA code hash:', upgradeErr);
          }
        }
      }

      // Successful login clears rate limits
      clearRateLimit(`ip:${clientIp}`);
      clearRateLimit(`account:${normalizedEmail}`);

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

    // Target user not found: record failed attempt
    recordFailedAttempt(`ip:${clientIp}`);
    if (normalizedEmail) {
      recordFailedAttempt(`account:${normalizedEmail}`);
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
