'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Users,
  CreditCard,
  History,
  Search,
  Shield,
  DollarSign,
  Edit3,
  X,
  AlertCircle,
  LogOut,
  Building2,
} from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../utils/AuthContext';
import { DEFAULT_ADMIN_PERMISSIONS, hasAdminPermission } from '../../lib/navigationConfig.js';

const AdminAccountsPage = () => {
  const router = useRouter();
  const { user, logout, updateUser, loading: authLoading } = useAuth();

  const isSuperAdmin = user?.role === 'superadmin';
  const isAnyAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [accounts, setAccounts] = useState([]);
  const [livePermissions, setLivePermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteOpen, setWebsiteOpen] = useState(true);

  // Edit balance modal
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [accountStatus, setAccountStatus] = useState('active');
  const [depositDate, setDepositDate] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [savingBalance, setSavingBalance] = useState(false);

  const canDo = (permId) => {
    if (isSuperAdmin) return true;
    const effectiveUser = {
      ...user,
      adminPermissions: livePermissions || user?.adminPermissions || DEFAULT_ADMIN_PERMISSIONS,
    };
    return hasAdminPermission(effectiveUser, permId);
  };

  useEffect(() => {
    if (!authLoading && (!user || !isAnyAdmin)) {
      router.replace('/login');
    }
  }, [user, router, authLoading, isAnyAdmin]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.adminContext?.permissions) {
          setLivePermissions(data.adminContext.permissions);
          if (updateUser) {
            updateUser({ adminPermissions: data.adminContext.permissions });
          }
        }
      } else if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        if (err.message?.toLowerCase().includes('permission')) {
          router.push('/admin');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isAnyAdmin) return;
    const fetchWebsiteStatus = async () => {
      try {
        const res = await fetch('/api/website-status');
        if (res.ok) {
          const data = await res.json();
          setWebsiteOpen(data.isOpen);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchWebsiteStatus();
    fetchAccounts();
  }, [user?.id, user?.role]);

  const getStatusBadge = (status) => {
    const s = (status || 'active').toLowerCase();
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      inactive: 'bg-slate-100 text-slate-600 border-slate-300',
      pending: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
      flagged: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      suspended: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      blocked: 'bg-red-100 text-red-700 border-red-300 font-bold',
    };
    const dotColors = {
      active: 'bg-emerald-500',
      inactive: 'bg-slate-400',
      pending: 'bg-amber-500',
      flagged: 'bg-rose-500',
      suspended: 'bg-amber-500',
      blocked: 'bg-red-500',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
          styles[s] || styles.active
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[s] || dotColors.active}`} />
        {s}
      </span>
    );
  };

  const openBalanceModal = (acc) => {
    setSelectedAccount(acc);
    setNewBalance(String(acc.balance));
    setDepositDate(acc.initialDepositDate || new Date().toISOString().split('T')[0]);
    setOpeningDate(acc.openingDate || new Date().toISOString().split('T')[0]);
    setAccountStatus(acc.status || 'active');
    setShowBalanceModal(true);
  };

  const handleSaveBalance = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setSavingBalance(true);
    try {
      const payload = { id: selectedAccount.id };
      if (canDo('canManageBalances')) {
        payload.balance = parseFloat(newBalance) || 0;
        payload.initialDepositDate = depositDate;
        payload.openingDate = openingDate;
      }
      if (canDo('canManageStatus')) {
        payload.status = accountStatus;
      }
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Account updated successfully!');
        setShowBalanceModal(false);
        fetchAccounts();
      } else {
        alert(data.message || 'Failed to update account.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating account.');
    } finally {
      setSavingBalance(false);
    }
  };

  const handleToggleFlag = async (acc) => {
    if (!canDo('canManageStatus')) {
      alert('You do not have permission to change account status.');
      return;
    }
    const newStatus = acc.status === 'flagged' ? 'active' : 'flagged';
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id, status: newStatus }),
      });
      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to update account status.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountNumber?.includes(searchQuery) ||
      a.createdByAdminName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLedgerBalance = filteredAccounts.reduce(
    (sum, a) => sum + (Number(a.balance) || 0),
    0
  );

  const basePath = isSuperAdmin ? '/super-admin' : '/admin';
  const rawTabs = [
    { id: 'users', label: isSuperAdmin ? 'Client Roster' : 'My Clients', icon: Users, path: basePath },
    {
      id: 'accounts',
      label: isSuperAdmin ? 'Account Ledger' : 'Client Accounts',
      icon: CreditCard,
      path: `${basePath}/accounts`,
      perm: 'canViewAccounts',
    },
    {
      id: 'transactions',
      label: isSuperAdmin ? 'Transaction Audit' : 'Transactions',
      icon: History,
      path: `${basePath}/transactions`,
      perm: 'canViewTransactions',
    },
  ];
  const tabs = rawTabs.filter((t) => !t.perm || canDo(t.perm));

  return (
    <div className="min-h-screen bg-[#f0f4f9]">
      {/* BANK OF AMERICA EXECUTIVE COMMAND MASTHEAD */}
      <header className="bg-gradient-to-r from-[#011640] via-[#012169] to-[#082c7c] text-white border-b-4 border-[#E31837] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
            <div className="flex items-center space-x-3.5">
              <Link href={basePath} className="flex items-center space-x-3">
                <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-sm flex items-center space-x-2">
                  <img
                    src="/logo.png"
                    alt="Bank of America"
                    className="h-6 w-auto object-contain"
                  />
                  <span className="font-extrabold text-[#012169] text-sm tracking-tight hidden sm:inline">
                    BANK OF AMERICA
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                      EXECUTIVE GOVERNANCE CONSOLE
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                        isSuperAdmin
                          ? 'bg-[#E31837] text-white border-red-400'
                          : 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                      }`}
                    >
                      {isSuperAdmin ? 'Master Super Admin' : 'Portfolio Admin'}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200 hidden sm:block">
                    Account Balances, Capital Allocation & Status Ledger
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    websiteOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span className="text-blue-100 font-medium">Portal:</span>
                <span className="font-bold text-white">
                  {websiteOpen ? 'ONLINE' : 'LOCKED (404)'}
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (logout) await logout();
                  router.push('/login');
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#E31837] hover:bg-red-700 text-xs font-bold text-white shadow-sm transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isCurrentRoute = router.pathname === tab.path;
                return (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      isCurrentRoute
                        ? 'bg-white text-[#012169] shadow-sm'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="text-xs text-blue-100 font-semibold">
              Total Ledger Capital:{' '}
              <span className="font-black text-white">
                ${totalLedgerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search accounts by client name, account number, or onboarding admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
            />
          </div>
        </div>

        {/* Accounts Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-[#012169] to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-sky-300" />
              <h2 className="text-sm sm:text-base font-bold">
                {isSuperAdmin ? 'Global Account Ledger' : 'Managed Client Accounts'} ({filteredAccounts.length})
              </h2>
            </div>
            <span className="text-xs text-blue-200">Live Balance & Status Control</span>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left py-3.5 px-4 font-bold">Account Holder</th>
                  {isSuperAdmin && (
                    <th className="text-left py-3.5 px-4 font-bold">Onboarded By</th>
                  )}
                  <th className="text-left py-3.5 px-4 font-bold">Account Number</th>
                  <th className="text-left py-3.5 px-4 font-bold">Type</th>
                  <th className="text-left py-3.5 px-4 font-bold">Current Balance</th>
                  <th className="text-left py-3.5 px-4 font-bold">Status</th>
                  <th className="text-right py-3.5 px-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-10 text-slate-500">
                      Loading accounts...
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-10 text-slate-500">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{account.userName}</td>
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#012169] border border-blue-200">
                            {account.createdByAdminName || 'Super Administrator'}
                          </span>
                        </td>
                      )}
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                        {account.accountNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200">
                          {account.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-base">
                        ${Number(account.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(account.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {(canDo('canManageBalances') || canDo('canManageStatus')) && (
                            <Button
                              onClick={() => openBalanceModal(account)}
                              className="text-xs px-3 py-1.5 flex items-center space-x-1 bg-[#012169]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>
                                {canDo('canManageBalances') ? 'Update Balance' : 'Update Status'}
                              </span>
                            </Button>
                          )}
                          {canDo('canManageStatus') && (
                            <button
                              onClick={() => handleToggleFlag(account)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                account.status === 'flagged'
                                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                  : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                              }`}
                              title={
                                account.status === 'flagged' ? 'Unflag Account' : 'Flag Account'
                              }
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-200 p-4">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-sm">Loading accounts...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No accounts found.</div>
            ) : (
              filteredAccounts.map((account) => (
                <div key={account.id} className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{account.userName}</div>
                      <div className="font-mono text-xs text-slate-500">
                        {account.accountNumber}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {account.type}
                      </span>
                      {getStatusBadge(account.status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-[11px] text-slate-500">Current Balance</div>
                      <div className="text-base font-bold text-slate-900">
                        ${Number(account.balance).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(canDo('canManageBalances') || canDo('canManageStatus')) && (
                        <Button
                          onClick={() => openBalanceModal(account)}
                          className="text-xs px-2.5 py-1.5 flex items-center space-x-1 bg-[#012169]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* UPDATE BALANCE MODAL */}
      {showBalanceModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-card shadow-bank-lg max-w-md w-full p-6 relative border-t-4 border-[#012169]">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-[#012169]">Update Client Account</h3>
              </div>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div className="bg-neutral-50 p-3 rounded-bank border border-neutral-200 space-y-1 text-sm">
                <div>
                  <span className="text-neutral-500">Account Holder:</span>{' '}
                  <span className="font-semibold text-neutral-800">
                    {selectedAccount.userName}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Account Number:</span>{' '}
                  <span className="font-mono font-semibold text-neutral-800">
                    {selectedAccount.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Current Balance:</span>{' '}
                  <span className="font-semibold text-emerald-700">
                    ${Number(selectedAccount.balance).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {canDo('canManageBalances') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      New Balance Amount ($) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        className="input-field pl-10 font-bold text-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Initial Deposit Date
                      </label>
                      <input
                        type="date"
                        value={depositDate}
                        onChange={(e) => setDepositDate(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Account Opening Date
                      </label>
                      <input
                        type="date"
                        value={openingDate}
                        onChange={(e) => setOpeningDate(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {canDo('canManageStatus') && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={accountStatus}
                    onChange={(e) => setAccountStatus(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="flagged">Flagged</option>
                    <option value="suspended">Suspended</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingBalance}>
                  {savingBalance ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccountsPage;

export async function getServerSideProps(context) {
  const { req } = context;
  const token = req.cookies?.session_token;
  const { verifySessionToken } = await import('../../lib/security.js');
  const session = token ? await verifySessionToken(token) : null;

  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    return {
      notFound: true,
    };
  }

  if (session.role === 'superadmin') {
    return {
      redirect: {
        destination: '/super-admin/accounts',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
