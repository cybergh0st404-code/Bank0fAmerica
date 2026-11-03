import { getBankData } from './db.js';
import { requireUser as verifyUserSession } from './security.js';

export async function requireUserWithRevocationCheck(request) {
  const auth = await verifyUserSession(request);
  if (!auth.authorized) {
    return auth;
  }

  // Active session revocation check: verify tokenVersion against database
  if (auth.session.id && auth.session.role !== 'admin') {
    try {
      const data = await getBankData();
      const dbUser = (data.users || []).find((u) => u.id === auth.session.id);
      if (!dbUser) {
        return { authorized: false, session: null, status: 401, error: 'User not found' };
      }
      if (dbUser.status === 'flagged') {
        return { authorized: false, session: null, status: 403, error: 'Account restricted' };
      }
      const dbVersion = Number(dbUser.tokenVersion) || 1;
      const sessionVersion = Number(auth.session.tokenVersion) || 1;
      if (sessionVersion < dbVersion) {
        return { authorized: false, session: null, status: 401, error: 'Session revoked. Please log in again.' };
      }
      return { authorized: true, session: auth.session, dbUser };
    } catch (_) {}
  }

  return auth;
}
