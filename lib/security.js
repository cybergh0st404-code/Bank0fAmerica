// Cryptographic Security & Authentication Utilities
// Provides PBKDF2 password hashing with salt, HMAC-SHA256 session tokens, and request authorization guards.

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET_SLUG || 'boa_secure_enterprise_key_2026_x87y2z';

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
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(payload, maxAgeSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

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

export async function requireAdmin(request) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return { authorized: false, session: null };
  }
  return { authorized: true, session };
}

export async function requireUser(request) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { authorized: false, session: null };
  }
  return { authorized: true, session };
}
