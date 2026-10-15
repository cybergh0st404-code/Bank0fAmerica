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

export const DEFAULT_NOTICE = {
  enabled: false,
  message: "Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.",
  progress: 65,
  progressStatus: "65% • Action Required",
  progressLabel: "Authorization Progress",
};

export const ALL_PAGES = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: 'transfer', label: 'Transfer Money', path: '/transfer' },
  { id: 'transactions', label: 'Transaction History', path: '/transactions' },
  { id: 'wire-transfer', label: 'Wire Transfer', path: '/wire-transfer' },
  { id: 'cards', label: 'Cards & Virtual Cards', path: '/cards' },
  { id: 'bill-pay', label: 'Bill Pay & AutoPay', path: '/bill-pay' },
  { id: 'deposit', label: 'Deposit Checks', path: '/deposit' },
  { id: 'statements', label: 'Statements & Taxes', path: '/statements' },
  { id: 'credit-score', label: 'FICO® Credit Score', path: '/credit-score' },
  { id: 'security', label: 'Security & Sessions', path: '/security' },
  { id: 'messages', label: 'Secure Messages', path: '/messages' },
  { id: 'settings', label: 'Settings', path: '/settings' },
];

export const DEFAULT_ALLOWED_PAGES = ALL_PAGES.map((p) => p.id);

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
  if (row.allowedPages) {
    try {
      allowedPages = typeof row.allowedPages === 'string' ? JSON.parse(row.allowedPages) : row.allowedPages;
    } catch (_) {
      allowedPages = DEFAULT_ALLOWED_PAGES;
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
          allowedPages TEXT
        );
      `);

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
        sql: `INSERT INTO users (id, name, email, password, twoFactorCode, role, status, phone, address, createdAt, notice, allowedPages)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
