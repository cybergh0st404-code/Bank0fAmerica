import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  ArrowLeftRight,
  History,
  Settings,
  Shield,
  Users,
  CreditCard,
  Send,
  Camera,
  Receipt,
  FileText,
  TrendingUp,
  Mail,
  Headphones,
  X,
  LogOut,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { hasAdminPermission } from '../lib/navigationConfig.js';

const Sidebar = ({ isAdmin = false }) => {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [allowedPages, setAllowedPages] = useState(['dashboard']);
  const [lockedPages, setLockedPages] = useState([]);

  // Hydrate allowedPages and lockedPages on client mount to guarantee zero hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedAllowed = localStorage.getItem('bank_allowed_pages');
        if (cachedAllowed) {
          const parsed = JSON.parse(cachedAllowed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllowedPages(parsed);
          }
        }
        const cachedLocked = localStorage.getItem('bank_locked_pages');
        if (cachedLocked) {
          const parsed = JSON.parse(cachedLocked);
          if (Array.isArray(parsed)) {
            setLockedPages(parsed);
          }
        }
      } catch (_) {}
    }
    if (user?.allowedPages && Array.isArray(user.allowedPages) && user.allowedPages.length > 0) {
      setAllowedPages(user.allowedPages);
    }
    if (user?.lockedPages && Array.isArray(user.lockedPages)) {
      setLockedPages(user.lockedPages);
    }
  }, [user]);

  // Listen to mobile menu toggle event dispatched by Navbar
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-bank-sidebar', handleToggle);
      return () => window.removeEventListener('toggle-bank-sidebar', handleToggle);
    }
  }, []);

  // Sync latest allowed pages & locked pages from account-data API
  useEffect(() => {
    if (isAdmin || !user) return;
    let isMounted = true;
    const fetchPerms = async () => {
      try {
        const res = await fetch('/api/user/account-data');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.allowedPages && Array.isArray(data.allowedPages)) {
            setAllowedPages(data.allowedPages);
            try {
              localStorage.setItem('bank_allowed_pages', JSON.stringify(data.allowedPages));
            } catch (_) {}
          }
          if (data.lockedPages && Array.isArray(data.lockedPages)) {
            setLockedPages(data.lockedPages);
            try {
              localStorage.setItem('bank_locked_pages', JSON.stringify(data.lockedPages));
            } catch (_) {}
          }
          if (updateUser) {
            updateUser({
              allowedPages: data.allowedPages || [],
              lockedPages: data.lockedPages || [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to sync sidebar pages:', err);
      }
    };
    fetchPerms();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, user]);

  const allUserMenuItems = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transfer', path: '/transfer', icon: ArrowLeftRight, label: 'Transfer Money' },
    { id: 'wire-transfer', path: '/wire-transfer', icon: Send, label: 'Wire Transfer' },
    { id: 'deposit', path: '/deposit', icon: Camera, label: 'Deposit Checks' },
    { id: 'bill-pay', path: '/bill-pay', icon: Receipt, label: 'Bill Pay' },
    { id: 'transactions', path: '/transactions', icon: History, label: 'Transaction History' },
    { id: 'cards', path: '/cards', icon: CreditCard, label: 'Cards & Virtual' },
    { id: 'statements', path: '/statements', icon: FileText, label: 'Statements & Tax' },
    { id: 'credit-score', path: '/credit-score', icon: TrendingUp, label: 'Credit Score' },
    { id: 'messages', path: '/messages', icon: Mail, label: 'Secure Messages' },
    { id: 'support', path: '/messages?tab=support', icon: Headphones, label: 'Live Support & Concierge' },
    { id: 'security', path: '/security', icon: Shield, label: 'Security & Sessions' },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isSuperAdmin = user?.role === 'superadmin';
  const adminBasePath = isSuperAdmin ? '/super-admin' : '/admin';
  const rawAdminMenuItems = [
    { path: adminBasePath, icon: Users, label: isSuperAdmin ? 'Users & Admins' : 'My Users' },
    { path: `${adminBasePath}/accounts`, icon: CreditCard, label: isSuperAdmin ? 'All Accounts' : 'User Accounts', perm: 'canViewAccounts' },
    { path: `${adminBasePath}/transactions`, icon: History, label: isSuperAdmin ? 'All Transactions' : 'User Transactions', perm: 'canViewTransactions' },
  ];

  const adminMenuItems = rawAdminMenuItems.filter(
    (item) => !item.perm || hasAdminPermission(user, item.perm)
  );

  // Filter items strictly by allowed pages for client users - NEVER display deselected items
  const userMenuItems = allUserMenuItems.filter((item) => {
    if (item.id === 'dashboard') return true;
    if (!allowedPages || !Array.isArray(allowedPages)) return false;
    return allowedPages.includes(item.id);
  });

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const renderNavLinks = () => (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = isAdmin
          ? router.pathname === item.path || (item.path !== adminBasePath && router.pathname.startsWith(item.path))
          : router.pathname === item.path;
        const isLocked = !isAdmin && lockedPages.includes(item.id);

        return (
          <button
            key={item.path}
            onClick={() => {
              router.push(item.path);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-bank text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-blue text-white shadow-bank'
                : isLocked
                  ? 'text-neutral-600 hover:bg-red-50/70 hover:text-red-700'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-navy'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive
                    ? 'text-white'
                    : isLocked
                      ? 'text-accent-red'
                      : 'text-neutral-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>
            {isLocked && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight ${
                  isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}
                title="This service is locked on your account"
              >
                <Lock className="w-2.5 h-2.5 mr-0.5" />
                Locked
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* MOBILE DRAWER (Below lg) */}
      <div className="lg:hidden">
        {/* Backdrop Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Slide-out Drawer */}
        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Top Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Bank of America"
                className="h-7 w-auto object-contain"
                style={{ mixBlendMode: 'multiply' }}
              />
              <span className="font-bold text-primary-navy text-sm">Bank of America</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Mini Badge */}
          {user && (
            <div className="p-3.5 mx-3 mt-3 bg-blue-50/70 border border-blue-100 rounded-bank flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-primary-blue text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-primary-navy truncate">{user.name || 'Account Holder'}</div>
                <div className="text-[11px] text-neutral-500 truncate">{isAdmin ? (isSuperAdmin ? 'Super Administrator' : 'Administrator') : user.email}</div>
              </div>
            </div>
          )}

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2">
              Navigation Menu
            </div>
            {renderNavLinks()}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-3 border-t border-neutral-200 bg-neutral-50">
            <button
              onClick={() => {
                if (logout) logout();
                router.push('/login');
              }}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-accent-red hover:bg-red-50 rounded-bank transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR (lg and above) */}
      <aside className="hidden lg:block w-64 bg-white border-r border-neutral-200 min-h-screen pt-6 pb-12 z-30 flex-shrink-0">
        <div className="px-3">
          {renderNavLinks()}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
