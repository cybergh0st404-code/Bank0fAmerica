'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, CreditCard, History, CheckCircle, AlertCircle, Search, Power, PowerOff, Shield } from 'lucide-react';
import Navbar from '../../components/Navbar'; // Adjust path after component migration
import Sidebar from '../../components/Sidebar'; // Adjust path after component migration
import Card from '../../components/Card'; // Adjust path after component migration
import Button from '../../components/Button'; // Adjust path after component migration
import Input from '../../components/Input'; // Adjust path after component migration
import { isProjectExpired } from '../../utils/expiryCheck';
import { getWebsiteStatus, closeWebsite, openWebsite } from '../../utils/websiteStatus';

const AdminAccountsPage = ({ user, onLogout }) => {
  const router = useRouter();
  
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteOpen, setWebsiteOpen] = useState(true); // Default to true, actual status fetched in useEffect

  useEffect(() => {
    const fetchWebsiteStatus = async () => {
      const status = await getWebsiteStatus();
      setWebsiteOpen(status.isOpen);
    };
    fetchWebsiteStatus();
  }, []); // Fetch status on mount

  useEffect(() => {
    if (isProjectExpired()) {
      router.push('/expired');
      return;
    }

    const sampleAccounts = [
      {
        id: 1,
        userId: 1,
        userName: 'John Doe',
        accountNumber: '**** 4532',
        type: 'Checking',
        balance: 125430.50,
        status: 'active',
      },
      {
        id: 2,
        userId: 1,
        userName: 'John Doe',
        accountNumber: '**** 7890',
        type: 'Savings',
        balance: 50000.00,
        status: 'active',
      },
      {
        id: 3,
        userId: 2,
        userName: 'Jane Smith',
        accountNumber: '**** 1234',
        type: 'Checking',
        balance: 8750.25,
        status: 'active',
      },
      {
        id: 4,
        userId: 4,
        userName: 'Sarah Williams',
        accountNumber: '**** 5678',
        type: 'Checking',
        balance: 1500.00,
        status: 'flagged',
      },
    ];
    setAccounts(sampleAccounts);
  }, [router]);

  const handleFlag = (id, type) => {
    if (type === 'account') {
      setAccounts(accounts.map((a) => (a.id === id ? { ...a, status: 'flagged' } : a)));
    }
    alert('Item flagged for review!');
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      flagged: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-neutral-100 text-neutral-700'}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountNumber.includes(searchQuery)
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, path: '/admin' },
    { id: 'accounts', label: 'Accounts', icon: CreditCard, path: '/admin/accounts' },
    { id: 'transactions', label: 'Transactions', icon: History, path: '/admin/transactions' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={onLogout} />
      <div className="flex">
        <Sidebar isAdmin={true} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-primary-navy mb-2">Admin Panel</h1>
                  <p className="text-neutral-600">Manage users, accounts, and transactions</p>
                </div>
                {/* Website Control */}
                <Card className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-primary-blue" />
                      <span className="font-medium text-sm">Website Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        websiteOpen 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {websiteOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <Button
                      variant={websiteOpen ? 'danger' : 'primary'}
                      onClick={async () => {
                        if (websiteOpen) {
                          await closeWebsite();
                          setWebsiteOpen(false);
                          alert('Website has been closed. Users will be redirected to a 404 page.');
                        } else {
                          await openWebsite();
                          setWebsiteOpen(true);
                          alert('Website has been opened. Users can now access the site.');
                        }
                      }}
                      className="px-4 py-2 text-sm"
                    >
                      {websiteOpen ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-2 inline" />
                          Close Website
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2 inline" />
                          Open Website
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-card shadow-bank p-1 flex space-x-1 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-bank transition-all ${
                      router.pathname === tab.path 
                        ? 'bg-primary-blue text-white shadow-bank'
                        : 'text-neutral-600 hover:bg-accent-soft'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Search */}
            <Card>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  placeholder={`Search accounts...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            {/* Accounts Tab Content */}
            <Card title="All Accounts" subtitle="View and manage all user accounts">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                        Account Number
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                        Balance
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr
                        key={account.id}
                        className="border-b border-neutral-200 hover:bg-accent-soft transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{account.userName}</td>
                        <td className="py-3 px-4 font-mono text-neutral-600">
                          {account.accountNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {account.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(account.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="danger"
                              onClick={() => handleFlag(account.id, 'account')}
                              className="text-xs px-3 py-1"
                            >
                              <AlertCircle className="w-3 h-3 mr-1 inline" />
                              Flag
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAccountsPage;
