'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  CreditCard, 
  History, 
  Search, 
  Power, 
  PowerOff, 
  Shield, 
  DollarSign, 
  Edit3, 
  X,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../utils/AuthContext';

const AdminAccountsPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteOpen, setWebsiteOpen] = useState(true);

  // Edit balance modal
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [savingBalance, setSavingBalance] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, router, authLoading]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
  }, []);

  const openBalanceModal = (acc) => {
    setSelectedAccount(acc);
    setNewBalance(String(acc.balance));
    setShowBalanceModal(true);
  };

  const handleSaveBalance = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setSavingBalance(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAccount.id,
          balance: parseFloat(newBalance) || 0,
        }),
      });
      if (res.ok) {
        alert('Account balance updated successfully!');
        setShowBalanceModal(false);
        fetchAccounts();
      } else {
        alert('Failed to update balance.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating balance.');
    } finally {
      setSavingBalance(false);
    }
  };

  const handleToggleFlag = async (acc) => {
    const newStatus = acc.status === 'flagged' ? 'active' : 'flagged';
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id, status: newStatus }),
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountNumber?.includes(searchQuery)
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, path: '/admin' },
    { id: 'accounts', label: 'Accounts', icon: CreditCard, path: '/admin/accounts' },
    { id: 'transactions', label: 'Transactions', icon: History, path: '/admin/transactions' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar isAdmin={true} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-primary-navy mb-1">Account Balances & Limits</h1>
                <p className="text-neutral-600 text-sm">Directly update customer balances, account numbers, and status.</p>
              </div>

              {/* Website Control */}
              <Card className="p-2 px-4 shadow-sm border border-neutral-200">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-primary-blue" />
                    <span className="text-xs font-semibold text-neutral-700">Site Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      websiteOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {websiteOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <Button
                    variant={websiteOpen ? 'danger' : 'primary'}
                    onClick={async () => {
                      const next = !websiteOpen;
                      try {
                        const res = await fetch('/api/website-status', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isOpen: next }),
                        });
                        if (res.ok) {
                          setWebsiteOpen(next);
                          alert(`Website has been ${next ? 'opened' : 'closed'}.`);
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="px-3 py-1 text-xs"
                  >
                    {websiteOpen ? <PowerOff className="w-3.5 h-3.5 mr-1 inline" /> : <Power className="w-3.5 h-3.5 mr-1 inline" />}
                    {websiteOpen ? 'Close Site' : 'Open Site'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-card shadow-bank p-1 flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    className={`flex-1 min-w-[130px] sm:min-w-0 flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-bank transition-all text-xs sm:text-sm whitespace-nowrap ${
                      router.pathname === tab.path 
                        ? 'bg-primary-blue text-white shadow-bank font-semibold'
                        : 'text-neutral-600 hover:bg-accent-soft'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Search */}
            <Card className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  placeholder="Search accounts by user or account number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </Card>

            {/* Accounts Table */}
            <Card title={`All Accounts (${filteredAccounts.length})`} subtitle="View and edit live account balances">
              {/* Desktop Table (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                      <th className="text-left py-3 px-4 font-semibold">Account Holder</th>
                      <th className="text-left py-3 px-4 font-semibold">Account Number</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Current Balance</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-neutral-500">
                          Loading accounts...
                        </td>
                      </tr>
                    ) : filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-neutral-500">
                          No accounts found.
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-neutral-900">{account.userName}</td>
                          <td className="py-3 px-4 font-mono text-neutral-600 font-semibold">
                            {account.accountNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {account.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900 text-base">
                            ${Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {account.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                onClick={() => openBalanceModal(account)}
                                className="text-xs px-3 py-1 flex items-center space-x-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Update Balance</span>
                              </Button>
                              <button
                                onClick={() => handleToggleFlag(account)}
                                className={`p-1.5 rounded transition-colors ${
                                  account.status === 'flagged' ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'
                                }`}
                                title={account.status === 'flagged' ? 'Unflag Account' : 'Flag Account'}
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (Visible on Phones below md) */}
              <div className="md:hidden divide-y divide-neutral-200">
                {loading ? (
                  <div className="text-center py-8 text-neutral-500 text-sm">Loading accounts...</div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-sm">No accounts found.</div>
                ) : (
                  filteredAccounts.map((account) => (
                    <div key={account.id} className="py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-neutral-900 text-sm">{account.userName}</div>
                          <div className="font-mono text-xs text-neutral-500">{account.accountNumber}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {account.type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-bank border border-neutral-200">
                        <div>
                          <div className="text-[11px] text-neutral-500">Current Balance</div>
                          <div className="text-base font-bold text-neutral-900">
                            ${Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => openBalanceModal(account)}
                            className="text-xs px-2.5 py-1.5 flex items-center space-x-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </Button>
                          <button
                            onClick={() => handleToggleFlag(account)}
                            className={`p-1.5 rounded transition-colors ${
                              account.status === 'flagged' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                            }`}
                            title={account.status === 'flagged' ? 'Unflag Account' : 'Flag Account'}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* UPDATE BALANCE MODAL */}
      {showBalanceModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-card shadow-bank-lg max-w-md w-full p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-primary-navy">Update Account Balance</h3>
              </div>
              <button onClick={() => setShowBalanceModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div className="bg-neutral-50 p-3 rounded-bank border border-neutral-200 space-y-1 text-sm">
                <div><span className="text-neutral-500">Account Holder:</span> <span className="font-semibold text-neutral-800">{selectedAccount.userName}</span></div>
                <div><span className="text-neutral-500">Account Number:</span> <span className="font-mono font-semibold text-neutral-800">{selectedAccount.accountNumber}</span></div>
                <div><span className="text-neutral-500">Current Balance:</span> <span className="font-semibold text-green-700">${Number(selectedAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">New Balance Amount ($) *</label>
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

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button variant="secondary" type="button" onClick={() => setShowBalanceModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingBalance}>
                  {savingBalance ? 'Saving...' : 'Confirm Balance Change'}
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
