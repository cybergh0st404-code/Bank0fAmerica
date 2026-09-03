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
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../utils/AuthContext';

const Sidebar = ({ isAdmin = false }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [allowedPages, setAllowedPages] = useState(user?.allowedPages || null);

  // Sync allowed pages from account-data API
  useEffect(() => {
    if (isAdmin || !user) return;
    const fetchPerms = async () => {
      try {
        const res = await fetch('/api/user/account-data');
        if (res.ok) {
          const data = await res.json();
          if (data.allowedPages && Array.isArray(data.allowedPages)) {
            setAllowedPages(data.allowedPages);
          }
        }
      } catch (err) {
        console.error('Failed to sync sidebar pages:', err);
      }
    };
    fetchPerms();
  }, [isAdmin, user]);

  const allUserMenuItems = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', category: 'Banking' },
    { id: 'transfer', path: '/transfer', icon: ArrowLeftRight, label: 'Transfer Money', category: 'Banking' },
    { id: 'wire-transfer', path: '/wire-transfer', icon: Send, label: 'Wire Transfer', category: 'Banking' },
    { id: 'deposit', path: '/deposit', icon: Camera, label: 'Deposit Checks', category: 'Banking' },
    { id: 'bill-pay', path: '/bill-pay', icon: Receipt, label: 'Bill Pay', category: 'Banking' },
    { id: 'transactions', path: '/transactions', icon: History, label: 'Transaction History', category: 'Accounts & Cards' },
    { id: 'cards', path: '/cards', icon: CreditCard, label: 'Cards & Virtual', category: 'Accounts & Cards' },
    { id: 'statements', path: '/statements', icon: FileText, label: 'Statements & Tax', category: 'Accounts & Cards' },
    { id: 'credit-score', path: '/credit-score', icon: TrendingUp, label: 'Credit Score', category: 'Services & Security' },
    { id: 'messages', path: '/messages', icon: Mail, label: 'Secure Messages', category: 'Services & Security' },
    { id: 'security', path: '/security', icon: Shield, label: 'Security & Sessions', category: 'Services & Security' },
    { id: 'settings', path: '/settings', icon: Settings, label: 'Settings', category: 'Services & Security' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: Users, label: 'User Management' },
    { path: '/admin/accounts', icon: CreditCard, label: 'All Accounts' },
    { path: '/admin/transactions', icon: History, label: 'All Transactions' },
  ];

  // Filter items by allowed pages if user is not admin
  const userMenuItems = allowedPages && Array.isArray(allowedPages) && allowedPages.length > 0
    ? allUserMenuItems.filter((item) => allowedPages.includes(item.id))
    : allUserMenuItems;

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-40 bg-white p-2 rounded-bank shadow-bank border border-neutral-200 hover:bg-accent-soft transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static w-64 bg-white border-r border-neutral-200 min-h-screen pt-6 pb-12 z-40 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isAdmin
              ? router.pathname.startsWith(item.path) || (item.path === '/admin' && router.pathname === '/admin')
              : router.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-bank text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-blue text-white shadow-bank'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-navy'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
