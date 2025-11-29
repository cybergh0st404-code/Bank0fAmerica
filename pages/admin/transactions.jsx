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
import { isProjectExpired } from '../../src/utils/expiryCheck';
import { getWebsiteStatus, closeWebsite, openWebsite, isWebsiteOpen } from '../../src/utils/websiteStatus';

const AdminTransactionsPage = ({ user, onLogout }) => {
  const router = useRouter();
  
  const [transactions, setTransactions] = useState([]);
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

    const sampleTransactions = [
      {
        id: 1,
        userId: 1,
        userName: 'John Doe',
        type: 'debit',
        description: 'Electricity Bill Payment',
        amount: -125.00,
        date: '2024-01-15',
        status: 'completed',
      },
      {
        id: 2,
        userId: 2,
        userName: 'Jane Smith',
        type: 'credit',
        description: 'Transfer Received',
        amount: 500.00,
        date: '2024-01-14',
        status: 'completed',
      },
      {
        id: 3,
        userId: 3,
        userName: 'Mike Johnson',
        type: 'debit',
        description: 'Large Withdrawal',
        amount: -5000.00,
        date: '2024-01-13',
        status: 'pending',
      },
      {
        id: 4,
        userId: 4,
        userName: 'Sarah Williams',
        type: 'credit',
        description: 'Deposit',
        amount: 2000.00,
        date: '2024-01-12',
        status: 'flagged',
      },
    ];
    setTransactions(sampleTransactions);
  }, [router]);

  const handleApprove = (id, type) => {
    if (type === 'transaction') {
      setTransactions(transactions.map((t) => (t.id === id ? { ...t, status: 'completed' } : t)));
    }
    alert('Item approved successfully!');
  };

  const handleFlag = (id, type) => {
    if (type === 'transaction') {
      setTransactions(transactions.map((t) => (t.id === id ? { ...t, status: 'flagged' } : t)));
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

  const filteredTransactions = transactions.filter(
    (t) =>
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
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
                  placeholder={`Search transactions...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            {/* Transactions Tab Content */}
            <Card title="All Transactions" subtitle="View and manage all transactions">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-neutral-200 hover:bg-accent-soft transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{transaction.userName}</td>
                        <td className="py-3 px-4 text-neutral-600">
                          {transaction.description}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'credit'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {transaction.type.toUpperCase()}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 font-semibold ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-neutral-900'
                          }`}
                        >
                          {transaction.type === 'credit' ? '+' : '-'}$
                          {Math.abs(transaction.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 text-sm">{transaction.date}</td>
                        <td className="py-3 px-4">{getStatusBadge(transaction.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            {transaction.status === 'pending' && (
                              <Button
                                variant="primary"
                                onClick={() => handleApprove(transaction.id, 'transaction')}
                                className="text-xs px-3 py-1"
                              >
                                <CheckCircle className="w-3 h-3 mr-1 inline" />
                                Approve
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              onClick={() => handleFlag(transaction.id, 'transaction')}
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

export default AdminTransactionsPage;
