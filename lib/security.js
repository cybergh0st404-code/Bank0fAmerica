// Cryptographic Security & Authentication Utilities
// Provides PBKDF2 password hashing with salt, HMAC-SHA256 session tokens, rate limiting, and request authorization guards.

export function getSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim()) {
    return process.env.SESSION_SECRET.trim();
  }
  if (!globalThis.__IN_MEMORY_SESSION_SECRET__) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    globalThis.__IN_MEMORY_SESSION_SECRET__ = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return globalThis.__IN_MEMORY_SESSION_SECRET__;
}

export function getAdminSecretSlug() {
  const slug = process.env.ADMIN_SECRET_SLUG;
  if (slug && typeof slug === 'string' && slug.trim() !== '') {
    return slug.trim();
  }
  return null;
}

function base64UrlEncode(data) {
  if (typeof Buffer !== 'undefined') {
    const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
    return buf.toString('base64url');
  }
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64url'));
  }
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeToString(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64url').toString('utf8');
  }
  const bytes = base64UrlDecode(str);
  return new TextDecoder().decode(bytes);
}

// -----------------------------------------------------------------------------
// Password Hashing (PBKDF2-SHA256 with 100,000 iterations & 16-byte random salt)
// -----------------------------------------------------------------------------

export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

export function isPasswordHashed(stored) {
  return typeof stored === 'string' && stored.startsWith('pbkdf2:');
}

export async function verifyPassword(password, stored) {
  if (!password || !stored) return false;

  if (typeof stored === 'string' && stored.startsWith('pbkdf2:')) {
    const parts = stored.split(':');
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHashHex = parts[3];

    const saltMatches = saltHex.match(/.{1,2}/g);
    if (!saltMatches) return false;
    const salt = new Uint8Array(saltMatches.map((byte) => parseInt(byte, 16)));

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: iterations || 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const computedHashHex = Array.from(new Uint8Array(derived))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time string comparison to prevent timing attacks
    if (computedHashHex.length !== expectedHashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
      diff |= computedHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return diff === 0;
  }

  // Backward-compatible fallback for legacy unhashed passwords with constant-time comparison
  if (password.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < password.length; i++) {
    diff |= password.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return diff === 0;
}

// -----------------------------------------------------------------------------
// Signed Session Tokens (HMAC-SHA256)
// -----------------------------------------------------------------------------

async function getHmacKey() {
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(payload, maxAgeSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const fullPayload = {
    ...payload,
    tokenVersion: Number(payload.tokenVersion) || 1,
    exp,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
  const encodedSignature = base64UrlEncode(signature);

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const dataToVerify = `${headerB64}.${payloadB64}`;

  try {
    const key = await getHmacKey();
    const signatureBytes = base64UrlDecode(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecodeToString(payloadB64);
    const payload = JSON.parse(payloadJson);

    // Verify expiration timestamp
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Request Authorization Helpers
// -----------------------------------------------------------------------------

export function getCookieFromRequest(request, cookieName) {
  if (request?.cookies && typeof request.cookies.get === 'function') {
    const val = request.cookies.get(cookieName)?.value;
    if (val) return val;
  }
  const cookieHeader = request?.headers?.get?.('cookie') || request?.headers?.cookie || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getSessionFromRequest(request) {
  const token =
    getCookieFromRequest(request, 'session_token') ||
    request?.headers?.get?.('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) return null;
  return await verifySessionToken(token);
}

// -----------------------------------------------------------------------------
// Defense-in-Depth Origin Checking (CSRF Defense)
// -----------------------------------------------------------------------------

export function verifyRequestOrigin(request) {
  const method = request?.method ? request.method.toUpperCase() : 'GET';
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  const headers = request.headers;
  const origin = headers?.get?.('origin') || headers?.origin || null;
  const host = headers?.get?.('host') || headers?.host || null;

  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      if (host && originHost === host.toLowerCase()) {
        return { valid: true };
      }

      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
      if (appUrl) {
        const appHost = new URL(appUrl).host.toLowerCase();
        if (originHost === appHost) {
          return { valid: true };
        }
      }

      return { valid: false, reason: 'Origin mismatch' };
    } catch (_) {
      return { valid: false, reason: 'Malformed origin header' };
    }
  }

  const referer = headers?.get?.('referer') || headers?.referer || null;
  if (referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase();
      if (host && refererHost === host.toLowerCase()) {
        return { valid: true };
      }
      return { valid: false, reason: 'Referer mismatch' };
    } catch (_) {
      return { valid: false, reason: 'Malformed referer header' };
    }
  }

  return { valid: true };
}

export async function requireAdmin(request) {
  const originCheck = verifyRequestOrigin(request);
  if (!originCheck.valid) {
    return { authorized: false, session: null, status: 403, error: 'Forbidden: Invalid request origin' };
  }

  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return { authorized: false, session: null, status: 401, error: 'Unauthorized' };
  }
  return { authorized: true, session };
}

export async function requireUser(request) {
  const originCheck = verifyRequestOrigin(request);
  if (!originCheck.valid) {
    return { authorized: false, session: null, status: 403, error: 'Forbidden: Invalid request origin' };
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return { authorized: false, session: null, status: 401, error: 'Unauthorized' };
  }

  return { authorized: true, session };
}

// -----------------------------------------------------------------------------
// Rate Limiter (In-Memory Sliding Window)
// -----------------------------------------------------------------------------

if (!globalThis.__AUTH_RATE_LIMITS__) {
  globalThis.__AUTH_RATE_LIMITS__ = new Map();
}

/**
 * Checks if a key (e.g. IP or email) has exceeded maxAttempts within windowMs.
 * @param {string} key - Identifier (e.g., `ip:${clientIp}` or `email:${email}`)
 * @param {number} maxAttempts - Maximum allowed attempts before lockout (default: 5)
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds: number }}
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  if (!key) return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  const now = Date.now();
  const store = globalThis.__AUTH_RATE_LIMITS__;
  let record = store.get(key);

  if (!record) {
    return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  }

  const validTimestamps = record.filter((t) => now - t < windowMs);
  if (validTimestamps.length !== record.length) {
    if (validTimestamps.length === 0) {
      store.delete(key);
      return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
    }
    store.set(key, validTimestamps);
  }

  if (validTimestamps.length >= maxAttempts) {
    const oldest = validTimestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - validTimestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Records a failed attempt for a given key.
 */
export function recordFailedAttempt(key, windowMs = 15 * 60 * 1000) {
  if (!key) return;
  const now = Date.now();
  const store = globalThis.__AUTH_RATE_LIMITS__;
  const record = store.get(key) || [];
  const validTimestamps = record.filter((t) => now - t < windowMs);
  validTimestamps.push(now);
  store.set(key, validTimestamps);
}

/**
 * Clears rate limit tracking upon successful authentication.
 */
export function clearRateLimit(key) {
  if (!key) return;
  globalThis.__AUTH_RATE_LIMITS__.delete(key);
}

/**
 * Extracts client IP address from standard request headers.
 */
export function getClientIp(request) {
  if (!request) return '127.0.0.1';
  const headers = request.headers;
  const forwarded = headers?.get?.('x-forwarded-for') || headers?.['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers?.get?.('x-real-ip') || headers?.['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

// -----------------------------------------------------------------------------
// Two-Factor Authentication (OTP, Hashing, & Ephemeral Challenge Tickets)
// -----------------------------------------------------------------------------

/**
 * Generates a cryptographically secure random 6-digit one-time code.
 */
export function generateTwoFactorOtp() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0];
  return String(100000 + (random % 900000));
}

/**
 * Hashes a 2FA code using PBKDF2 with salt.
 */
export async function hashTwoFactorCode(code) {
  return await hashPassword(String(code).trim());
}

/**
 * Verifies a 2FA code with constant-time comparison against hash or plaintext.
 */
export async function verifyTwoFactorCode(inputCode, stored) {
  if (!inputCode || !stored) return false;
  return await verifyPassword(String(inputCode).trim(), String(stored).trim());
}

/**
 * Creates a signed, short-lived 2FA challenge ticket (valid for 10 minutes).
 */
export async function createTwoFactorChallenge(userId, email, otp, maxAgeSeconds = 600) {
  const otpHash = await hashTwoFactorCode(otp);
  return await createSessionToken(
    { userId, email, otpHash, purpose: '2fa_challenge' },
    maxAgeSeconds
  );
}

/**
 * Verifies a 2FA challenge ticket and compares the input code in constant time.
 */
export async function verifyTwoFactorChallenge(ticket, inputCode) {
  if (!ticket || !inputCode) return { valid: false, payload: null };
  const payload = await verifySessionToken(ticket);
  if (!payload || payload.purpose !== '2fa_challenge' || !payload.otpHash) {
    return { valid: false, payload: null };
  }
  const isMatch = await verifyTwoFactorCode(inputCode, payload.otpHash);
  if (!isMatch) {
    return { valid: false, payload: null };
  }
  return { valid: true, payload };
}

