'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  CreditCard, 
  History, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Power, 
  PowerOff, 
  Shield, 
  PlusCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  Edit2, 
  Trash2, 
  X,
  DollarSign
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../utils/AuthContext';

const AdminTransactionsPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteOpen, setWebsiteOpen] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [newTx, setNewTx] = useState({
    userId: '',
    type: 'credit',
    description: '',
    amount: '',
    category: 'Transfer',
    date: new Date().toISOString().split('T')[0],
    time: '12:00 PM',
    status: 'completed',
    updateAccountBalance: true,
  });

  const [editTx, setEditTx] = useState({
    id: '',
    type: 'credit',
    description: '',
    amount: '',
    category: 'Transfer',
    date: '',
    time: '',
    status: 'completed',
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, router, authLoading]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        if (data.users?.length > 0 && !newTx.userId) {
          setNewTx((prev) => ({ ...prev, userId: data.users[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
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
    fetchTransactions();
    fetchUsers();
  }, []);

  const handleCreateTx = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      if (res.ok) {
        alert('Transaction created successfully!');
        setShowAddModal(false);
        setNewTx({
          userId: usersList[0]?.id || '',
          type: 'credit',
          description: '',
          amount: '',
          category: 'Transfer',
          date: new Date().toISOString().split('T')[0],
          time: '12:00 PM',
          status: 'completed',
          updateAccountBalance: true,
        });
        fetchTransactions();
      } else {
        alert('Failed to create transaction.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTx = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTx),
      });
      if (res.ok) {
        alert('Transaction updated successfully!');
        setShowEditModal(false);
        fetchTransactions();
      } else {
        alert('Failed to update transaction.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTx = async (id, desc) => {
    if (!confirm(`Delete transaction "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/admin/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTransactions();
      } else {
        alert('Failed to delete transaction.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (t) => {
    setEditTx({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: String(Math.abs(t.amount)),
      category: t.category,
      date: t.date,
      time: t.time,
      status: t.status,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-neutral-100 text-neutral-700'}`}>
        {status}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <h1 className="text-3xl font-bold text-primary-navy mb-1">Transaction History & Audits</h1>
                <p className="text-neutral-600 text-sm">Add, modify, and manage live banking transaction records for all users.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2.5 rounded-bank hover:bg-opacity-90 shadow-bank"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Transaction</span>
                </Button>

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
                  placeholder="Search transactions by user, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </Card>

            {/* Transactions Table */}
            <Card 
              title={`All Transactions (${filteredTransactions.length})`}
              subtitle="Full transaction records across all bank accounts"
            >
              {/* Desktop Table (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                      <th className="text-left py-3 px-4 font-semibold">User</th>
                      <th className="text-left py-3 px-4 font-semibold">Description</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">Date & Time</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-neutral-500">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-neutral-500">
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isCredit = tx.type === 'credit' || tx.amount > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-neutral-900">
                              <div>{tx.userName}</div>
                              <div className="text-xs text-neutral-500 font-mono">{tx.accountNumber}</div>
                            </td>
                            <td className="py-3 px-4 text-neutral-800">
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {isCredit ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                </div>
                                <span className="font-semibold">{tx.description}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-neutral-600">
                              <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs">
                                {tx.category || 'General'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-neutral-600 text-xs">
                              <div>{tx.date}</div>
                              <div className="text-neutral-400">{tx.time}</div>
                            </td>
                            <td className="py-3 px-4 font-bold text-sm">
                              <span className={isCredit ? 'text-green-600' : 'text-neutral-900'}>
                                {isCredit ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => openEditModal(tx)}
                                  className="p-1.5 text-primary-blue hover:bg-blue-50 rounded transition-colors"
                                  title="Edit Transaction"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTx(tx.id, tx.description)}
                                  className="p-1.5 text-accent-red hover:bg-red-50 rounded transition-colors"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (Visible on Phones below md) */}
              <div className="md:hidden divide-y divide-neutral-200">
                {loading ? (
                  <div className="text-center py-8 text-neutral-500 text-sm">Loading transactions...</div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-sm">No transactions found.</div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isCredit = tx.type === 'credit' || tx.amount > 0;
                    return (
                      <div key={tx.id} className="py-3.5 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 text-sm truncate">{tx.description}</div>
                              <div className="text-xs text-neutral-500 truncate">{tx.userName} • {tx.accountNumber}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-neutral-900'}`}>
                              {isCredit ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-neutral-400">{tx.date}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-[11px] text-neutral-600">
                              {tx.category || 'General'}
                            </span>
                            <div>{getStatusBadge(tx.status)}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="p-1.5 text-primary-blue hover:bg-blue-50 rounded transition-colors"
                              title="Edit Transaction"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTx(tx.id, tx.description)}
                              className="p-1.5 text-accent-red hover:bg-red-50 rounded transition-colors"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

          </div>
        </main>
      </div>

      {/* ADD TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-primary-blue" />
                <h3 className="text-xl font-bold text-primary-navy">Add Account Transaction</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Target User Account *</label>
                <select
                  required
                  value={newTx.userId}
                  onChange={(e) => setNewTx({ ...newTx, userId: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="" disabled>Select User</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - Balance: ${(Number(u.totalBalance) || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Transaction Type</label>
                  <select
                    value={newTx.type}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="credit">Credit (Deposit / Incoming)</option>
                    <option value="debit">Debit (Payment / Outgoing)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Amount ($) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1000.00"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description / Memo *</label>
                <Input
                  required
                  placeholder="e.g. Wire Transfer to Chase or Payroll Deposit"
                  value={newTx.description}
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="Transfer">Transfer</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="Bills">Bills</option>
                    <option value="Salary">Salary</option>
                    <option value="Investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                  <select
                    value={newTx.status}
                    onChange={(e) => setNewTx({ ...newTx, status: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Time</label>
                  <Input
                    type="text"
                    placeholder="e.g. 02:30 PM"
                    value={newTx.time}
                    onChange={(e) => setNewTx({ ...newTx, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="updateBal"
                  checked={newTx.updateAccountBalance}
                  onChange={(e) => setNewTx({ ...newTx, updateAccountBalance: e.target.checked })}
                  className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                />
                <label htmlFor="updateBal" className="text-xs text-neutral-700 font-medium">
                  Automatically adjust user's account balance by this transaction
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Transaction'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TRANSACTION MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-primary-blue" />
                <h3 className="text-xl font-bold text-primary-navy">Edit Transaction Record</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTx} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Type</label>
                  <select
                    value={editTx.type}
                    onChange={(e) => setEditTx({ ...editTx, type: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="credit">Credit (Deposit / Incoming)</option>
                    <option value="debit">Debit (Payment / Outgoing)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Amount ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={editTx.amount}
                    onChange={(e) => setEditTx({ ...editTx, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description / Memo</label>
                <Input
                  required
                  value={editTx.description}
                  onChange={(e) => setEditTx({ ...editTx, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={editTx.category}
                    onChange={(e) => setEditTx({ ...editTx, category: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="Transfer">Transfer</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="Bills">Bills</option>
                    <option value="Salary">Salary</option>
                    <option value="Investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                  <select
                    value={editTx.status}
                    onChange={(e) => setEditTx({ ...editTx, status: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={editTx.date}
                    onChange={(e) => setEditTx({ ...editTx, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Time</label>
                  <Input
                    type="text"
                    value={editTx.time}
                    onChange={(e) => setEditTx({ ...editTx, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTransactionsPage;
