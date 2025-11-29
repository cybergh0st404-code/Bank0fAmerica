import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  ArrowLeftRight,
  History,
  Settings,
  Shield,
  Users,
  CreditCard,
  Menu,
  X,
} from 'lucide-react';

const Sidebar = ({ isAdmin = false }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const userMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transfer', icon: ArrowLeftRight, label: 'Transfer Money' },
    { path: '/transactions', icon: History, label: 'Transaction History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: Users, label: 'User Management' },
    { path: '/admin/accounts', icon: CreditCard, label: 'All Accounts' },
    { path: '/admin/transactions', icon: History, label: 'All Transactions' },
  ];

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
        className={`fixed lg:static w-64 bg-white border-r border-neutral-200 min-h-screen pt-8 z-40 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // For admin routes, check if pathname starts with the item path
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-bank transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-blue text-white shadow-bank'
                    : 'text-neutral-700 hover:bg-accent-soft'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
