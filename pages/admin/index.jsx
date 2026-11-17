'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
  UserCheck,
  Sliders,
  Filter,
  MessageSquare,
  Mail,
  Send,
  Activity,
  Building2,
  CheckCircle2,
  Sparkles,
  Globe,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/router';
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
  const [statusQuickFilter, setStatusQuickFilter] = useState('all'); // 'all' | 'active' | 'restricted' | 'unread'
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
  const [showAdminStatusModal, setShowAdminStatusModal] = useState(false);
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

  const [adminStatusForm, setAdminStatusForm] = useState({
    id: '',
    name: '',
    status: 'active',
    forceLogout: true,
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

  // Support Chat & Corporate Email Modal State
  const [showSupportChatModal, setShowSupportChatModal] = useState(false);
  const [supportChatUser, setSupportChatUser] = useState(null);
  const [adminSupportChat, setAdminSupportChat] = useState({
    corporateEmail: 'concierge.desk@bankofamerica.com',
    advisorName: 'Bank of America Client Care Desk',
    messages: [],
    unreadByAdmin: 0,
  });
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminCorpEmailInput, setAdminCorpEmailInput] = useState('concierge.desk@bankofamerica.com');
  const [adminAdvisorNameInput, setAdminAdvisorNameInput] = useState('Bank of America Client Care Desk');
  const [sendingAdminReply, setSendingAdminReply] = useState(false);
  const [savingCorpEmail, setSavingCorpEmail] = useState(false);
  const [corpEmailSavedToast, setCorpEmailSavedToast] = useState(false);
  const adminChatEndRef = useRef(null);

  // Admin First-Login / Self-Service Password Change Modal State
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [isFirstLoginPrompt, setIsFirstLoginPrompt] = useState(false);
  const [adminPassForm, setAdminPassForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [changingAdminPass, setChangingAdminPass] = useState(false);

  // Helper to check granular permission for the logged-in admin
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

  // Fetch users from API
  const fetchUsers = async (silent = false) => {
    if (!silent) setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.adminContext?.permissions) {
          setLivePermissions(data.adminContext.permissions);
          if (updateUser) {
            updateUser({
              adminPermissions: data.adminContext.permissions,
              mustChangePassword: Boolean(data.adminContext.permissions.mustChangePassword),
            });
          }
          if (data.adminContext.permissions.mustChangePassword) {
            setIsFirstLoginPrompt(true);
            setShowAdminPassModal(true);
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        if (
          res.status === 401 ||
          errData.message?.toLowerCase().includes('session') ||
          errData.message?.toLowerCase().includes('restricted')
        ) {
          logout();
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      if (!silent) setLoadingUsers(false);
    }
  };

  // Background poll users every 10 seconds to update unread Support Chat badges
  useEffect(() => {
    if (!user || !isAnyAdmin) return;
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.id, isAnyAdmin]);

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

  // Open Support Chat modal for a specific user
  const openSupportChatModal = async (targetUser) => {
    setSupportChatUser(targetUser);
    const existingChat = targetUser.supportChat || {
      corporateEmail: 'concierge.desk@bankofamerica.com',
      advisorName: 'Bank of America Client Care Desk',
      messages: [],
      unreadByAdmin: 0,
    };
    setAdminSupportChat(existingChat);
    setAdminCorpEmailInput(existingChat.corporateEmail || 'concierge.desk@bankofamerica.com');
    setAdminAdvisorNameInput(existingChat.advisorName || 'Bank of America Client Care Desk');
    setAdminReplyText('');
    setShowSupportChatModal(true);

    try {
      const res = await fetch(`/api/support?userId=${encodeURIComponent(targetUser.id)}&markRead=admin`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.supportChat) {
          setAdminSupportChat(data.supportChat);
          setAdminCorpEmailInput(data.supportChat.corporateEmail || 'concierge.desk@bankofamerica.com');
          setAdminAdvisorNameInput(data.supportChat.advisorName || 'Bank of America Client Care Desk');
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUser.id ? { ...u, supportChat: data.supportChat } : u))
          );
        }
      }
    } catch (_) {}
  };

  // Poll active user's support chat while modal is open
  useEffect(() => {
    if (!showSupportChatModal || !supportChatUser?.id) return;
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support?userId=${encodeURIComponent(supportChatUser.id)}&markRead=admin`, {
          cache: 'no-store',
        });
        if (!isMounted || !res.ok) return;
        const data = await res.json();
        if (isMounted && data.supportChat) {
          setAdminSupportChat(data.supportChat);
          setUsers((prev) =>
            prev.map((u) => (u.id === supportChatUser.id ? { ...u, supportChat: data.supportChat } : u))
          );
        }
      } catch (_) {}
    }, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showSupportChatModal, supportChatUser?.id]);

  useEffect(() => {
    if (showSupportChatModal && adminChatEndRef.current) {
      adminChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showSupportChatModal, adminSupportChat.messages?.length]);

  const handleSaveCorporateEmail = async () => {
    if (!supportChatUser?.id || savingCorpEmail) return;
    setSavingCorpEmail(true);
    try {
      const res = await fetch('/api/support', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: supportChatUser.id,
          corporateEmail: adminCorpEmailInput.trim() || 'concierge.desk@bankofamerica.com',
          advisorName: adminAdvisorNameInput.trim() || 'Bank of America Client Care Desk',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.supportChat) {
          setAdminSupportChat(data.supportChat);
          setUsers((prev) =>
            prev.map((u) => (u.id === supportChatUser.id ? { ...u, supportChat: data.supportChat } : u))
          );
          setCorpEmailSavedToast(true);
          setTimeout(() => setCorpEmailSavedToast(false), 2500);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to update support configuration.');
      }
    } catch (_) {
      alert('Network error while saving support configuration.');
    } finally {
      setSavingCorpEmail(false);
    }
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!supportChatUser?.id || !adminReplyText.trim() || sendingAdminReply) return;
    const textToSend = adminReplyText.trim();
    setSendingAdminReply(true);
    setAdminReplyText('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: supportChatUser.id,
          text: textToSend,
          corporateEmail: adminCorpEmailInput.trim() || 'concierge.desk@bankofamerica.com',
          advisorName: adminAdvisorNameInput.trim() || 'Bank of America Client Care Desk',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.supportChat) {
          setAdminSupportChat(data.supportChat);
          setUsers((prev) =>
            prev.map((u) => (u.id === supportChatUser.id ? { ...u, supportChat: data.supportChat } : u))
          );
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to send reply.');
        setAdminReplyText(textToSend);
      }
    } catch (_) {
      alert('Network error while sending reply.');
      setAdminReplyText(textToSend);
    } finally {
      setSendingAdminReply(false);
    }
  };

  // Admin self-service password change
  const handleAdminSelfPasswordChange = async (e) => {
    e.preventDefault();
    if (!adminPassForm.newPassword || adminPassForm.newPassword.trim().length < 6) {
      alert('New password must be at least 6 characters long.');
      return;
    }
    if (adminPassForm.newPassword.trim() !== adminPassForm.confirmPassword.trim()) {
      alert('Passwords do not match. Please confirm your new password.');
      return;
    }

    setChangingAdminPass(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: adminPassForm.newPassword.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || 'Failed to update password.');
        setChangingAdminPass(false);
        return;
      }

      if (data.user && updateUser) {
        updateUser({
          ...data.user,
          mustChangePassword: false,
        });
      }
      if (data.user?.adminPermissions) {
        setLivePermissions(data.user.adminPermissions);
      }
      setAdminPassForm({ newPassword: '', confirmPassword: '' });
      setIsFirstLoginPrompt(false);
      setShowAdminPassModal(false);
      alert('Your administrator password has been updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Network error while updating password.');
    } finally {
      setChangingAdminPass(false);
    }
  };

  const handleDismissFirstLoginPass = async () => {
    setChangingAdminPass(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissOnly: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user && updateUser) {
        updateUser({
          ...data.user,
          mustChangePassword: false,
        });
        if (data.user.adminPermissions) {
          setLivePermissions(data.user.adminPermissions);
        }
      }
    } catch (_) {
    } finally {
      setChangingAdminPass(false);
      setIsFirstLoginPrompt(false);
      setShowAdminPassModal(false);
    }
  };

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

  const openAdminStatusModal = (adm) => {
    setTargetAdmin(adm);
    setAdminStatusForm({
      id: adm.id,
      name: adm.name || adm.email || 'Admin',
      status: adm.status || 'active',
      forceLogout: true,
    });
    setShowAdminStatusModal(true);
  };

  const handleUpdateAdminStatus = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminStatusForm.id,
          status: adminStatusForm.status,
          forceLogout: adminStatusForm.forceLogout,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to update admin status.');
        setActionLoading(false);
        return;
      }
      alert(`Admin "${adminStatusForm.name}" status updated to ${adminStatusForm.status.toUpperCase()}!`);
      setShowAdminStatusModal(false);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert('Network error while updating admin status.');
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
    if (
      !confirm(
        `Are you sure you want to force log out Admin "${adm.name}"? Their active session will be terminated immediately.`
      )
    ) {
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
    if (
      !confirm(
        `Are you sure you want to delete Admin "${adm.name}"? Any users they onboarded (${adm.usersCount || adm.userCount || 0}) will be reassigned to Super Admin.`
      )
    ) {
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
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This will remove all their accounts and transactions.`
      )
    ) {
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
    if (
      !confirm(
        `Are you sure you want to log out ${u.name}? All active sessions across all devices will be immediately terminated.`
      )
    ) {
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
    const cleanAllowed = Array.isArray(u.allowedPages)
      ? normalizeMenuIds(u.allowedPages)
      : DEFAULT_CORE_MENU_IDS;
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
      subject: n.subject || n.progressLabel || 'Official Account & Compliance Notice',
      sender: n.sender || 'Bank of America Executive Compliance',
      category: n.category || 'Notices',
      message:
        n.message ||
        'Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.',
      progress: typeof n.progress === 'number' ? n.progress : 65,
      progressStatus: n.progressStatus || '65% • Failed',
      progressLabel: n.progressLabel || 'Authorization Progress',
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
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
      inactive: 'bg-slate-100 text-slate-600 border-slate-300 font-semibold',
      pending: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
      flagged: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      suspended: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      blocked: 'bg-red-100 text-red-700 border-red-300 font-bold',
    };
    const dotColors = {
      active: 'bg-emerald-500',
      inactive: 'bg-slate-400',
      pending: 'bg-amber-500',
      flagged: 'bg-rose-500',
      suspended: 'bg-amber-600',
      blocked: 'bg-red-600',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs capitalize border ${
          styles[s] || styles.active
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[s] || dotColors.active}`} />
        {s}
      </span>
    );
  };

  // Telemetry calculations
  const totalAssetsUnderCustody = users.reduce((sum, u) => sum + (Number(u.totalBalance) || 0), 0);
  const activeUsersCount = users.filter((u) => (u.status || 'active').toLowerCase() === 'active').length;
  const restrictedUsersCount = users.length - activeUsersCount;
  const totalUnreadSupport = users.reduce(
    (sum, u) => sum + (Number(u.supportChat?.unreadByAdmin) || 0),
    0
  );
  const activeNoticesCount = users.filter((u) => u.notice?.enabled || (u.lockedPages?.length || 0) > 0).length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.primaryAccount?.accountNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.createdByAdminName?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (isSuperAdmin && selectedAdminFilter !== 'all') {
      const ownerId = u.createdByAdminId || 'admin-1';
      if (ownerId !== selectedAdminFilter) return false;
    }
    if (statusQuickFilter === 'active') {
      return (u.status || 'active').toLowerCase() === 'active';
    }
    if (statusQuickFilter === 'restricted') {
      return (
        (u.status || 'active').toLowerCase() !== 'active' ||
        Boolean(u.notice?.enabled) ||
        (u.lockedPages?.length || 0) > 0
      );
    }
    if (statusQuickFilter === 'unread') {
      return (u.supportChat?.unreadByAdmin || 0) > 0;
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

  const renderPermissionSelector = (permsState, setPermsState) => {
    const categories = ['User Management', 'Security & Restrictions', 'Accounts & Balances', 'Transactions'];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="block text-xs font-bold text-neutral-800">
              Admin Functionality & Access Control ({countGrantedPerms(permsState)}/{ALL_ADMIN_PERMISSIONS.length} Granted)
            </label>
            <p className="text-[11px] text-neutral-500">
              Choose what this Admin is allowed to access and perform on their onboarded users.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const allTrue = {};
                ALL_ADMIN_PERMISSIONS.forEach((p) => {
                  allTrue[p.id] = true;
                });
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
                  viewOnly[p.id] =
                    p.id === 'canViewAccounts' ||
                    p.id === 'canViewTransactions' ||
                    p.id === 'canCreateUsers';
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
                ALL_ADMIN_PERMISSIONS.forEach((p) => {
                  allFalse[p.id] = false;
                });
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
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">
                  {cat}
                </div>
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
                            <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                              {perm.description}
                            </div>
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
    <div className="min-h-screen bg-[#f0f4f9]">
      {authLoading ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Loading authentication status...
        </div>
      ) : !user || !isAnyAdmin ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Redirecting to login...
        </div>
      ) : (
        <>
          {/* ===================================================================== */}
          {/* BANK OF AMERICA EXECUTIVE COMMAND MASTHEAD (DISTINCT ADMIN HEADER)    */}
          {/* ===================================================================== */}
          <header className="bg-gradient-to-r from-[#011640] via-[#012169] to-[#082c7c] text-white border-b-4 border-[#E31837] shadow-lg sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Top Row: Brand Identity, Telemetry Status & Admin Profile Actions */}
              <div className="py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
                <div className="flex items-center space-x-3.5">
                  <Link href={basePath} className="flex items-center space-x-3 group">
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
                              ? 'bg-[#E31837] text-white border-red-400 shadow-xs'
                              : 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                          }`}
                        >
                          {isSuperAdmin ? 'Master Super Admin' : 'Portfolio Admin'}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-200 hidden sm:block">
                        {isSuperAdmin
                          ? 'Global Multi-Admin Oversight, Client Provisioning & System Security'
                          : `Dedicated Client Onboarding & Portfolio Operations • Signed in as ${user?.name || user?.email}`}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Right Controls: Portal Status Pill, Change Password & Sign Out */}
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

                  {!isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsFirstLoginPrompt(false);
                        setShowAdminPassModal(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all"
                      title="Change Your Administrator Password"
                    >
                      <Key className="w-3.5 h-3.5 text-sky-300" />
                      <span className="hidden sm:inline">Password</span>
                    </button>
                  )}

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

              {/* Bottom Row: Horizontal Command Navigation Bar & Primary CTAs */}
              <div className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-1.5 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isCurrentRoute =
                      router.pathname === tab.path &&
                      (tab.id !== 'users' || activeSection === 'users');
                    return (
                      <Link
                        key={tab.id}
                        href={tab.path}
                        onClick={() => {
                          if (tab.id === 'users') setActiveSection('users');
                        }}
                        className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                          isCurrentRoute
                            ? 'bg-white text-[#012169] shadow-sm'
                            : 'text-blue-100 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{tab.label}</span>
                        {tab.id === 'users' && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                              isCurrentRoute
                                ? 'bg-[#012169] text-white'
                                : 'bg-white/15 text-white'
                            }`}
                          >
                            {users.length}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveSection('admins')}
                      className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeSection === 'admins'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-amber-200 hover:bg-white/10 hover:text-amber-100'
                      }`}
                    >
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span>Administrator Roster</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          activeSection === 'admins'
                            ? 'bg-slate-950 text-amber-300'
                            : 'bg-amber-400/20 text-amber-200'
                        }`}
                      >
                        {admins.length}
                      </span>
                    </button>
                  )}
                </div>

                {/* Quick Action Onboarding Buttons */}
                <div className="flex items-center space-x-2">
                  {canDo('canCreateUsers') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('users');
                        setShowAddModal(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#E31837] hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Onboard Client</span>
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection('admins');
                        setShowAddAdminModal(true);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-300" />
                      <span>+ Onboard Admin</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* ===================================================================== */}
          {/* MAIN COMMAND CENTER WORKSPACE                                         */}
          {/* ===================================================================== */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* 4-Card Executive Telemetry Bento Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Managed Client Portfolio */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#012169]" />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isSuperAdmin ? 'Global Client Roster' : 'My Onboarded Clients'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#012169] mt-1">
                      {users.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#012169]">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-semibold">
                    ● {activeUsersCount} Active
                  </span>
                  <span className="text-amber-700 font-semibold">
                    ● {restrictedUsersCount} Restricted
                  </span>
                </div>
              </div>

              {/* KPI 2: Total Capital Under Custody */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Total Capital Under Custody
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 truncate">
                      ${totalAssetsUnderCustody.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Across {users.length} Client Portfolios</span>
                  <Link
                    href={`${basePath}/accounts`}
                    className="font-bold text-[#012169] hover:underline"
                  >
                    Ledger →
                  </Link>
                </div>
              </div>

              {/* KPI 3: Live Support Dispatch */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full ${
                    totalUnreadSupport > 0 ? 'bg-[#E31837]' : 'bg-sky-600'
                  }`}
                />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Client Support Dispatch
                    </span>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900">
                        {totalUnreadSupport}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Unread {totalUnreadSupport === 1 ? 'Inquiry' : 'Inquiries'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      totalUnreadSupport > 0
                        ? 'bg-red-50 border border-red-200 text-[#E31837]'
                        : 'bg-sky-50 border border-sky-100 text-sky-600'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Two-Way Concierge Line</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('users');
                      setStatusQuickFilter(statusQuickFilter === 'unread' ? 'all' : 'unread');
                    }}
                    className="font-bold text-[#012169] hover:underline"
                  >
                    {statusQuickFilter === 'unread' ? 'Show All' : 'Filter Unread →'}
                  </button>
                </div>
              </div>

              {/* KPI 4: System Lock Controls (Super Admin) or Compliance Holds (Admin) */}
              {isSuperAdmin ? (
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 w-1.5 h-full ${
                      websiteOpen ? 'bg-amber-500' : 'bg-red-600'
                    }`}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Global System Controls
                    </span>
                    <Globe className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-semibold text-slate-700">
                        Public Website:
                      </span>
                      <button
                        type="button"
                        disabled={loadingWebsiteStatus}
                        onClick={async () => {
                          setLoadingWebsiteStatus(true);
                          try {
                            const res = await fetch('/api/website-status', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isOpen: !websiteOpen }),
                            });
                            if (res.ok) setWebsiteOpen(!websiteOpen);
                          } catch (_) {
                          } finally {
                            setLoadingWebsiteStatus(false);
                          }
                        }}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold transition-all ${
                          websiteOpen
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-[#E31837] text-white hover:bg-red-700'
                        }`}
                      >
                        {websiteOpen ? 'OPEN (Click to Lock)' : 'LOCKED (Click to Open)'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-semibold text-slate-700">
                        Spending Card:
                      </span>
                      <button
                        type="button"
                        disabled={loadingSpendingToggle}
                        onClick={async () => {
                          setLoadingSpendingToggle(true);
                          try {
                            const nextVal = !showSpendingOverview;
                            const res = await fetch('/api/website-status', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ showSpendingOverview: nextVal }),
                            });
                            if (res.ok) setShowSpendingOverview(nextVal);
                          } catch (_) {
                          } finally {
                            setLoadingSpendingToggle(false);
                          }
                        }}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                          showSpendingOverview
                            ? 'bg-blue-100 text-[#012169] hover:bg-blue-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {showSpendingOverview ? 'Visible on Dashboard' : 'Hidden on Dashboard'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Active Compliance Holds
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                        {activeNoticesCount}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Notices & Locked Menus</span>
                    <span className="font-bold text-[#012169]">
                      {countGrantedPerms(livePermissions || user?.adminPermissions)}/{ALL_ADMIN_PERMISSIONS.length} Rights
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* SECTION A: SUPER ADMIN -> MANAGE ONBOARDED ADMINS                 */}
            {/* ================================================================= */}
            {isSuperAdmin && activeSection === 'admins' ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search onboarded administrators by name or email..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => setActiveSection('users')}
                      className="text-xs py-2 px-3"
                    >
                      ← Back to Client Roster
                    </Button>
                    <Button
                      onClick={() => setShowAddAdminModal(true)}
                      className="flex items-center space-x-1.5 text-xs py-2 px-4 bg-[#012169]"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Onboard New Admin</span>
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold">
                        Onboarded Portfolio Administrators ({filteredAdmins.length})
                      </h2>
                      <p className="text-xs text-slate-400">
                        Each administrator only views and manages the clients they personally onboard.
                      </p>
                    </div>
                  </div>

                  {loadingAdmins ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Loading administrators...
                    </div>
                  ) : filteredAdmins.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Shield className="w-10 h-10 text-slate-300 mx-auto" />
                      <div className="text-slate-700 font-bold text-sm">
                        No Administrators Onboarded Yet
                      </div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Click &ldquo;Onboard New Admin&rdquo; to create an administrator account and customize their granular permissions.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredAdmins.map((adm) => {
                        const grantedCount = countGrantedPerms(adm.adminPermissions);
                        const normalizedPerms = normalizeAdminPermissions(adm.adminPermissions);
                        const admUsersCount = adm.usersCount ?? adm.userCount ?? 0;
                        return (
                          <div key={adm.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-3">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                              <div className="flex items-start space-x-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#012169] text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                                  {adm.name ? adm.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-900 text-base">
                                      {adm.name}
                                    </span>
                                    {getStatusBadge(adm.status)}
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#012169] border border-blue-200">
                                      {admUsersCount} Onboarded {admUsersCount === 1 ? 'Client' : 'Clients'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                      {grantedCount}/{ALL_ADMIN_PERMISSIONS.length} Permissions
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Login Email:{' '}
                                    <span className="font-mono font-semibold text-slate-700">
                                      {adm.email}
                                    </span>{' '}
                                    • Created: {adm.createdAt || 'N/A'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAdminFilter(adm.id);
                                    setActiveSection('users');
                                  }}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-[#012169] hover:bg-blue-100 border border-blue-200 transition-colors"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>View Clients ({admUsersCount})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openPermAdminModal(adm)}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>Permissions</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openAdminStatusModal(adm)}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-colors"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>Status / Lock</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditAdminModal(adm)}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleForceLogoutAdmin(adm)}
                                  className="p-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                  title="Force Log Out Admin"
                                >
                                  <LogOut className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(adm)}
                                  className="p-1.5 rounded-lg bg-red-50 text-[#E31837] hover:bg-red-100 transition-colors"
                                  title="Delete Admin"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Permission Pills */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-600 mr-1">
                                Access Rights:
                              </span>
                              {ALL_ADMIN_PERMISSIONS.map((perm) => {
                                const granted = normalizedPerms[perm.id];
                                return (
                                  <span
                                    key={perm.id}
                                    onClick={() => openPermAdminModal(adm)}
                                    className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-semibold border transition-opacity hover:opacity-80 ${
                                      granted
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-red-50 text-red-600 border-red-200 line-through opacity-75'
                                    }`}
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
                </div>
              </div>
            ) : (
              /* ================================================================= */
              /* SECTION B: EXECUTIVE CLIENT DIRECTORY & COMMAND CONTROL           */
              /* ================================================================= */
              <div className="space-y-4">
                {/* Command Search, Quick Status Filter Pills & Admin Filter Bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={
                          isSuperAdmin
                            ? 'Search clients by name, email, account #, or onboarding admin...'
                            : 'Search your onboarded clients by name, email, or account #...'
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#012169] transition-all"
                      />
                    </div>

                    {/* Quick Status Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: 'all', label: `All (${users.length})` },
                        { id: 'active', label: `Active (${activeUsersCount})` },
                        { id: 'restricted', label: `Restricted / Holds (${restrictedUsersCount})` },
                        {
                          id: 'unread',
                          label: `Unread Support (${totalUnreadSupport})`,
                          highlight: totalUnreadSupport > 0,
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStatusQuickFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusQuickFilter === tab.id
                              ? 'bg-[#012169] text-white shadow-xs'
                              : tab.highlight
                              ? 'bg-red-50 text-[#E31837] border border-red-200 hover:bg-red-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Super Admin: Filter by Onboarding Admin */}
                    {isSuperAdmin && (
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <select
                          value={selectedAdminFilter}
                          onChange={(e) => setSelectedAdminFilter(e.target.value)}
                          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#012169]"
                        >
                          <option value="all">All Admins ({users.length})</option>
                          <option value="admin-1">
                            Super Admin ({users.filter((u) => (u.createdByAdminId || 'admin-1') === 'admin-1').length})
                          </option>
                          {admins.map((adm) => (
                            <option key={adm.id} value={adm.id}>
                              {adm.name} ({users.filter((u) => u.createdByAdminId === adm.id).length})
                            </option>
                          ))}
                        </select>
                        {selectedAdminFilter !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setSelectedAdminFilter('all')}
                            className="px-2.5 py-1.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Executive Client Roster Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Roster Header Bar */}
                  <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-[#012169] to-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <Building2 className="w-4 h-4 text-sky-300" />
                      <h2 className="text-sm sm:text-base font-bold">
                        {isSuperAdmin
                          ? selectedAdminFilter === 'all'
                            ? `Global Client Directory (${filteredUsers.length})`
                            : `Clients Onboarded by ${
                                selectedAdminFilter === 'admin-1'
                                  ? 'Super Administrator'
                                  : admins.find((a) => a.id === selectedAdminFilter)?.name ||
                                    'Selected Admin'
                              } (${filteredUsers.length})`
                          : `Managed Client Roster (${filteredUsers.length})`}
                      </h2>
                    </div>
                    <span className="text-[11px] text-blue-200">
                      Click any action pill on a client record to manage support chat, notices, status, or menu locks
                    </span>
                  </div>

                  {loadingUsers ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Loading client directory...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-14 px-4 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        No Client Accounts Found
                      </div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {searchQuery || statusQuickFilter !== 'all'
                          ? 'No clients match your current search or filter criteria.'
                          : 'Your client directory is currently empty. Click "+ Onboard Client" to provision a new client banking profile.'}
                      </p>
                      {canDo('canCreateUsers') && (
                        <Button
                          onClick={() => setShowAddModal(true)}
                          className="mt-2 bg-[#012169] text-xs px-4 py-2"
                        >
                          + Onboard First Client
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredUsers.map((u) => {
                        const visibleMenusCount = Array.isArray(u.allowedPages)
                          ? u.allowedPages.length
                          : ALL_AVAILABLE_PAGES.length;
                        const lockedMenusCount = Array.isArray(u.lockedPages)
                          ? u.lockedPages.length
                          : 0;
                        const unreadSupport = u.supportChat?.unreadByAdmin || 0;
                        const totalSupportMsgs = u.supportChat?.messages?.length || 0;

                        return (
                          <div
                            key={u.id}
                            className="p-4 sm:p-5 hover:bg-blue-50/30 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-4"
                          >
                            {/* Left: Client Identity, Account # & 2FA */}
                            <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                              <div className="relative flex-shrink-0">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#012169] to-blue-700 text-white font-black text-base flex items-center justify-center shadow-xs">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
                                    (u.status || 'active').toLowerCase() === 'active'
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500'
                                  }`}
                                />
                              </div>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                                    {u.name}
                                  </span>
                                  {canDo('canManageStatus') ? (
                                    <button
                                      type="button"
                                      onClick={() => openStatusModal(u)}
                                      className="hover:opacity-80 transition-opacity"
                                      title="Click to change client status"
                                    >
                                      {getStatusBadge(u.status)}
                                    </button>
                                  ) : (
                                    getStatusBadge(u.status)
                                  )}

                                  {isSuperAdmin && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedAdminFilter(u.createdByAdminId || 'admin-1')
                                      }
                                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                                        (u.createdByAdminId || 'admin-1') === 'admin-1'
                                          ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                          : 'bg-blue-50 text-[#012169] border-blue-200 hover:bg-blue-100'
                                      }`}
                                      title="Click to filter by this onboarding Admin"
                                    >
                                      <Shield className="w-3 h-3 mr-1" />
                                      <span>{u.createdByAdminName || 'Super Administrator'}</span>
                                    </button>
                                  )}
                                </div>

                                <div className="text-xs text-slate-500 truncate">{u.email}</div>

                                {/* Metadata Badges Row */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold">
                                    Acct: {u.primaryAccount ? u.primaryAccount.accountNumber : 'None'}
                                  </span>

                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[#012169] font-mono text-[11px] font-bold">
                                    <Key className="w-3 h-3 mr-1" />
                                    {u.twoFactorCode && String(u.twoFactorCode).startsWith('pbkdf2:')
                                      ? '2FA: Encrypted'
                                      : `2FA: ${u.twoFactorCode || 'None'}`}
                                  </span>

                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium">
                                    {visibleMenusCount}/{ALL_AVAILABLE_PAGES.length} Menus Visible
                                  </span>

                                  {lockedMenusCount > 0 && (
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[#E31837] text-[11px] font-bold"
                                      title={`Locked services: ${u.lockedPages.join(', ')}`}
                                    >
                                      <Lock className="w-3 h-3 mr-1" />
                                      {lockedMenusCount} Locked
                                    </span>
                                  )}

                                  {u.notice?.enabled && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold">
                                      <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                                      Notice Active
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Center: Capital Balance & Dates */}
                            <div className="flex sm:items-center justify-between xl:justify-end gap-6 bg-slate-50 xl:bg-transparent p-3 xl:p-0 rounded-lg border xl:border-0 border-slate-200">
                              <div className="text-left xl:text-right">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Total Balance
                                </div>
                                <div className="text-lg sm:text-xl font-black text-slate-900">
                                  ${(Number(u.totalBalance) || 0).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Opened: {u.createdAt || 'N/A'}
                                </div>
                              </div>

                              {/* Right: Labeled Action Command Dock */}
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {/* 1. Live Support Chat Button */}
                                <button
                                  type="button"
                                  onClick={() => openSupportChatModal(u)}
                                  className={`relative inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    unreadSupport > 0
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-300 shadow-xs'
                                      : totalSupportMsgs > 0
                                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200'
                                  }`}
                                  title="Open Live Support Chat & Corporate Email Settings"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Support</span>
                                  {unreadSupport > 0 && (
                                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#E31837] text-white text-[10px] font-extrabold animate-pulse">
                                      {unreadSupport}
                                    </span>
                                  )}
                                </button>

                                {/* 2. Notice / Restriction Alert Button */}
                                {canDo('canManageNotices') && (
                                  <button
                                    type="button"
                                    onClick={() => openNoticeModal(u)}
                                    className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                      u.notice?.enabled
                                        ? 'bg-red-50 text-[#E31837] border-red-300 hover:bg-red-100'
                                        : u.notice?.sendAsMessage
                                        ? 'bg-blue-50 text-[#012169] border-blue-200 hover:bg-blue-100'
                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                    }`}
                                    title="Configure Restriction Prompt, Banner, or Inbox Notice"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Notice</span>
                                  </button>
                                )}

                                {/* 3. Account Status Modal Button */}
                                {canDo('canManageStatus') && (
                                  <button
                                    type="button"
                                    onClick={() => openStatusModal(u)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all"
                                    title="Change Account Status (Active, Suspended, Blocked, Flagged)"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>Status</span>
                                  </button>
                                )}

                                {/* 4. Edit User & Menus Button */}
                                {(canDo('canEditUsers') ||
                                  canDo('canManageBalances') ||
                                  canDo('canManageMenus')) && (
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(u)}
                                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#012169] text-white hover:bg-blue-900 transition-all shadow-2xs"
                                    title="Edit User Profile, Balance, and Menu Permissions/Locks"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit & Menus</span>
                                  </button>
                                )}

                                {/* 5. Force Logout Button */}
                                {canDo('canManageStatus') && (
                                  <button
                                    type="button"
                                    onClick={() => handleForceLogout(u)}
                                    className="p-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                    title="Force Log Out User Sessions"
                                  >
                                    <LogOut className="w-4 h-4" />
                                  </button>
                                )}

                                {/* 6. Delete User Button */}
                                {canDo('canDeleteUsers') && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="p-1.5 rounded-lg bg-red-50 text-[#E31837] hover:bg-red-100 transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* ========================================================= */}
          {/* SUPER ADMIN MODAL 1: ONBOARD NEW ADMIN                    */}
          {/* ========================================================= */}
          {isSuperAdmin && showAddAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 relative border-t-4 border-[#012169]">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <Shield className="w-6 h-6 text-[#012169]" />
                    <div>
                      <h3 className="text-xl font-bold text-[#012169]">Onboard New Administrator</h3>
                      <p className="text-xs text-neutral-500">
                        Create an Admin account and select the exact functionalities they can access.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddAdminModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Admin Full Name *
                      </label>
                      <Input
                        required
                        placeholder="e.g. Michael Carter"
                        value={newAdminForm.name}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Admin Email (Login Username) *
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="e.g. m.carter@bankofamerica.com"
                        value={newAdminForm.email}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Admin Login Password *
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="Enter strong password"
                        value={newAdminForm.password}
                        onChange={(e) =>
                          setNewAdminForm({ ...newAdminForm, password: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Admin Account Status
                      </label>
                      <select
                        value={newAdminForm.status}
                        onChange={(e) =>
                          setNewAdminForm({ ...newAdminForm, status: e.target.value })
                        }
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
                    {renderPermissionSelector(newAdminForm.adminPermissions, (updatedPerms) =>
                      setNewAdminForm({ ...newAdminForm, adminPermissions: updatedPerms })
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddAdminModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading
                        ? 'Onboarding Admin...'
                        : 'Onboard Admin & Grant Selected Access'}
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
                      <h3 className="text-xl font-bold text-[#012169]">
                        Admin Functionality & Access Control
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Configuring access for{' '}
                        <span className="font-bold text-neutral-800">{targetAdmin.name}</span> (
                        {targetAdmin.email})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPermAdminModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAdminPermissions} className="space-y-4">
                  {renderPermissionSelector(permAdminForm, setPermAdminForm)}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowPermAdminModal(false)}
                    >
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
                    <h3 className="text-lg font-bold text-[#012169]">Edit Administrator</h3>
                  </div>
                  <button
                    onClick={() => setShowEditAdminModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Admin Name *
                    </label>
                    <Input
                      required
                      value={editAdminForm.name}
                      onChange={(e) =>
                        setEditAdminForm({ ...editAdminForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Admin Email *
                    </label>
                    <Input
                      type="email"
                      required
                      value={editAdminForm.email}
                      onChange={(e) =>
                        setEditAdminForm({ ...editAdminForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      New Password (leave blank to keep current)
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter new password to reset"
                      value={editAdminForm.password}
                      onChange={(e) =>
                        setEditAdminForm({ ...editAdminForm, password: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Admin Status
                    </label>
                    <select
                      value={editAdminForm.status}
                      onChange={(e) =>
                        setEditAdminForm({ ...editAdminForm, status: e.target.value })
                      }
                      className="input-field text-sm"
                    >
                      <option value="active">Active (Can Log In & Manage Their Users)</option>
                      <option value="suspended">Suspended (Login Blocked)</option>
                      <option value="blocked">Blocked (Strict Lockout)</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowEditAdminModal(false)}
                    >
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

          {/* ========================================================= */}
          {/* SUPER ADMIN MODAL 4: SUSPEND & LOCK ADMINISTRATOR         */}
          {/* ========================================================= */}
          {isSuperAdmin && showAdminStatusModal && targetAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-md w-full p-6 relative border-t-4 border-amber-500">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="text-lg font-bold text-[#012169]">
                        Manage Administrator Access
                      </h3>
                      <p className="text-xs text-neutral-500">{adminStatusForm.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAdminStatusModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateAdminStatus} className="space-y-4">
                  <div className="space-y-2">
                    {[
                      {
                        val: 'active',
                        label: 'Active',
                        desc: 'Admin can sign in, onboard clients, and manage their assigned users.',
                        cls: 'bg-green-50 border-green-400',
                      },
                      {
                        val: 'suspended',
                        label: 'Suspended',
                        desc: 'Temporarily halts all administrative privileges and prevents sign-in.',
                        cls: 'bg-amber-50 border-amber-400',
                      },
                      {
                        val: 'blocked',
                        label: 'Blocked / Locked',
                        desc: 'Strict security lockout. Terminates active sessions immediately.',
                        cls: 'bg-red-50 border-red-400',
                      },
                      {
                        val: 'inactive',
                        label: 'Inactive',
                        desc: 'Admin account is deactivated.',
                        cls: 'bg-neutral-100 border-neutral-400',
                      },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex items-start space-x-3 p-3 rounded-bank border cursor-pointer transition-all ${
                          adminStatusForm.status === opt.val
                            ? `${opt.cls} ring-1`
                            : 'bg-neutral-50 border-neutral-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="adminStatus"
                          value={opt.val}
                          checked={adminStatusForm.status === opt.val}
                          onChange={() =>
                            setAdminStatusForm({ ...adminStatusForm, status: opt.val })
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{opt.label}</div>
                          <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-bank border border-neutral-200">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adminStatusForm.forceLogout}
                        onChange={(e) =>
                          setAdminStatusForm({
                            ...adminStatusForm,
                            forceLogout: e.target.checked,
                          })
                        }
                        className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                      />
                      <span>Force log out all active sessions immediately</span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAdminStatusModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Updating...' : 'Save Status'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ADD USER MODAL (MAX-W-3XL WITH CLEAR 2-COLUMN PERMISSIONS) */}
          {/* ========================================================= */}
          {showAddModal && canDo('canCreateUsers') && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative border-t-4 border-[#012169]">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#012169]">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#012169]">
                        Onboard New Bank of America Client
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Provision client credentials, initial account balance, and dashboard menu permissions.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Client Full Name *
                      </label>
                      <Input
                        required
                        placeholder="e.g. Robert M. Vance"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Email Address (Online ID) *
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="e.g. robert@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Login Passcode *
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. Secure@123"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        6-Digit 2FA Security Code *
                      </label>
                      <Input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="6-digit security code"
                        value={newUser.twoFactorCode}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            twoFactorCode: e.target.value.replace(/\D/g, ''),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Initial Balance ($) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        placeholder="50000.00"
                        value={newUser.initialBalance}
                        onChange={(e) =>
                          setNewUser({ ...newUser, initialBalance: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Deposit Date *
                      </label>
                      <Input
                        type="date"
                        required
                        value={newUser.initialDepositDate}
                        onChange={(e) =>
                          setNewUser({ ...newUser, initialDepositDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Opening Date *
                      </label>
                      <Input
                        type="date"
                        required
                        value={newUser.createdAt}
                        onChange={(e) => setNewUser({ ...newUser, createdAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Account Type
                      </label>
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
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Account Status
                      </label>
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

                  {/* Dashboard Modules / Pages Permission & Locks (Clear 2-Column Layout) */}
                  {canDo('canManageMenus') && (
                    <div className="pt-3 border-t border-neutral-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-neutral-900">
                            Client Sidebar Menus & Feature Access Control ({newUser.allowedPages.length}/{ALL_AVAILABLE_PAGES.length} Visible, {newUser.lockedPages?.length || 0} Locked)
                          </label>
                          <p className="text-[11px] text-neutral-500">
                            Check the box to display the menu on the user&apos;s sidebar. Click OPEN/LOCKED to restrict service execution.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, allowedPages: ALL_MENU_IDS })}
                            className="px-2.5 py-1 rounded bg-blue-50 text-primary-blue hover:bg-blue-100 font-semibold border border-blue-200"
                          >
                            Show All
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNewUser({ ...newUser, allowedPages: DEFAULT_CORE_MENU_IDS })
                            }
                            className="px-2.5 py-1 rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-semibold border border-neutral-300"
                          >
                            Core Only
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNewUser({
                                ...newUser,
                                lockedPages: ALL_MENU_IDS.filter((p) => p !== 'dashboard'),
                              })
                            }
                            className="px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold border border-red-200"
                          >
                            Lock All
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewUser({ ...newUser, lockedPages: [] })}
                            className="px-2.5 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-semibold border border-green-200"
                          >
                            Unlock All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-neutral-50 p-3.5 rounded-bank border border-neutral-200 max-h-80 overflow-y-auto">
                        {ALL_AVAILABLE_PAGES.map((page) => {
                          const isVisible = newUser.allowedPages.includes(page.id);
                          const isLocked = newUser.lockedPages?.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              className={`flex items-center justify-between p-2.5 rounded-bank border transition-all ${
                                !isVisible
                                  ? 'bg-neutral-100/70 border-neutral-200 opacity-60'
                                  : isLocked
                                  ? 'bg-amber-50 border-amber-300 shadow-xs'
                                  : 'bg-white border-neutral-200 hover:border-blue-300'
                              }`}
                            >
                              <label className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0 mr-2 py-0.5">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewUser({
                                        ...newUser,
                                        allowedPages: [...newUser.allowedPages, page.id],
                                      });
                                    } else {
                                      setNewUser({
                                        ...newUser,
                                        allowedPages: newUser.allowedPages.filter(
                                          (p) => p !== page.id
                                        ),
                                      });
                                    }
                                  }}
                                  className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4 flex-shrink-0"
                                />
                                <span className="text-xs font-semibold text-neutral-800 leading-snug break-words">
                                  {page.label}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentLocks = newUser.lockedPages || [];
                                  const updated = isLocked
                                    ? currentLocks.filter((p) => p !== page.id)
                                    : [...currentLocks, page.id];
                                  setNewUser({ ...newUser, lockedPages: updated });
                                }}
                                title={
                                  isLocked
                                    ? 'Unlock service'
                                    : 'Lock service (user cannot access)'
                                }
                                className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1 flex-shrink-0 transition-all ${
                                  isLocked
                                    ? 'bg-red-500 text-white shadow-xs hover:bg-red-600'
                                    : 'bg-neutral-200/90 text-neutral-700 hover:bg-neutral-300'
                                }`}
                              >
                                {isLocked ? (
                                  <>
                                    <Lock className="w-3 h-3 flex-shrink-0" />
                                    <span>LOCKED</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 text-neutral-500 flex-shrink-0" />
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
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Creating Client...' : 'Onboard Client & Provision Account'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* EDIT USER MODAL (MAX-W-3XL WITH CLEAR 2-COLUMN PERMISSIONS)*/}
          {/* ========================================================= */}
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative border-t-4 border-[#012169]">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <Edit className="w-5 h-5 text-primary-blue" />
                    <h3 className="text-xl font-bold text-[#012169]">
                      Edit Client Profile & Menu Permissions
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-4">
                  {isSuperAdmin && (
                    <div className="p-3 bg-amber-50/70 rounded-bank border border-amber-200">
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Assigned Admin (Onboarded By)
                      </label>
                      <select
                        value={editUser.createdByAdminId || 'admin-1'}
                        onChange={(e) =>
                          setEditUser({ ...editUser, createdByAdminId: e.target.value })
                        }
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Full Name
                          </label>
                          <Input
                            required
                            value={editUser.name}
                            onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            required
                            value={editUser.email}
                            onChange={(e) =>
                              setEditUser({ ...editUser, email: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            New Passcode (leave blank to keep current)
                          </label>
                          <Input
                            type="text"
                            placeholder="Enter new password"
                            value={editUser.password}
                            onChange={(e) =>
                              setEditUser({ ...editUser, password: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            6-Digit 2FA Code (leave blank to keep current)
                          </label>
                          <Input
                            type="text"
                            maxLength={6}
                            placeholder="Enter new 6-digit 2FA"
                            value={editUser.twoFactorCode}
                            onChange={(e) =>
                              setEditUser({
                                ...editUser,
                                twoFactorCode: e.target.value.replace(/\D/g, ''),
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {canDo('canManageBalances') && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Account Balance ($)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            required
                            value={editUser.balance}
                            onChange={(e) =>
                              setEditUser({ ...editUser, balance: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Deposit Date
                          </label>
                          <Input
                            type="date"
                            value={editUser.initialDepositDate}
                            onChange={(e) =>
                              setEditUser({
                                ...editUser,
                                initialDepositDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Opening Date
                          </label>
                          <Input
                            type="date"
                            value={editUser.createdAt}
                            onChange={(e) =>
                              setEditUser({ ...editUser, createdAt: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}
                    {canDo('canManageStatus') && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Account Status
                        </label>
                        <select
                          value={editUser.status}
                          onChange={(e) =>
                            setEditUser({ ...editUser, status: e.target.value })
                          }
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

                  {/* Dashboard Modules / Pages Permission & Locks (Clear 2-Column Layout) */}
                  {canDo('canManageMenus') && (
                    <div className="pt-3 border-t border-neutral-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-neutral-900">
                            Client Sidebar Menus & Feature Access Control ({editUser.allowedPages?.length || 0}/{ALL_AVAILABLE_PAGES.length} Visible, {editUser.lockedPages?.length || 0} Locked)
                          </label>
                          <p className="text-[11px] text-neutral-500">
                            Check the box to display the menu on the user&apos;s sidebar. Click OPEN/LOCKED to restrict service execution.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              setEditUser({ ...editUser, allowedPages: ALL_MENU_IDS })
                            }
                            className="px-2.5 py-1 rounded bg-blue-50 text-primary-blue hover:bg-blue-100 font-semibold border border-blue-200"
                          >
                            Show All
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditUser({
                                ...editUser,
                                allowedPages: DEFAULT_CORE_MENU_IDS,
                              })
                            }
                            className="px-2.5 py-1 rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-semibold border border-neutral-300"
                          >
                            Core Only
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditUser({
                                ...editUser,
                                lockedPages: ALL_MENU_IDS.filter((p) => p !== 'dashboard'),
                              })
                            }
                            className="px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold border border-red-200"
                          >
                            Lock All
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditUser({ ...editUser, lockedPages: [] })}
                            className="px-2.5 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-semibold border border-green-200"
                          >
                            Unlock All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-neutral-50 p-3.5 rounded-bank border border-neutral-200 max-h-80 overflow-y-auto">
                        {ALL_AVAILABLE_PAGES.map((page) => {
                          const isVisible = editUser.allowedPages?.includes(page.id);
                          const isLocked = editUser.lockedPages?.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              className={`flex items-center justify-between p-2.5 rounded-bank border transition-all ${
                                !isVisible
                                  ? 'bg-neutral-100/70 border-neutral-200 opacity-60'
                                  : isLocked
                                  ? 'bg-amber-50 border-amber-300 shadow-xs'
                                  : 'bg-white border-neutral-200 hover:border-blue-300'
                              }`}
                            >
                              <label className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0 mr-2 py-0.5">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={(e) => {
                                    const current = editUser.allowedPages || [];
                                    if (e.target.checked) {
                                      setEditUser({
                                        ...editUser,
                                        allowedPages: [...current, page.id],
                                      });
                                    } else {
                                      setEditUser({
                                        ...editUser,
                                        allowedPages: current.filter((p) => p !== page.id),
                                      });
                                    }
                                  }}
                                  className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4 flex-shrink-0"
                                />
                                <span className="text-xs font-semibold text-neutral-800 leading-snug break-words">
                                  {page.label}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentLocks = editUser.lockedPages || [];
                                  const updated = isLocked
                                    ? currentLocks.filter((p) => p !== page.id)
                                    : [...currentLocks, page.id];
                                  setEditUser({ ...editUser, lockedPages: updated });
                                }}
                                title={
                                  isLocked
                                    ? 'Unlock service'
                                    : 'Lock service (user cannot access)'
                                }
                                className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1 flex-shrink-0 transition-all ${
                                  isLocked
                                    ? 'bg-red-500 text-white shadow-xs hover:bg-red-600'
                                    : 'bg-neutral-200/90 text-neutral-700 hover:bg-neutral-300'
                                }`}
                              >
                                {isLocked ? (
                                  <>
                                    <Lock className="w-3 h-3 flex-shrink-0" />
                                    <span>LOCKED</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 text-neutral-500 flex-shrink-0" />
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
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowEditModal(false)}
                    >
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

          {/* ========================================================= */}
          {/* NOTICE & WARNING RESTRICTION MODAL                        */}
          {/* ========================================================= */}
          {showNoticeModal && noticeUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative border-t-4 border-[#E31837]">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-[#E31837]" />
                    <h3 className="text-xl font-bold text-[#012169]">
                      Account Warning & Restriction Notice
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowNoticeModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-neutral-50 p-3 rounded-bank border border-neutral-200 mb-4 text-xs">
                  <div>
                    <span className="text-neutral-500">Target Client:</span>{' '}
                    <span className="font-semibold text-neutral-800">
                      {noticeUser.name} ({noticeUser.email})
                    </span>
                  </div>
                  <div className="mt-1 text-neutral-500">
                    Configure pop-up alerts, dashboard banners, or official messages in the client&apos;s Secure Message Center.
                  </div>
                </div>

                <form onSubmit={handleSaveNotice} className="space-y-4">
                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold text-neutral-700">
                      Notice Delivery Channel
                    </label>

                    {/* Mode 1: Dashboard Prompt (With Pop-up) */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-bank border transition-all ${
                        noticeForm.enabled && noticeForm.showPopup !== false
                          ? 'bg-red-50/80 border-red-300 shadow-xs'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="pr-3">
                        <div className="text-xs font-bold text-neutral-900">
                          Send as Dashboard Prompt (With Pop-up Alert)
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Pops up as a modal prompt on login & displays the restriction banner on the dashboard.
                        </p>
                      </div>
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
                        className="h-4 w-4 rounded text-[#E31837]"
                      />
                    </div>

                    {/* Mode 2: Dashboard Banner Only */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-bank border transition-all ${
                        noticeForm.enabled && noticeForm.showPopup === false
                          ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="pr-3">
                        <div className="text-xs font-bold text-neutral-900">
                          Enable Restriction Warning Banner (Without Pop-up)
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Displays restriction warning banner on dashboard without a pop-up modal.
                        </p>
                      </div>
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
                        className="h-4 w-4 rounded text-amber-600"
                      />
                    </div>

                    {/* Mode 3: Send to Secure Message Center */}
                    <div
                      className={`flex items-center justify-between p-3 rounded-bank border transition-all ${
                        noticeForm.sendAsMessage
                          ? 'bg-blue-50/80 border-primary-blue shadow-xs'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="pr-3">
                        <div className="text-xs font-bold text-neutral-900">
                          Deliver to User&apos;s Secure Message Center Inbox
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Sends an official compliance message to the client&apos;s inbox.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(noticeForm.sendAsMessage)}
                        onChange={(e) =>
                          setNoticeForm({ ...noticeForm, sendAsMessage: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-primary-blue"
                      />
                    </div>

                    {noticeForm.sendAsMessage && (
                      <div className="p-3 bg-blue-50/50 rounded-bank border border-blue-200 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Message Subject *
                          </label>
                          <Input
                            type="text"
                            required={Boolean(noticeForm.sendAsMessage)}
                            value={noticeForm.subject || ''}
                            onChange={(e) =>
                              setNoticeForm({ ...noticeForm, subject: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Sender / Department
                            </label>
                            <Input
                              type="text"
                              value={noticeForm.sender || ''}
                              onChange={(e) =>
                                setNoticeForm({ ...noticeForm, sender: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                              Inbox Category
                            </label>
                            <select
                              value={noticeForm.category || 'Notices'}
                              onChange={(e) =>
                                setNoticeForm({ ...noticeForm, category: e.target.value })
                              }
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

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Warning Notice Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={noticeForm.message}
                      onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                      className="input-field text-sm leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Progress Percentage (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={noticeForm.progress}
                        onChange={(e) =>
                          setNoticeForm({
                            ...noticeForm,
                            progress: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Status Badge Text
                      </label>
                      <Input
                        type="text"
                        value={noticeForm.progressStatus}
                        onChange={(e) =>
                          setNoticeForm({ ...noticeForm, progressStatus: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Progress Bar Label
                    </label>
                    <Input
                      type="text"
                      value={noticeForm.progressLabel}
                      onChange={(e) =>
                        setNoticeForm({ ...noticeForm, progressLabel: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowNoticeModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Save Notice Settings'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MANAGE STATUS & FORCE LOGOUT MODAL                        */}
          {/* ========================================================= */}
          {showStatusModal && statusUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-md w-full p-6 relative">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#012169]">
                        Account Status & Session
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {statusUser.name} • {statusUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveStatus} className="space-y-4">
                  <div className="space-y-2">
                    {[
                      {
                        val: 'active',
                        label: 'Active',
                        desc: 'Full access to online banking, dashboard, and transfers.',
                        borderActive: 'border-emerald-500 bg-emerald-50/50',
                      },
                      {
                        val: 'inactive',
                        label: 'Inactive',
                        desc: 'Account is dormant or inactive.',
                        borderActive: 'border-slate-500 bg-slate-50/50',
                      },
                      {
                        val: 'pending',
                        label: 'Pending',
                        desc: 'Account verification or approval pending.',
                        borderActive: 'border-amber-500 bg-amber-50/50',
                      },
                      {
                        val: 'flagged',
                        label: 'Flagged / Restricted',
                        desc: 'Flagged for compliance review.',
                        borderActive: 'border-rose-500 bg-rose-50/50',
                      },
                      {
                        val: 'suspended',
                        label: 'Suspended',
                        desc: 'Temporarily freeze account access.',
                        borderActive: 'border-amber-600 bg-amber-50/50',
                      },
                      {
                        val: 'blocked',
                        label: 'Blocked',
                        desc: 'Strict lockout. Access denied and sessions revoked.',
                        borderActive: 'border-red-600 bg-red-50/50',
                      },
                    ].map((s) => (
                      <label
                        key={s.val}
                        className={`flex items-start space-x-3 p-3 rounded-bank border cursor-pointer transition-all ${
                          selectedStatus === s.val
                            ? `${s.borderActive} ring-1`
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="accountStatus"
                          value={s.val}
                          checked={selectedStatus === s.val}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-neutral-900">{s.label}</div>
                          <p className="text-[11px] text-neutral-500">{s.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-bank border border-neutral-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                        <LogOut className="w-3.5 h-3.5 text-amber-600" />
                        <span>Force Log Out User</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Terminate all active device sessions immediately.
                      </p>
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
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowStatusModal(false)}
                    >
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

          {/* ========================================================= */}
          {/* MODAL: LIVE SUPPORT CHAT & CORPORATE EMAIL CONFIGURATION  */}
          {/* ========================================================= */}
          {showSupportChatModal && supportChatUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-3 sm:p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden border-t-4 border-[#012169]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#011640] via-[#012169] to-[#082c7c] text-white">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 flex-shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold truncate">
                        Live Support Concierge — {supportChatUser.name}
                      </h2>
                      <p className="text-xs text-blue-200 truncate">
                        Client Email: {supportChatUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSupportChatModal(false)}
                    className="text-neutral-300 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Corporate Email & Support Desk Name Configuration Bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-[#012169] uppercase tracking-wider">
                      <Mail className="w-3.5 h-3.5 text-primary-blue" />
                      <span>Corporate Support Email & Desk Identity (Shown to Client)</span>
                    </div>
                    {corpEmailSavedToast && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Saved to Client Support Header
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Corporate Support Email
                      </label>
                      <input
                        type="email"
                        value={adminCorpEmailInput}
                        onChange={(e) => setAdminCorpEmailInput(e.target.value)}
                        placeholder="concierge.desk@bankofamerica.com"
                        className="w-full px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-bank focus:outline-none focus:ring-2 focus:ring-[#012169]"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Support Desk / Advisor Name
                      </label>
                      <input
                        type="text"
                        value={adminAdvisorNameInput}
                        onChange={(e) => setAdminAdvisorNameInput(e.target.value)}
                        placeholder="Bank of America Client Care Desk"
                        className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-bank focus:outline-none focus:ring-2 focus:ring-[#012169]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleSaveCorporateEmail}
                        disabled={savingCorpEmail}
                        className="w-full py-1.5 px-3 bg-[#012169] hover:bg-blue-900 text-white rounded-bank text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                      >
                        {savingCorpEmail ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Chat Conversation Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-100 min-h-[280px] max-h-[380px]">
                  {(adminSupportChat?.messages || []).length === 0 ? (
                    <div className="h-56 flex flex-col items-center justify-center text-center text-neutral-500 space-y-2">
                      <MessageSquare className="w-8 h-8 text-neutral-400" />
                      <p className="text-sm font-semibold text-neutral-700">
                        No support messages yet
                      </p>
                      <p className="text-xs max-w-sm">
                        When {supportChatUser.name} sends a message from their Live Support window, it will appear here in real time. You can also send the first message below.
                      </p>
                    </div>
                  ) : (
                    (adminSupportChat.messages || []).map((msg) => {
                      const isFromAdmin = msg.sender === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isFromAdmin ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl p-3 text-xs sm:text-sm shadow-xs ${
                              isFromAdmin
                                ? 'rounded-tr-sm bg-[#012169] text-white'
                                : 'rounded-tl-sm bg-white border border-neutral-200 text-neutral-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isFromAdmin ? 'text-sky-300' : 'text-[#012169]'
                                }`}
                              >
                                {isFromAdmin
                                  ? `${msg.senderName || adminAdvisorNameInput} (Support)`
                                  : `${supportChatUser.name} (Client)`}
                              </span>
                              <span
                                className={`text-[10px] font-mono ${
                                  isFromAdmin ? 'text-blue-200' : 'text-neutral-400'
                                }`}
                              >
                                {msg.timestamp || 'Just now'}
                              </span>
                            </div>
                            <p className="whitespace-pre-line leading-relaxed break-words">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={adminChatEndRef} />
                </div>

                {/* Admin Reply Form */}
                <form
                  onSubmit={handleSendAdminReply}
                  className="p-3.5 sm:p-4 bg-white border-t border-neutral-200 flex items-center space-x-2.5"
                >
                  <input
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder={`Reply to ${supportChatUser.name} as ${
                      adminAdvisorNameInput || 'Bank of America Support'
                    }...`}
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border border-neutral-300 rounded-bank focus:outline-none focus:ring-2 focus:ring-[#012169]"
                  />
                  <Button
                    type="submit"
                    disabled={!adminReplyText.trim() || sendingAdminReply}
                    className="flex items-center space-x-1.5 px-4 py-2.5 text-xs sm:text-sm bg-[#012169]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingAdminReply ? 'Sending...' : 'Send Reply'}</span>
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: ADMIN PASSWORD CHANGE                              */}
          {/* ========================================================= */}
          {showAdminPassModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in">
              <div className="bg-white rounded-card shadow-bank-lg max-w-md w-full p-6 relative border-t-4 border-[#012169]">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#012169]">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#012169]">
                        {isFirstLoginPrompt
                          ? 'Welcome! Set Your New Password'
                          : 'Change Administrator Password'}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Update your administrator login password
                      </p>
                    </div>
                  </div>
                  {!isFirstLoginPrompt && (
                    <button
                      type="button"
                      onClick={() => setShowAdminPassModal(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleAdminSelfPasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      New Password *
                    </label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter new password (min. 6 characters)"
                      value={adminPassForm.newPassword}
                      onChange={(e) =>
                        setAdminPassForm({ ...adminPassForm, newPassword: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Confirm New Password *
                    </label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Re-enter your new password"
                      value={adminPassForm.confirmPassword}
                      onChange={(e) =>
                        setAdminPassForm({ ...adminPassForm, confirmPassword: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-200">
                    {isFirstLoginPrompt ? (
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={changingAdminPass}
                        onClick={handleDismissFirstLoginPass}
                        className="text-xs"
                      >
                        Keep Current Password
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={changingAdminPass}
                        onClick={() => setShowAdminPassModal(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={changingAdminPass} className="text-xs">
                      {changingAdminPass ? 'Updating...' : 'Save New Password'}
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
