import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { Redis } from '@upstash/redis';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'bankData.json');
const TMP_FILE = path.join(os.tmpdir(), 'bankData.json');

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let redisClient = null;
if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (e) {
    redisClient = null;
  }
}

const INITIAL_DATA = {
  users: [
    {
      id: 'user-1',
      name: 'Pattch P Jones',
      email: 'pattchjones@protonmail.com',
      password: 'pattch123jones',
      twoFactorCode: '345094',
      role: 'user',
      status: 'active',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace, Springfield, OR',
      createdAt: '2024-01-01',
    },
    {
      id: 'user-2',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      twoFactorCode: '112233',
      role: 'user',
      status: 'active',
      phone: '+1 (555) 345-6789',
      address: '123 Main Street, New York, NY',
      createdAt: '2024-01-01',
    },
    {
      id: 'user-3',
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'Password123!',
      twoFactorCode: '445566',
      role: 'user',
      status: 'active',
      phone: '+1 (555) 456-7890',
      address: '456 Oak Avenue, Los Angeles, CA',
      createdAt: '2024-01-05',
    }
  ],
  accounts: [
    {
      id: 'acc-1',
      userId: 'user-1',
      userName: 'Pattch P Jones',
      accountNumber: '**** 4532',
      fullAccountNumber: '0260095934532',
      routingNumber: '026009593',
      type: 'Checking',
      balance: 1324742.22,
      status: 'active',
    },
    {
      id: 'acc-2',
      userId: 'user-2',
      userName: 'John Doe',
      accountNumber: '**** 7890',
      fullAccountNumber: '0260095937890',
      routingNumber: '026009593',
      type: 'Checking',
      balance: 125430.50,
      status: 'active',
    },
    {
      id: 'acc-3',
      userId: 'user-3',
      userName: 'Jane Smith',
      accountNumber: '**** 1234',
      fullAccountNumber: '0260095931234',
      routingNumber: '026009593',
      type: 'Savings',
      balance: 8750.25,
      status: 'active',
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      userId: 'user-1',
      userName: 'Pattch P Jones',
      accountNumber: '**** 4532',
      type: 'debit',
      description: 'Heather L Gordon',
      amount: -10000.0,
      date: '2026-01-20',
      time: '09:15 AM',
      category: 'Transfer',
      status: 'failed',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      userName: 'Pattch P Jones',
      accountNumber: '**** 4532',
      type: 'debit',
      description: 'Sell Farmer',
      amount: -5000.0,
      date: '2026-01-18',
      time: '05:20 PM',
      category: 'Transfer',
      status: 'failed',
    },
    {
      id: 'tx-3',
      userId: 'user-1',
      userName: 'Pattch P Jones',
      accountNumber: '**** 4532',
      type: 'debit',
      description: 'Brent McKenzie',
      amount: -10000.0,
      date: '2026-01-08',
      time: '11:45 AM',
      category: 'Transfer',
      status: 'failed',
    },
    {
      id: 'tx-4',
      userId: 'user-1',
      userName: 'Pattch P Jones',
      accountNumber: '**** 4532',
      type: 'debit',
      description: 'James M Nelson',
      amount: -5000.0,
      date: '2026-01-15',
      time: '04:20 PM',
      category: 'Transfer',
      status: 'failed',
    }
  ]
};

export const DEFAULT_NOTICE = {
  enabled: false,
  message: "Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.",
  progress: 65,
  progressStatus: "65% • Failed",
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

function normalizeBankData(data) {
  if (!data) return INITIAL_DATA;
  if (data.users && Array.isArray(data.users)) {
    data.users = data.users.map((u) => ({
      ...u,
      notice: u.notice ? { ...DEFAULT_NOTICE, ...u.notice } : { ...DEFAULT_NOTICE },
      allowedPages: Array.isArray(u.allowedPages) && u.allowedPages.length > 0 
        ? u.allowedPages 
        : DEFAULT_ALLOWED_PAGES,
    }));
  }
  return data;
}

export async function getBankData() {
  try {
    // 1. In-memory cache (fastest, immediately consistent within warm instances)
    if (globalThis.__BANK_DATA__ && globalThis.__BANK_DATA__.users) {
      return normalizeBankData(globalThis.__BANK_DATA__);
    }

    // 2. Redis if configured
    if (redisClient) {
      try {
        const redisData = await redisClient.get('bank_data');
        if (redisData) {
          const parsed = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
          if (parsed && parsed.users) {
            globalThis.__BANK_DATA__ = parsed;
            return normalizeBankData(parsed);
          }
        }
      } catch (_) {}
    }

    // 3. Writable temporary directory (/tmp on AWS Lambda & Vercel)
    try {
      if (await fs.pathExists(TMP_FILE)) {
        const tmpData = await fs.readJson(TMP_FILE);
        if (tmpData && tmpData.users) {
          globalThis.__BANK_DATA__ = tmpData;
          return normalizeBankData(tmpData);
        }
      }
    } catch (_) {}

    // 4. Bundled DATA_FILE
    if (await fs.pathExists(DATA_FILE)) {
      const data = await fs.readJson(DATA_FILE);
      globalThis.__BANK_DATA__ = data;
      return normalizeBankData(data);
    }

    globalThis.__BANK_DATA__ = INITIAL_DATA;
    return normalizeBankData(INITIAL_DATA);
  } catch (err) {
    console.error('Error reading bankData:', err);
    return normalizeBankData(INITIAL_DATA);
  }
}

export async function saveBankData(data) {
  // Update in-memory cache immediately
  globalThis.__BANK_DATA__ = data;
  let saved = false;

  // 1. Save to Redis if available
  if (redisClient) {
    try {
      await redisClient.set('bank_data', JSON.stringify(data));
      saved = true;
    } catch (e) {
      // Redis error or offline
    }
  }

  // 2. Save to /tmp/bankData.json (writable on Vercel / serverless)
  try {
    await fs.writeJson(TMP_FILE, data, { spaces: 2 });
    saved = true;
  } catch (e) {}

  // 3. Save to local DATA_FILE (works on local machine and non-serverless)
  try {
    await fs.ensureDir(DATA_DIR);
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
    saved = true;
  } catch (e) {
    // Expected on Vercel / serverless (read-only filesystem)
  }

  return saved;
}

export async function findUserByEmail(email) {
  const data = await getBankData();
  return (data.users || []).find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id) {
  const data = await getBankData();
  return (data.users || []).find((u) => u.id === id);
}

export async function getAccountsForUser(userId) {
  const data = await getBankData();
  return (data.accounts || []).filter((a) => a.userId === userId);
}

export async function getTransactionsForUser(userId) {
  const data = await getBankData();
  return (data.transactions || []).filter((t) => t.userId === userId);
}
