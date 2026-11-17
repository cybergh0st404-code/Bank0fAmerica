/**
 * SINGLE SOURCE OF TRUTH FOR ALL BANK NAVIGATION MENUS & PERMISSIONS
 * Synchronized across Admin, Super Admin, User Dashboard, Database, and Access Guards
 */

export const ALL_NAVIGATION_MENUS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', core: true, icon: 'LayoutDashboard' },
  { id: 'transfer', label: 'Transfer Money', path: '/transfer', core: true, icon: 'ArrowLeftRight' },
  { id: 'wire-transfer', label: 'Wire Transfer', path: '/wire-transfer', core: true, icon: 'Send' },
  { id: 'deposit', label: 'Deposit Checks', path: '/deposit', core: false, icon: 'Camera' },
  { id: 'bill-pay', label: 'Bill Pay & AutoPay', path: '/bill-pay', core: false, icon: 'Receipt' },
  { id: 'transactions', label: 'Transaction History', path: '/transactions', core: true, icon: 'History' },
  { id: 'cards', label: 'Cards & Virtual Cards', path: '/cards', core: false, icon: 'CreditCard' },
  { id: 'statements', label: 'Statements & Tax', path: '/statements', core: true, icon: 'FileText' },
  { id: 'credit-score', label: 'Credit Score', path: '/credit-score', core: false, icon: 'TrendingUp' },
  { id: 'messages', label: 'Secure Messages', path: '/messages', core: true, icon: 'Mail' },
  { id: 'support', label: 'Live Support & Concierge', path: '/messages?tab=support', core: true, icon: 'Headphones' },
  { id: 'security', label: 'Security & Sessions', path: '/security', core: true, icon: 'Shield' },
  { id: 'settings', label: 'Settings', path: '/settings', core: true, icon: 'Settings' },
];

export const ALL_MENU_IDS = ALL_NAVIGATION_MENUS.map((m) => m.id);

export const DEFAULT_CORE_MENU_IDS = ALL_NAVIGATION_MENUS.filter((m) => m.core).map((m) => m.id);

/**
 * Normalizes any legacy or inconsistent IDs (e.g. 'transfers' -> 'transfer')
 * and returns a deduplicated array of valid menu IDs.
 */
export function normalizeMenuIds(ids) {
  if (!Array.isArray(ids)) return [];
  const validSet = new Set(ALL_MENU_IDS);
  const result = new Set();

  for (const raw of ids) {
    if (!raw || typeof raw !== 'string') continue;
    const clean = raw.trim();
    if (clean === 'transfers') {
      result.add('transfer');
    } else if (validSet.has(clean)) {
      result.add(clean);
    }
  }

  return Array.from(result);
}

/**
 * SINGLE SOURCE OF TRUTH FOR GRANULAR ADMIN PERMISSIONS
 * Controlled by Super Admin when onboarding or managing Admins.
 */
export const ALL_ADMIN_PERMISSIONS = [
  {
    id: 'canCreateUsers',
    label: 'Onboard / Create Users',
    description: 'Allow admin to onboard new client user accounts',
    category: 'User Management',
  },
  {
    id: 'canEditUsers',
    label: 'Edit User Profiles & Credentials',
    description: 'Modify user names, emails, passwords, 2FA codes, and dates',
    category: 'User Management',
  },
  {
    id: 'canDeleteUsers',
    label: 'Delete Users',
    description: 'Permanently delete users they onboarded',
    category: 'User Management',
  },
  {
    id: 'canManageStatus',
    label: 'Account Status & Force Logout',
    description: 'Change user status (Active, Pending, Inactive, Flagged, Suspended, Blocked) and force logout',
    category: 'Security & Restrictions',
  },
  {
    id: 'canManageNotices',
    label: 'Restriction Warnings & Pop-ups',
    description: 'Configure account restriction notices and pop-up alerts',
    category: 'Security & Restrictions',
  },
  {
    id: 'canManageMenus',
    label: 'Sidebar Menus & Feature Locks',
    description: 'Grant, hide, or lock dashboard navigation menus for users',
    category: 'Security & Restrictions',
  },
  {
    id: 'canViewAccounts',
    label: 'View Accounts Tab',
    description: 'Access the Accounts & Balances overview section',
    category: 'Accounts & Balances',
  },
  {
    id: 'canManageBalances',
    label: 'Modify Account Balances & Dates',
    description: 'Update user account balances, initial deposit dates, and opening dates',
    category: 'Accounts & Balances',
  },
  {
    id: 'canViewTransactions',
    label: 'View Transactions Tab',
    description: 'Access the Transactions ledger section',
    category: 'Transactions',
  },
  {
    id: 'canCreateTransactions',
    label: 'Create Transactions',
    description: 'Add new credit or debit transactions for their users',
    category: 'Transactions',
  },
  {
    id: 'canEditTransactions',
    label: 'Edit & Delete Transactions',
    description: 'Modify or remove existing transactions for their users',
    category: 'Transactions',
  },
];

export const DEFAULT_ADMIN_PERMISSIONS = ALL_ADMIN_PERMISSIONS.reduce((acc, item) => {
  acc[item.id] = true;
  return acc;
}, {});

export function normalizeAdminPermissions(input) {
  const result = { ...DEFAULT_ADMIN_PERMISSIONS };
  if (!input || typeof input !== 'object') {
    return result;
  }
  for (const perm of ALL_ADMIN_PERMISSIONS) {
    if (typeof input[perm.id] === 'boolean') {
      result[perm.id] = input[perm.id];
    }
  }
  if (typeof input.mustChangePassword === 'boolean') {
    result.mustChangePassword = input.mustChangePassword;
  }
  return result;
}

export function hasAdminPermission(userOrPerms, permId) {
  if (!userOrPerms) return false;
  if (userOrPerms.role === 'superadmin') return true;
  const perms = userOrPerms.adminPermissions || userOrPerms;
  if (!perms || typeof perms !== 'object') return true;
  return perms[permId] !== false;
}

