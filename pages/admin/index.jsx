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
  Unlock,
  X,
  DollarSign,
  Eye,
  EyeOff,
  TrendingUp,
  LogOut,
  Ban,
  PauseCircle,
  ShieldAlert,
  UserCheck,
  Sliders,
  Filter
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../utils/AuthContext';
import {
  ALL_NAVIGATION_MENUS,
  ALL_MENU_IDS,
  DEFAULT_CORE_MENU_IDS,
  normalizeMenuIds,
  ALL_ADMIN_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  normalizeAdminPermissions,
  hasAdminPermission,
} from '../../lib/navigationConfig.js';

const ALL_AVAILABLE_PAGES = ALL_NAVIGATION_MENUS;
const DEFAULT_PAGES = ALL_MENU_IDS;

const AdminUsersPage = () => {
  const router = useRouter();
  const { user, logout, updateUser, loading: authLoading } = useAuth();

  const isSuperAdmin = user?.role === 'superadmin';
  const isAnyAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [activeSection, setActiveSection] = useState('users'); // 'users' | 'admins'
  const [selectedAdminFilter, setSelectedAdminFilter] = useState('all'); // 'all' | 'admin-1' | adminId
  const [livePermissions, setLivePermissions] = useState(null);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Super Admin: Onboarded Admins state
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Website Lock & Spending Overview (Super Admin only)
  const [websiteOpen, setWebsiteOpen] = useState(true);
  const [loadingWebsiteStatus, setLoadingWebsiteStatus] = useState(true);
  const [showSpendingOverview, setShowSpendingOverview] = useState(true);
  const [loadingSpendingToggle, setLoadingSpendingToggle] = useState(false);

  // User Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUser, setNoticeUser] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUser, setStatusUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [actionLoading, setActionLoading] = useState(false);

  // Super Admin Modals for Managing Admins
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showPermAdminModal, setShowPermAdminModal] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState(null);

  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    status: 'active',
    adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
  });

  const [editAdminForm, setEditAdminForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    status: 'active',
  });

  const [permAdminForm, setPermAdminForm] = useState({ ...DEFAULT_ADMIN_PERMISSIONS });

  // User Forms state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    twoFactorCode: '',
    initialBalance: '0',
    initialDepositDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    accountType: 'Checking',
    status: 'active',
    allowedPages: DEFAULT_PAGES,
    lockedPages: [],
  });

  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    twoFactorCode: '',
    balance: '',
    initialDepositDate: '',
    createdAt: '',
    status: 'active',
    allowedPages: [],
    lockedPages: [],
    createdByAdminId: '',
  });

  const [noticeForm, setNoticeForm] = useState({
    enabled: false,
    showPopup: true,
    sendAsMessage: false,
    subject: 'Official Account & Compliance Notice',
    sender: 'Bank of America Executive Compliance',
    category: 'Notices',
    message: '',
    progress: 65,
    progressStatus: '65% • Failed',
    progressLabel: 'Authorization Progress',
  });

  // Helper to check granular permission for the logged-in admin
  const canDo = (permId) => {
    if (isSuperAdmin) return true;
    const effectiveUser = {
      ...user,
      adminPermissions: livePermissions || user?.adminPermissions || DEFAULT_ADMIN_PERMISSIONS,
    };
    return hasAdminPermission(effectiveUser, permId);
  };

  // Redirect non-admins to 404
  useEffect(() => {
    if (!authLoading && (!user || !isAnyAdmin)) {
      router.push('/404');
    }
  }, [user, router, authLoading, isAnyAdmin]);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.adminContext?.permissions) {
          setLivePermissions(data.adminContext.permissions);
          if (updateUser) {
            updateUser({ adminPermissions: data.adminContext.permissions });
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || errData.message?.toLowerCase().includes('session') || errData.message?.toLowerCase().includes('restricted')) {
          logout();
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch onboarded admins (Super Admin only)
  const fetchAdmins = async () => {
    if (!isSuperAdmin) return;
    setLoadingAdmins(true);
    try {
      const res = await fetch('/api/admin/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Fetch website status & initial data
  useEffect(() => {
    if (!user || !isAnyAdmin) return;
    const fetchWebsiteStatus = async () => {
      setLoadingWebsiteStatus(true);
      try {
        const res = await fetch('/api/website-status');
        if (res.ok) {
          const data = await res.json();
          setWebsiteOpen(data.isOpen);
          if (typeof data.showSpendingOverview === 'boolean') {
            setShowSpendingOverview(data.showSpendingOverview);
          }
        }
      } catch (error) {
        console.error('Error fetching website status:', error);
      } finally {
        setLoadingWebsiteStatus(false);
      }
    };
    fetchWebsiteStatus();
    fetchUsers();
    if (user.role === 'superadmin') {
      fetchAdmins();
    }
  }, [user?.id, user?.role]);

  // --- SUPER ADMIN: ADMIN CRUD HANDLERS ---
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdminForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to onboard admin.');
        setActionLoading(false);
        return;
      }
      alert(`Admin "${newAdminForm.name}" onboarded successfully!`);
      setShowAddAdminModal(false);
      setNewAdminForm({
        name: '',
        email: '',
        password: '',
        status: 'active',
        adminPermissions: { ...DEFAULT_ADMIN_PERMISSIONS },
      });
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert('Network error while onboarding admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditAdminModal = (adm) => {
    setTargetAdmin(adm);
    setEditAdminForm({
      id: adm.id,
      name: adm.name || '',
      email: adm.email || '',
      password: '',
      status: adm.status || 'active',
    });
    setShowEditAdminModal(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAdminForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to update admin.');
        setActionLoading(false);
        return;
      }
      alert(`Admin "${editAdminForm.name}" updated successfully!`);
      setShowEditAdminModal(false);
      fetchAdmins();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Network error while updating admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const openPermAdminModal = (adm) => {
    setTargetAdmin(adm);
    setPermAdminForm(normalizeAdminPermissions(adm.adminPermissions));
    setShowPermAdminModal(true);
  };

  const handleSaveAdminPermissions = async (e) => {
    e.preventDefault();
    if (!targetAdmin) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetAdmin.id,
          adminPermissions: permAdminForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to update admin permissions.');
        setActionLoading(false);
        return;
      }
      alert(`Access & functionality permissions updated for ${targetAdmin.name}!`);
      setShowPermAdminModal(false);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert('Error saving admin permissions.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceLogoutAdmin = async (adm) => {
    if (!confirm(`Are you sure you want to force log out Admin "${adm.name}"? Their active session will be terminated immediately.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adm.id, forceLogout: true }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Admin "${adm.name}" has been logged out.`);
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to log out admin.');
      }
    } catch (err) {
      console.error(err);
      alert('Error logging out admin.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (adm) => {
    if (!confirm(`Are you sure you want to delete Admin "${adm.name}"? Any users they onboarded (${adm.userCount || 0}) will be reassigned to Super Admin.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/admins?id=${adm.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(data.message || 'Admin deleted successfully.');
        if (selectedAdminFilter === adm.id) {
          setSelectedAdminFilter('all');
        }
        fetchAdmins();
        fetchUsers();
      } else {
        alert(data.message || 'Failed to delete admin.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting admin.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- USER CRUD HANDLERS ---
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
        initialDepositDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0],
        accountType: 'Checking',
        status: 'active',
        allowedPages: DEFAULT_PAGES,
        lockedPages: [],
      });
      fetchUsers();
      if (isSuperAdmin) fetchAdmins();
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
      const payload = { id: editUser.id };
      if (canDo('canEditUsers')) {
        payload.name = editUser.name;
        payload.email = editUser.email;
        if (editUser.password) payload.password = editUser.password;
        if (editUser.twoFactorCode) payload.twoFactorCode = editUser.twoFactorCode;
      }
      if (canDo('canManageBalances')) {
        payload.balance = editUser.balance;
        payload.initialDepositDate = editUser.initialDepositDate;
        payload.createdAt = editUser.createdAt;
      }
      if (canDo('canManageStatus')) {
        payload.status = editUser.status;
      }
      if (canDo('canManageMenus')) {
        payload.allowedPages = editUser.allowedPages;
        payload.lockedPages = editUser.lockedPages;
      }
      if (isSuperAdmin && editUser.createdByAdminId) {
        payload.createdByAdminId = editUser.createdByAdminId;
      }

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      if (isSuperAdmin) fetchAdmins();
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('User deleted successfully.');
        fetchUsers();
        if (isSuperAdmin) fetchAdmins();
      } else {
        alert(data.message || 'Failed to delete user.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting user.');
    }
  };

  const openStatusModal = (u) => {
    if (!canDo('canManageStatus')) {
      alert('You do not have permission to change account status.');
      return;
    }
    setStatusUser(u);
    setSelectedStatus(u.status || 'active');
    setShowStatusModal(true);
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusUser) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: statusUser.id, status: selectedStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to update account status.');
        return;
      }
      alert(`Account status for ${statusUser.name} updated to ${selectedStatus.toUpperCase()}.`);
      setShowStatusModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceLogout = async (u) => {
    if (!canDo('canManageStatus')) {
      alert('You do not have permission to force log out users.');
      return;
    }
    if (!confirm(`Are you sure you want to log out ${u.name}? All active sessions across all devices will be immediately terminated.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, forceLogout: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to log out user.');
        return;
      }
      alert(`User ${u.name} has been successfully logged out of all active sessions.`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Error logging out user.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (u) => {
    const cleanAllowed = Array.isArray(u.allowedPages) ? normalizeMenuIds(u.allowedPages) : DEFAULT_CORE_MENU_IDS;
    const cleanLocked = Array.isArray(u.lockedPages) ? normalizeMenuIds(u.lockedPages) : [];

    setEditUser({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      password: '',
      twoFactorCode: '',
      balance: u.totalBalance !== undefined ? String(u.totalBalance) : '',
      initialDepositDate: u.initialDepositDate || u.createdAt || new Date().toISOString().split('T')[0],
      createdAt: u.createdAt || new Date().toISOString().split('T')[0],
      status: u.status || 'active',
      allowedPages: cleanAllowed,
      lockedPages: cleanLocked,
      createdByAdminId: u.createdByAdminId || 'admin-1',
    });
    setShowEditModal(true);
  };

  const openNoticeModal = (u) => {
    if (!canDo('canManageNotices')) {
      alert('You do not have permission to manage user notices and restrictions.');
      return;
    }
    setNoticeUser(u);
    const n = u.notice || {};
    setNoticeForm({
      enabled: Boolean(n.enabled),
      showPopup: n.showPopup !== undefined ? Boolean(n.showPopup) : true,
      sendAsMessage: Boolean(n.sendAsMessage),
      subject: n.subject || n.progressLabel || "Official Account & Compliance Notice",
      sender: n.sender || "Bank of America Executive Compliance",
      category: n.category || "Notices",
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
        setUsers((prev) =>
          prev.map((u) => (u.id === noticeUser.id ? { ...u, notice: { ...noticeForm } } : u))
        );
        alert(`Notice settings for ${noticeUser.name} updated successfully!`);
        setShowNoticeModal(false);
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Failed to save notice settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating notice settings: ' + (err.message || ''));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'active').toLowerCase();
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-neutral-100 text-neutral-600 border-neutral-300',
      pending: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      flagged: 'bg-rose-100 text-rose-700 border-rose-200 font-semibold',
      suspended: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      blocked: 'bg-red-100 text-red-700 border-red-300 font-bold',
    };
    const dotColors = {
      active: 'bg-green-500',
      inactive: 'bg-neutral-400',
      pending: 'bg-amber-500',
      flagged: 'bg-rose-500',
      suspended: 'bg-amber-500',
      blocked: 'bg-red-500',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${styles[s] || styles.active}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[s] || dotColors.active}`}></span>
        {s}
      </span>
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.createdByAdminName?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (isSuperAdmin && selectedAdminFilter !== 'all') {
      const ownerId = u.createdByAdminId || 'admin-1';
      return ownerId === selectedAdminFilter;
    }
    return true;
  });

  const filteredAdmins = admins.filter(
    (a) =>
      a.name?.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(adminSearchQuery.toLowerCase())
  );

  const countGrantedPerms = (permsObj) => {
    const normalized = normalizeAdminPermissions(permsObj);
    return ALL_ADMIN_PERMISSIONS.filter((p) => normalized[p.id]).length;
  };

  const basePath = isSuperAdmin ? '/super-admin' : '/admin';
  const rawTabs = [
    { id: 'users', label: isSuperAdmin ? 'Users & Admins' : 'My Users', icon: Users, path: basePath },
    { id: 'accounts', label: isSuperAdmin ? 'All Accounts' : 'User Accounts', icon: CreditCard, path: `${basePath}/accounts`, perm: 'canViewAccounts' },
    { id: 'transactions', label: isSuperAdmin ? 'All Transactions' : 'User Transactions', icon: History, path: `${basePath}/transactions`, perm: 'canViewTransactions' },
  ];
  const tabs = rawTabs.filter((t) => !t.perm || canDo(t.perm));

  const renderPermissionSelector = (permsState, setPermsState) => {
    const categories = ['User Management', 'Security & Restrictions', 'Accounts & Balances', 'Transactions'];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="block text-xs font-bold text-neutral-800">
              Admin Functionality & Access Control ({countGrantedPerms(permsState)}/{ALL_ADMIN_PERMISSIONS.length} Granted)
            </label>
            <p className="text-[11px] text-neutral-500">Choose what this Admin is allowed to access and perform on their onboarded users.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const allTrue = {};
                ALL_ADMIN_PERMISSIONS.forEach((p) => { allTrue[p.id] = true; });
                setPermsState(allTrue);
              }}
              className="px-2.5 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-semibold border border-green-200"
            >
              Grant All
            </button>
            <button
              type="button"
              onClick={() => {
                const viewOnly = {};
                ALL_ADMIN_PERMISSIONS.forEach((p) => {
                  viewOnly[p.id] = p.id === 'canViewAccounts' || p.id === 'canViewTransactions' || p.id === 'canCreateUsers';
                });
                setPermsState(viewOnly);
              }}
              className="px-2.5 py-1 rounded bg-blue-50 text-primary-blue hover:bg-blue-100 font-semibold border border-blue-200"
            >
              Basic Onboarding Only
            </button>
            <button
              type="button"
              onClick={() => {
                const allFalse = {};
                ALL_ADMIN_PERMISSIONS.forEach((p) => { allFalse[p.id] = false; });
                setPermsState(allFalse);
              }}
              className="px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold border border-red-200"
            >
              Deny All
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto bg-neutral-50 p-3 rounded-bank border border-neutral-200">
          {categories.map((cat) => {
            const catPerms = ALL_ADMIN_PERMISSIONS.filter((p) => p.category === cat);
            return (
              <div key={cat} className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">{cat}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catPerms.map((perm) => {
                    const isGranted = Boolean(permsState[perm.id]);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start justify-between p-2.5 rounded-bank border cursor-pointer transition-all ${
                          isGranted
                            ? 'bg-white border-primary-blue/40 shadow-sm'
                            : 'bg-neutral-100/70 border-neutral-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5 pr-2">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={(e) =>
                              setPermsState({ ...permsState, [perm.id]: e.target.checked })
                            }
                            className="mt-0.5 rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                          />
                          <div>
                            <div className="text-xs font-bold text-neutral-900">{perm.label}</div>
                            <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">{perm.description}</div>
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                            isGranted
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {isGranted ? 'Granted' : 'Denied'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {authLoading ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Loading authentication status...
        </div>
      ) : (!user || !isAnyAdmin) ? (
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
                
                {/* Header & Super Admin Exclusive Controls */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-primary-navy">
                        {isSuperAdmin ? 'Super Admin Command Center' : 'Admin User Management'}
                      </h1>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        isSuperAdmin
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-primary-blue border-blue-200'
                      }`}>
                        {isSuperAdmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <p className="text-neutral-600 text-sm">
                      {isSuperAdmin
                        ? 'Oversee the entire system, onboard and configure Admins, control Website Lock, and view all Admins & their Users.'
                        : 'Create, manage, and configure your users, credentials, balances, and account access.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {isSuperAdmin && (
                      <Button
                        onClick={() => {
                          setActiveSection('admins');
                          setShowAddAdminModal(true);
                        }}
                        className="flex items-center space-x-2 bg-primary-navy text-white px-4 py-2.5 rounded-bank hover:bg-opacity-90 shadow-bank"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Onboard Admin</span>
                      </Button>
                    )}

                    {canDo('canCreateUsers') && (
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 bg-primary-blue text-white px-4 py-2.5 rounded-bank hover:bg-opacity-90 shadow-bank"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Onboard User</span>
                      </Button>
                    )}

                    {/* Website Lock & Spending Overview — EXCLUSIVELY FOR SUPER ADMIN */}
                    {isSuperAdmin && (
                      <>
                        <Card className="p-2 px-4 shadow-sm border border-neutral-200">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-primary-blue" />
                              <span className="text-xs font-semibold text-neutral-700">Website Lock:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                websiteOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {websiteOpen ? 'Open' : 'Locked'}
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
                                    alert(`Website has been ${newStatus ? 'opened' : 'locked'}.`);
                                  } else {
                                    const err = await res.json().catch(() => ({}));
                                    alert(err.message || 'Failed to change website status.');
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="px-3 py-1 text-xs"
                            >
                              {websiteOpen ? <PowerOff className="w-3.5 h-3.5 mr-1 inline" /> : <Power className="w-3.5 h-3.5 mr-1 inline" />}
                              {websiteOpen ? 'Lock Site' : 'Open Site'}
                            </Button>
                          </div>
                        </Card>

                        <Card className="p-2 px-4 shadow-sm border border-neutral-200">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-primary-blue" />
                              <span className="text-xs font-semibold text-neutral-700">Spending Overview:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                showSpendingOverview ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-700'
                              }`}>
                                {showSpendingOverview ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                            <Button
                              variant={showSpendingOverview ? 'danger' : 'primary'}
                              disabled={loadingSpendingToggle}
                              onClick={async () => {
                                const nextVal = !showSpendingOverview;
                                setLoadingSpendingToggle(true);
                                try {
                                  const res = await fetch('/api/website-status', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ showSpendingOverview: nextVal }),
                                  });
                                  if (res.ok) {
                                    setShowSpendingOverview(nextVal);
                                  }
                                } catch (e) {
                                  console.error(e);
                                } finally {
                                  setLoadingSpendingToggle(false);
                                }
                              }}
                              className="px-3 py-1 text-xs"
                            >
                              {showSpendingOverview ? <EyeOff className="w-3.5 h-3.5 mr-1 inline" /> : <Eye className="w-3.5 h-3.5 mr-1 inline" />}
                              {showSpendingOverview ? 'Hide' : 'Show'}
                            </Button>
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                </div>

                {/* Top Navigation Tabs (Users / Accounts / Transactions) */}
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

                {/* Super Admin Sub-View Switcher: Users Overview vs Manage Admins */}
                {isSuperAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection('users')}
                      className={`p-4 rounded-card border text-left transition-all flex items-center justify-between ${
                        activeSection === 'users'
                          ? 'bg-primary-navy text-white border-primary-navy shadow-bank'
                          : 'bg-white text-neutral-800 border-neutral-200 hover:border-primary-blue'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activeSection === 'users' ? 'bg-white/15 text-white' : 'bg-blue-50 text-primary-blue'
                        }`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm sm:text-base">All System Users ({users.length})</div>
                          <div className={`text-xs ${activeSection === 'users' ? 'text-blue-200' : 'text-neutral-500'}`}>
                            View and manage users across all onboarded Admins
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        activeSection === 'users' ? 'bg-primary-blue text-white' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {users.length} Users
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('admins')}
                      className={`p-4 rounded-card border text-left transition-all flex items-center justify-between ${
                        activeSection === 'admins'
                          ? 'bg-primary-navy text-white border-primary-navy shadow-bank'
                          : 'bg-white text-neutral-800 border-neutral-200 hover:border-primary-blue'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activeSection === 'admins' ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm sm:text-base">Manage Onboarded Admins ({admins.length})</div>
                          <div className={`text-xs ${activeSection === 'admins' ? 'text-blue-200' : 'text-neutral-500'}`}>
                            Onboard Admins, grant/deny functionality, and audit their users
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        activeSection === 'admins' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {admins.length} Admins
                      </span>
                    </button>
                  </div>
                )}

                {/* ========================================================= */}
                {/* SECTION 1: SUPER ADMIN — MANAGE ADMINS                    */}
                {/* ========================================================= */}
                {isSuperAdmin && activeSection === 'admins' && (
                  <div className="space-y-4">
                    <Card className="p-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                          <Input
                            placeholder="Search onboarded admins by name or email..."
                            value={adminSearchQuery}
                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                            className="pl-10 text-sm"
                          />
                        </div>
                        <Button
                          onClick={() => setShowAddAdminModal(true)}
                          className="flex items-center justify-center space-x-2 bg-primary-blue text-white px-4 py-2 rounded-bank text-sm"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Onboard New Admin</span>
                        </Button>
                      </div>
                    </Card>

                    <Card
                      title={`Onboarded Administrators (${filteredAdmins.length})`}
                      subtitle="Control each Admin's access permissions, status, login sessions, and inspect the users they onboarded"
                    >
                      {loadingAdmins ? (
                        <div className="text-center py-8 text-neutral-500 text-sm">Loading administrators...</div>
                      ) : filteredAdmins.length === 0 ? (
                        <div className="text-center py-10 space-y-3">
                          <Shield className="w-10 h-10 text-neutral-300 mx-auto" />
                          <div className="text-neutral-600 font-semibold">No onboarded administrators found</div>
                          <p className="text-xs text-neutral-500 max-w-md mx-auto">
                            Click "Onboard New Admin" to create an administrator account and choose which functionalities they can access.
                          </p>
                          <Button onClick={() => setShowAddAdminModal(true)} className="mt-2">
                            Onboard First Admin
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-200">
                          {filteredAdmins.map((adm) => {
                            const grantedCount = countGrantedPerms(adm.adminPermissions);
                            const normalizedPerms = normalizeAdminPermissions(adm.adminPermissions);
                            return (
                              <div key={adm.id} className="py-4 px-2 hover:bg-neutral-50/80 transition-colors space-y-3">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-navy text-amber-300 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                                      {adm.name ? adm.name.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-neutral-900 text-base">{adm.name}</span>
                                        {getStatusBadge(adm.status)}
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-primary-blue border border-blue-200">
                                          {adm.userCount || 0} Users Onboarded
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Managed Balance: ${(Number(adm.totalManagedBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className="text-xs text-neutral-500 mt-0.5">
                                        Email: <span className="font-medium text-neutral-700">{adm.email}</span> • Onboarded: {adm.createdAt || 'N/A'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Admin Action Buttons */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedAdminFilter(adm.id);
                                        setActiveSection('users');
                                      }}
                                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-bank text-xs font-semibold bg-blue-50 text-primary-blue hover:bg-blue-100 border border-blue-200 transition-colors"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>View Users ({adm.userCount || 0})</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openPermAdminModal(adm)}
                                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-bank text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors"
                                    >
                                      <Sliders className="w-3.5 h-3.5 text-amber-700" />
                                      <span>Permissions ({grantedCount}/{ALL_ADMIN_PERMISSIONS.length})</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openEditAdminModal(adm)}
                                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-bank text-xs font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                                      title="Edit Admin Credentials & Status"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleForceLogoutAdmin(adm)}
                                      className="p-1.5 rounded-bank bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                      title="Force Log Out Admin"
                                    >
                                      <LogOut className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdmin(adm)}
                                      className="p-1.5 rounded-bank bg-red-50 text-accent-red hover:bg-red-100 transition-colors"
                                      title="Delete Admin"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Granted vs Denied Permission Pills */}
                                <div className="bg-neutral-50 p-2.5 rounded-bank border border-neutral-200 flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-neutral-600 mr-1">Access Rights:</span>
                                  {ALL_ADMIN_PERMISSIONS.map((perm) => {
                                    const granted = normalizedPerms[perm.id];
                                    return (
                                      <span
                                        key={perm.id}
                                        onClick={() => openPermAdminModal(adm)}
                                        className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-semibold border transition-opacity hover:opacity-80 ${
                                          granted
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : 'bg-red-50 text-red-600 border-red-200 line-through opacity-75'
                                        }`}
                                        title={`${perm.label}: ${granted ? 'Granted' : 'Denied'} (Click to configure)`}
                                      >
                                        {perm.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* ========================================================= */}
                {/* SECTION 2: USERS OVERVIEW (SUPER ADMIN & REGULAR ADMIN)   */}
                {/* ========================================================= */}
                {(!isSuperAdmin || activeSection === 'users') && (
                  <>
                    {/* Search & Super Admin Filter by Admin */}
                    <Card className="p-3">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                          <Input
                            placeholder={isSuperAdmin ? "Search users by name, email, or onboarding admin..." : "Search your users by name or email..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 text-sm"
                          />
                        </div>

                        {isSuperAdmin && (
                          <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                            <span className="text-xs font-semibold text-neutral-600 whitespace-nowrap">Filter by Admin:</span>
                            <select
                              value={selectedAdminFilter}
                              onChange={(e) => setSelectedAdminFilter(e.target.value)}
                              className="input-field text-xs sm:text-sm py-2 min-w-[210px]"
                            >
                              <option value="all">All Users (System-Wide: {users.length})</option>
                              <option value="admin-1">
                                Super Administrator ({users.filter((u) => (u.createdByAdminId || 'admin-1') === 'admin-1').length})
                              </option>
                              {admins.map((adm) => (
                                <option key={adm.id} value={adm.id}>
                                  {adm.name} ({users.filter((u) => u.createdByAdminId === adm.id).length} users)
                                </option>
                              ))}
                            </select>
                            {selectedAdminFilter !== 'all' && (
                              <button
                                type="button"
                                onClick={() => setSelectedAdminFilter('all')}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-bank"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Users Table */}
                    <Card 
                      title={
                        isSuperAdmin
                          ? selectedAdminFilter === 'all'
                            ? `All System Users (${filteredUsers.length})`
                            : `Users Onboarded by ${
                                selectedAdminFilter === 'admin-1'
                                  ? 'Super Administrator'
                                  : admins.find((a) => a.id === selectedAdminFilter)?.name || 'Selected Admin'
                              } (${filteredUsers.length})`
                          : `Your Onboarded Users (${filteredUsers.length})`
                      }
                      subtitle={
                        isSuperAdmin
                          ? 'Super Admin view of all users, their onboarding Admin, credentials, balances, and restrictions'
                          : 'Manage users you have onboarded'
                      }
                    >
                      {/* Desktop Table (Hidden on Mobile) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 text-sm">
                          <thead>
                            <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                              <th className="text-left py-3 px-4 font-semibold">User</th>
                              <th className="text-left py-3 px-4 font-semibold">Email</th>
                              {isSuperAdmin && (
                                <th className="text-left py-3 px-4 font-semibold">Onboarded By</th>
                              )}
                              <th className="text-left py-3 px-4 font-semibold">2FA Code</th>
                              <th className="text-left py-3 px-4 font-semibold">Total Balance</th>
                              <th className="text-left py-3 px-4 font-semibold">Status</th>
                              <th className="text-right py-3 px-4 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {loadingUsers ? (
                              <tr>
                                <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-neutral-500">
                                  Loading users...
                                </td>
                              </tr>
                            ) : filteredUsers.length === 0 ? (
                              <tr>
                                <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-neutral-500">
                                  No users found.
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
                                        <div className="flex items-center space-x-1.5 text-xs text-neutral-500 font-mono">
                                          <span>{u.primaryAccount ? u.primaryAccount.accountNumber : 'No account'}</span>
                                          {u.lockedPages && u.lockedPages.length > 0 && (
                                            <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-sans" title={`Locked menus: ${u.lockedPages.join(', ')}`}>
                                              <Lock className="w-2.5 h-2.5 mr-0.5" />
                                              {u.lockedPages.length} Locked
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-neutral-700">{u.email}</td>
                                  {isSuperAdmin && (
                                    <td className="py-3 px-4">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAdminFilter(u.createdByAdminId || 'admin-1')}
                                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                                          (u.createdByAdminId || 'admin-1') === 'admin-1'
                                            ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                            : 'bg-blue-50 text-primary-blue border-blue-200 hover:bg-blue-100'
                                        }`}
                                        title="Click to filter users by this Admin"
                                      >
                                        <Shield className="w-3 h-3 mr-1" />
                                        <span>{u.createdByAdminName || 'Super Administrator'}</span>
                                      </button>
                                    </td>
                                  )}
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-primary-blue border border-blue-200">
                                      <Key className="w-3 h-3 mr-1" />
                                      {u.twoFactorCode ? (u.twoFactorCode.startsWith('pbkdf2:') ? '••••••' : u.twoFactorCode) : 'Enabled'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-neutral-900">
                                    ${(Number(u.totalBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4">
                                    {canDo('canManageStatus') ? (
                                      <button
                                        type="button"
                                        onClick={() => openStatusModal(u)}
                                        className="hover:opacity-80 transition-opacity"
                                        title="Click to manage account status"
                                      >
                                        {getStatusBadge(u.status)}
                                      </button>
                                    ) : (
                                      getStatusBadge(u.status)
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      {canDo('canManageNotices') && (
                                        <button
                                          onClick={() => openNoticeModal(u)}
                                          className={`p-1.5 rounded transition-colors ${
                                            u.notice?.enabled
                                              ? u.notice?.showPopup === false
                                                ? 'text-amber-700 bg-amber-100 hover:bg-amber-200 ring-1 ring-amber-400'
                                                : 'text-accent-red bg-red-100 hover:bg-red-200 ring-1 ring-red-400'
                                              : u.notice?.sendAsMessage
                                                ? 'text-primary-blue bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-400'
                                                : 'text-neutral-500 hover:text-accent-red hover:bg-neutral-100'
                                          }`}
                                          title={
                                            u.notice?.enabled
                                              ? u.notice?.showPopup === false
                                                ? 'Active: Dashboard Banner' + (u.notice?.sendAsMessage ? ' + Inbox Message' : '')
                                                : 'Active: Pop-up Prompt' + (u.notice?.sendAsMessage ? ' + Inbox Message' : '')
                                              : u.notice?.sendAsMessage
                                                ? 'Active: Sent to User Message Box & Notifications'
                                                : 'Send Notice as Prompt or Message'
                                          }
                                        >
                                          <AlertTriangle className="w-4 h-4" />
                                        </button>
                                      )}
                                      {canDo('canManageStatus') && (
                                        <button
                                          onClick={() => openStatusModal(u)}
                                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                          title="Manage Account Status (Block / Suspend / Activate)"
                                        >
                                          <ShieldAlert className="w-4 h-4" />
                                        </button>
                                      )}
                                      {(canDo('canEditUsers') || canDo('canManageBalances') || canDo('canManageMenus')) && (
                                        <button
                                          onClick={() => openEditModal(u)}
                                          className="p-1.5 text-primary-blue hover:bg-blue-50 rounded transition-colors"
                                          title="Edit User & Balance"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                      )}
                                      {canDo('canManageStatus') && (
                                        <button
                                          onClick={() => handleForceLogout(u)}
                                          className="p-1.5 text-amber-700 hover:bg-amber-100 rounded transition-colors"
                                          title="Force Log Out User (Terminate Session)"
                                        >
                                          <LogOut className="w-4 h-4" />
                                        </button>
                                      )}
                                      {canDo('canDeleteUsers') && (
                                        <button
                                          onClick={() => handleDeleteUser(u.id, u.name)}
                                          className="p-1.5 text-accent-red hover:bg-red-50 rounded transition-colors"
                                          title="Delete User"
                                        >
                                          <Trash2 className="w-4 h-4" />
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

                      {/* Mobile Cards View (Visible on Phones below md) */}
                      <div className="md:hidden divide-y divide-neutral-200">
                        {loadingUsers ? (
                          <div className="text-center py-8 text-neutral-500 text-sm">Loading users...</div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="text-center py-8 text-neutral-500 text-sm">No users found.</div>
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
                                {isSuperAdmin && (
                                  <div className="flex justify-between items-center pb-1.5 border-b border-neutral-200">
                                    <span className="text-neutral-500">Onboarded By:</span>
                                    <span className="font-semibold text-primary-navy">{u.createdByAdminName || 'Super Administrator'}</span>
                                  </div>
                                )}
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
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                                {canDo('canManageNotices') && (
                                  <button
                                    onClick={() => openNoticeModal(u)}
                                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                                      u.notice?.enabled
                                        ? u.notice?.showPopup === false
                                          ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-400'
                                          : 'bg-red-100 text-accent-red ring-1 ring-red-400'
                                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                    }`}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Notice</span>
                                  </button>
                                )}

                                {canDo('canManageStatus') && (
                                  <button
                                    onClick={() => openStatusModal(u)}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-xs font-semibold transition-colors"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>Status</span>
                                  </button>
                                )}

                                {(canDo('canEditUsers') || canDo('canManageBalances') || canDo('canManageMenus')) && (
                                  <button
                                    onClick={() => openEditModal(u)}
                                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 text-primary-blue hover:bg-blue-100 rounded text-xs font-semibold transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                )}

                                {canDo('canManageStatus') && (
                                  <button
                                    onClick={() => handleForceLogout(u)}
                                    className="p-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded transition-colors"
                                    title="Force Log Out User"
                                  >
                                    <LogOut className="w-4 h-4" />
                                  </button>
                                )}

                                {canDo('canDeleteUsers') && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="p-1.5 bg-red-50 text-accent-red hover:bg-red-100 rounded transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </>
                )}

              </div>
            </main>
          </div>

          {/* ========================================================= */}
          {/* SUPER ADMIN MODAL 1: ONBOARD NEW ADMIN                    */}
          {/* ========================================================= */}
          {isSuperAdmin && showAddAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 relative border-t-4 border-primary-navy">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <Shield className="w-6 h-6 text-primary-navy" />
                    <div>
                      <h3 className="text-xl font-bold text-primary-navy">Onboard New Administrator</h3>
                      <p className="text-xs text-neutral-500">Create an Admin account and select the exact functionalities they can access.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddAdminModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Admin Full Name *</label>
                      <Input
                        required
                        placeholder="e.g. Kwame Mensah"
                        value={newAdminForm.name}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Admin Email (Login Username) *</label>
                      <Input
                        type="email"
                        required
                        placeholder="e.g. officer.admin@bankofamerica.com"
                        value={newAdminForm.email}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Admin Login Password *</label>
                      <Input
                        type="text"
                        required
                        placeholder="Enter strong password"
                        value={newAdminForm.password}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Admin Account Status</label>
                      <select
                        value={newAdminForm.status}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, status: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="blocked">Blocked</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200">
                    {renderPermissionSelector(
                      newAdminForm.adminPermissions,
                      (updatedPerms) => setNewAdminForm({ ...newAdminForm, adminPermissions: updatedPerms })
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button variant="secondary" type="button" onClick={() => setShowAddAdminModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Onboarding Admin...' : 'Onboard Admin & Grant Selected Access'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUPER ADMIN MODAL 2: CONFIGURE ADMIN PERMISSIONS          */}
          {/* ========================================================= */}
          {isSuperAdmin && showPermAdminModal && targetAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 relative border-t-4 border-amber-500">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <Sliders className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="text-xl font-bold text-primary-navy">Admin Functionality & Access Control</h3>
                      <p className="text-xs text-neutral-500">
                        Configuring access for <span className="font-bold text-neutral-800">{targetAdmin.name}</span> ({targetAdmin.email})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowPermAdminModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAdminPermissions} className="space-y-4">
                  {renderPermissionSelector(permAdminForm, setPermAdminForm)}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button variant="secondary" type="button" onClick={() => setShowPermAdminModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Saving Access Rights...' : 'Save Admin Access Permissions'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUPER ADMIN MODAL 3: EDIT ADMIN DETAILS & STATUS          */}
          {/* ========================================================= */}
          {isSuperAdmin && showEditAdminModal && targetAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-md w-full p-6 relative">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <Edit className="w-5 h-5 text-primary-blue" />
                    <h3 className="text-lg font-bold text-primary-navy">Edit Administrator</h3>
                  </div>
                  <button onClick={() => setShowEditAdminModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Admin Name *</label>
                    <Input
                      required
                      value={editAdminForm.name}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Admin Email *</label>
                    <Input
                      type="email"
                      required
                      value={editAdminForm.email}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">New Password (leave blank to keep current)</label>
                    <Input
                      type="text"
                      placeholder="Enter new password to reset"
                      value={editAdminForm.password}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Admin Status</label>
                    <select
                      value={editAdminForm.status}
                      onChange={(e) => setEditAdminForm({ ...editAdminForm, status: e.target.value })}
                      className="input-field text-sm"
                    >
                      <option value="active">Active (Can Log In & Manage Their Users)</option>
                      <option value="suspended">Suspended (Login Blocked)</option>
                      <option value="blocked">Blocked (Strict Lockout)</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button variant="secondary" type="button" onClick={() => setShowEditAdminModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Update Admin'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADD USER MODAL */}
          {showAddModal && canDo('canCreateUsers') && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-5 h-5 text-primary-blue" />
                    <h3 className="text-xl font-bold text-primary-navy">Onboard New Bank User</h3>
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
                        placeholder="6-digit security code"
                        value={newUser.twoFactorCode}
                        onChange={(e) => setNewUser({ ...newUser, twoFactorCode: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Deposit Date *</label>
                      <Input
                        type="date"
                        required
                        value={newUser.initialDepositDate}
                        onChange={(e) => setNewUser({ ...newUser, initialDepositDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Opening Date *</label>
                      <Input
                        type="date"
                        required
                        value={newUser.createdAt}
                        onChange={(e) => setNewUser({ ...newUser, createdAt: e.target.value })}
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
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">Account Status</label>
                      <select
                        value={newUser.status || 'active'}
                        onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
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
                  </div>

                  {/* Dashboard Modules / Pages Permission & Locks */}
                  {canDo('canManageMenus') && (
                    <div className="pt-2 border-t border-neutral-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-neutral-800">
                            Sidebar Menus & Access Control ({newUser.allowedPages.length}/{ALL_AVAILABLE_PAGES.length} Visible, {newUser.lockedPages?.length || 0} Locked)
                          </label>
                          <p className="text-[11px] text-neutral-500">Check to display on sidebar. Toggle the Lock to restrict user access.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, allowedPages: ALL_MENU_IDS })}
                            className="px-2 py-0.5 rounded bg-blue-50 text-primary-blue hover:bg-blue-100 font-semibold"
                          >
                            Show All
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, allowedPages: DEFAULT_CORE_MENU_IDS })}
                            className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          >
                            Core Only
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, lockedPages: ALL_MENU_IDS.filter(p => p !== 'dashboard') })}
                            className="px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold"
                          >
                            Lock All
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, lockedPages: [] })}
                            className="px-2 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 font-semibold"
                          >
                            Unlock All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-bank border border-neutral-200 max-h-60 overflow-y-auto">
                        {ALL_AVAILABLE_PAGES.map((page) => {
                          const isVisible = newUser.allowedPages.includes(page.id);
                          const isLocked = newUser.lockedPages?.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              className={`flex items-center justify-between p-2 rounded border transition-all ${
                                !isVisible 
                                  ? 'bg-neutral-100/70 border-neutral-200 opacity-60' 
                                  : isLocked
                                    ? 'bg-amber-50 border-amber-300 shadow-sm'
                                    : 'bg-white border-neutral-200 hover:border-blue-300'
                              }`}
                            >
                              <label className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0 mr-1.5">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewUser({ ...newUser, allowedPages: [...newUser.allowedPages, page.id] });
                                    } else {
                                      setNewUser({ ...newUser, allowedPages: newUser.allowedPages.filter((p) => p !== page.id) });
                                    }
                                  }}
                                  className="rounded text-primary-blue focus:ring-primary-blue h-3.5 w-3.5"
                                />
                                <span className="text-xs font-medium text-neutral-800 truncate">{page.label}</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentLocks = newUser.lockedPages || [];
                                  const updated = isLocked ? currentLocks.filter(p => p !== page.id) : [...currentLocks, page.id];
                                  setNewUser({ ...newUser, lockedPages: updated });
                                }}
                                title={isLocked ? "Unlock service" : "Lock service (user cannot access)"}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 transition-all ${
                                  isLocked
                                    ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                                    : 'bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300'
                                }`}
                              >
                                {isLocked ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>LOCKED</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 text-neutral-500" />
                                    <span>OPEN</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                    <h3 className="text-xl font-bold text-primary-navy">Edit User & Account Settings</h3>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-4">
                  {isSuperAdmin && (
                    <div className="p-3 bg-amber-50/70 rounded-bank border border-amber-200">
                      <label className="block text-xs font-bold text-amber-900 mb-1">Assigned Admin (Onboarded By)</label>
                      <select
                        value={editUser.createdByAdminId || 'admin-1'}
                        onChange={(e) => setEditUser({ ...editUser, createdByAdminId: e.target.value })}
                        className="input-field text-xs sm:text-sm bg-white"
                      >
                        <option value="admin-1">Super Administrator</option>
                        {admins.map((adm) => (
                          <option key={adm.id} value={adm.id}>
                            {adm.name} ({adm.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {canDo('canEditUsers') && (
                    <>
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
                            placeholder="Enter new 6-digit 2FA"
                            value={editUser.twoFactorCode}
                            onChange={(e) => setEditUser({ ...editUser, twoFactorCode: e.target.value.replace(/\D/g, '') })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {canDo('canManageBalances') && (
                      <>
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
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">Deposit Date</label>
                          <Input
                            type="date"
                            value={editUser.initialDepositDate}
                            onChange={(e) => setEditUser({ ...editUser, initialDepositDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">Opening Date</label>
                          <Input
                            type="date"
                            value={editUser.createdAt}
                            onChange={(e) => setEditUser({ ...editUser, createdAt: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {canDo('canManageStatus') && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Account Status</label>
                        <select
                          value={editUser.status}
                          onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
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
                  </div>

                  {/* Dashboard Modules / Pages Permission & Locks */}
                  {canDo('canManageMenus') && (
                    <div className="pt-2 border-t border-neutral-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-neutral-800">
                            Sidebar Menus & Access Control ({editUser.allowedPages?.length || 0}/{ALL_AVAILABLE_PAGES.length} Visible, {editUser.lockedPages?.length || 0} Locked)
                          </label>
                          <p className="text-[11px] text-neutral-500">Check to display on sidebar. Toggle the Lock to restrict user access.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setEditUser({ ...editUser, allowedPages: ALL_MENU_IDS })}
                            className="px-2 py-0.5 rounded bg-blue-50 text-primary-blue hover:bg-blue-100 font-semibold"
                          >
                            Show All
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditUser({ ...editUser, allowedPages: DEFAULT_CORE_MENU_IDS })}
                            className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          >
                            Core Only
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditUser({ ...editUser, lockedPages: ALL_MENU_IDS.filter(p => p !== 'dashboard') })}
                            className="px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold"
                          >
                            Lock All
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditUser({ ...editUser, lockedPages: [] })}
                            className="px-2 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 font-semibold"
                          >
                            Unlock All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-bank border border-neutral-200 max-h-60 overflow-y-auto">
                        {ALL_AVAILABLE_PAGES.map((page) => {
                          const isVisible = editUser.allowedPages?.includes(page.id);
                          const isLocked = editUser.lockedPages?.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              className={`flex items-center justify-between p-2 rounded border transition-all ${
                                !isVisible 
                                  ? 'bg-neutral-100/70 border-neutral-200 opacity-60' 
                                  : isLocked
                                    ? 'bg-amber-50 border-amber-300 shadow-sm'
                                    : 'bg-white border-neutral-200 hover:border-blue-300'
                              }`}
                            >
                              <label className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0 mr-1.5">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
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
                                <span className="text-xs font-medium text-neutral-800 truncate">{page.label}</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentLocks = editUser.lockedPages || [];
                                  const updated = isLocked ? currentLocks.filter(p => p !== page.id) : [...currentLocks, page.id];
                                  setEditUser({ ...editUser, lockedPages: updated });
                                }}
                                title={isLocked ? "Unlock service" : "Lock service (user cannot access)"}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 transition-all ${
                                  isLocked
                                    ? 'bg-red-500 text-white shadow-sm hover:bg-red-600'
                                    : 'bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300'
                                }`}
                              >
                                {isLocked ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>LOCKED</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 text-neutral-500" />
                                    <span>OPEN</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                    When active, this warning will appear on their dashboard and block access to Transaction History & Transfers.
                  </div>
                </div>

                <form onSubmit={handleSaveNotice} className="space-y-4">
                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold text-neutral-700">Notice Delivery Channel (Choose Prompt, Message Box, or Both)</label>

                    {/* Mode 1: Send as Dashboard Prompt (With Pop-up) */}
                    <div className={`flex items-center justify-between p-3 rounded-bank border transition-all ${
                      noticeForm.enabled && noticeForm.showPopup !== false
                        ? 'bg-red-50/80 border-red-300 shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/60'
                    }`}>
                      <div className="pr-3">
                        <div className="text-xs font-bold text-neutral-900 flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${noticeForm.enabled && noticeForm.showPopup !== false ? 'bg-red-500' : 'bg-neutral-400'}`} />
                          <span>Send as Dashboard Prompt (With Pop-up Alert)</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Pops up as a modal prompt on login & displays the restriction banner on the user's dashboard.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(noticeForm.enabled && noticeForm.showPopup !== false)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNoticeForm({ ...noticeForm, enabled: true, showPopup: true });
                            } else {
                              setNoticeForm({ ...noticeForm, enabled: false, showPopup: false });
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-red"></div>
                      </label>
                    </div>

                    {/* Mode 2: Dashboard Warning Banner Only (Without Pop-up) */}
                    <div className={`flex items-center justify-between p-3 rounded-bank border transition-all ${
                      noticeForm.enabled && noticeForm.showPopup === false
                        ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/60'
                    }`}>
                      <div className="pr-3">
                        <div className="text-xs font-bold text-neutral-900 flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${noticeForm.enabled && noticeForm.showPopup === false ? 'bg-amber-500' : 'bg-neutral-400'}`} />
                          <span>Enable Restriction Warning Banner (Without Pop-up)</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Displays restriction warning banner on dashboard only — NO pop-up dialog will appear.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(noticeForm.enabled && noticeForm.showPopup === false)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNoticeForm({ ...noticeForm, enabled: true, showPopup: false });
                            } else {
                              setNoticeForm({ ...noticeForm, enabled: false, showPopup: false });
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {/* Mode 3: Send as Message to User Message Box & Notifications */}
                    <div className={`flex items-center justify-between p-3 rounded-bank border transition-all ${
                      noticeForm.sendAsMessage
                        ? 'bg-blue-50/80 border-primary-blue shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/60'
                    }`}>
                      <div className="pr-3">
                        <div className="text-xs font-bold text-neutral-900 flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${noticeForm.sendAsMessage ? 'bg-primary-blue' : 'bg-neutral-400'}`} />
                          <span>Send as Message to User Message Box & Notifications</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Delivers this notice to the user's Secure Message Center inbox & lights up their Notification Bell. Can be used alone or combined with a Dashboard Prompt.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(noticeForm.sendAsMessage)}
                          onChange={(e) => {
                            setNoticeForm({ ...noticeForm, sendAsMessage: e.target.checked });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                      </label>
                    </div>

                    {/* Extra Message Metadata Fields when sendAsMessage is enabled */}
                    {noticeForm.sendAsMessage && (
                      <div className="p-3 bg-blue-50/50 rounded-bank border border-blue-200 space-y-3 animate-fade-in">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">Message Subject / Notification Title *</label>
                          <Input
                            type="text"
                            required={Boolean(noticeForm.sendAsMessage)}
                            value={noticeForm.subject || ''}
                            onChange={(e) => setNoticeForm({ ...noticeForm, subject: e.target.value })}
                            placeholder="e.g. Official Account & Compliance Notice"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">Sender / Department</label>
                            <Input
                              type="text"
                              value={noticeForm.sender || ''}
                              onChange={(e) => setNoticeForm({ ...noticeForm, sender: e.target.value })}
                              placeholder="e.g. Bank of America Executive Compliance"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">Inbox Category</label>
                            <select
                              value={noticeForm.category || 'Notices'}
                              onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                              className="input-field text-xs sm:text-sm"
                            >
                              <option value="Notices">Official Notices</option>
                              <option value="Security">Security Alerts</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
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

          {/* MANAGE STATUS & FORCE LOGOUT MODAL */}
          {showStatusModal && statusUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-md w-full p-6 relative">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary-navy">Account Status & Session</h3>
                      <p className="text-xs text-neutral-500">{statusUser.name} • {statusUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowStatusModal(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveStatus} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-2">Select Account Status</label>
                    <div className="space-y-2">
                      {[
                        {
                          val: 'active',
                          label: 'Active',
                          desc: 'Full access to online banking, dashboard, and wire transfers.',
                          badgeClass: 'bg-green-100 text-green-700 border-green-200',
                          borderActive: 'border-green-500 bg-green-50/50',
                        },
                        {
                          val: 'inactive',
                          label: 'Inactive',
                          desc: 'Account is dormant or inactive. Access restricted until reactivated.',
                          badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-300',
                          borderActive: 'border-neutral-500 bg-neutral-50/50',
                        },
                        {
                          val: 'pending',
                          label: 'Pending',
                          desc: 'Account verification or approval pending.',
                          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
                          borderActive: 'border-amber-500 bg-amber-50/50',
                        },
                        {
                          val: 'flagged',
                          label: 'Flagged / Restricted',
                          desc: 'Flagged for compliance review with warning notice enabled.',
                          badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
                          borderActive: 'border-rose-500 bg-rose-50/50',
                        },
                        {
                          val: 'suspended',
                          label: 'Suspended',
                          desc: 'Temporarily freeze account. User cannot transact or view portfolio.',
                          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
                          borderActive: 'border-amber-500 bg-amber-50/50',
                        },
                        {
                          val: 'blocked',
                          label: 'Blocked',
                          desc: 'Strict lockout. Access denied and all active sessions are revoked.',
                          badgeClass: 'bg-red-100 text-red-700 border-red-300',
                          borderActive: 'border-red-500 bg-red-50/50',
                        },
                      ].map((s) => (
                        <label
                          key={s.val}
                          className={`flex items-start p-3 rounded-bank border cursor-pointer transition-all ${
                            selectedStatus === s.val ? s.borderActive + ' shadow-sm' : 'border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="userStatusRadio"
                            value={s.val}
                            checked={selectedStatus === s.val}
                            onChange={() => setSelectedStatus(s.val)}
                            className="mt-1 text-primary-navy focus:ring-primary-navy"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-neutral-800">{s.label}</span>
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold uppercase border ${s.badgeClass}`}>
                                {s.val}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">{s.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Force Log Out Action Section */}
                  <div className="p-3 bg-neutral-50 rounded-bank border border-neutral-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                        <LogOut className="w-3.5 h-3.5 text-amber-600" />
                        <span>Force Log Out User</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">Terminate all active device sessions immediately.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleForceLogout(statusUser)}
                      className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-semibold transition-colors"
                    >
                      Log Out Now
                    </button>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button variant="secondary" type="button" onClick={() => setShowStatusModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Apply Status'}
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
        destination: '/super-admin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
