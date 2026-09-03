'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Removed duplicate import
import { ArrowUpRight, ArrowDownRight, Filter, Download, Calendar, Search } from 'lucide-react';
import Navbar from '../components/Navbar'; // Adjust path after component migration
import Sidebar from '../components/Sidebar'; // Adjust path after component migration
import Card from '../components/Card'; // Adjust path after component migration
import Button from '../components/Button'; // Adjust path after component migration
import Input from '../components/Input'; // Adjust path after component migration
// import { isProjectExpired } from '../src/utils/expiryCheck'; // Removed as per user request to link website status
import { useAuth } from '../utils/AuthContext'; // Import useAuth
import { useRouter } from 'next/router'; // Use next/router for pages directory
import AccountNoticeCard from '../components/AccountNoticeCard';

const sampleTransactions = [
  {
    id: 1001,
    type: 'debit',
    description: 'Heather L Gordon',
    amount: -10000.0,
    date: '2026-01-20',
    time: '09:15 AM',
    category: 'Transfer',
    status: 'failed',
    account: 'Checking',
  },
  {
    id: 1002,
    type: 'debit',
    description: 'Sell Farmer',
    amount: -5000.0,
    date: '2026-01-18',
    time: '05:20 PM',
    category: 'Transfer',
    status: 'failed',
    account: 'Checking',
  },
  {
    id: 1003,
    type: 'debit',
    description: 'Brent McKenzie',
    amount: -10000.0,
    date: '2026-01-08',
    time: '11:45 AM',
    category: 'Transfer',
    status: 'failed',
    account: 'Checking',
  },
  
   {
    id: 1004,
    type: 'debit',
    description: 'James M Nelson',
    amount: -5000.0,
    date: '2026-01-15',
    time: '04:20 PM',
    category: 'Transfer',
    status: 'failed',
    account: 'Checking',
  },
  {
    id: 1,
    type: 'debit',
    description: 'Electricity Bill Payment',
    amount: -125.0,
    date: '2025-01-15',
    time: '10:30 AM',
    category: 'Bills',
    status: 'completed',
    account: 'Checking',
  },
  {
    id: 2,
    type: 'credit',
    description: 'Salary Deposit',
    amount: 3500.0,
    date: '2025-04-12',
    time: '8:00 AM',
    category: 'Income',
    status: 'completed',
    account: 'Checking',
  },
  {
    id: 3,
    type: 'debit',
    description: 'Grocery Store Purchase',
    amount: -87.45,
    date: '2024-01-10',
    time: '2:15 PM',
    category: 'Shopping',
    status: 'completed',
    account: 'Checking',
  },
  {
    id: 4,
    type: 'debit',
    description: 'Online Purchase - Amazon',
    amount: -234.99,
    date: '2024-01-08',
    time: '7:45 PM',
    category: 'Shopping',
    status: 'completed',
    account: 'Checking',
  },
  {
    id: 5,
    type: 'debit',
    description: 'ATM Withdrawal',
    amount: -200.0,
    date: '2024-01-05',
    time: '11:20 AM',
    category: 'ATM',
    status: 'completed',
    account: 'Checking',
  },
  {
    id: 6,
    type: 'credit',
    description: 'Transfer from Savings',
    amount: 1000.0,
    date: '2024-01-03',
    time: '9:10 AM',
    category: 'Transfer',
    status: 'completed',
    account: 'Checking',
  },
  {
    id: 7,
    type: 'debit',
    description: 'Restaurant Payment',
    amount: -45.67,
    date: '2024-01-02',
    time: '6:30 PM',
    category: 'Dining',
    status: 'completed',
    account: 'Checking',
  },
  {
    id: 8,
    type: 'debit',
    description: 'Monthly Subscription',
    amount: -29.99,
    date: '2024-01-01',
    time: '12:00 AM',
    category: 'Bills',
    status: 'completed',
    account: 'Checking',
  },
];

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState(sampleTransactions); // Initialize with data
  const [filteredTransactions, setFilteredTransactions] = useState(sampleTransactions); // Initialize with data
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all'); // Changed initial state to 'all'
  const [notice, setNotice] = useState(null);
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth(); // Use useAuth to get user, logout, and authLoading

  // If auth is not loading and user is null (not authenticated), redirect to login
  useEffect(() => {
    if (!authLoading && !user) { // Removed isProjectExpired check
      router.push('/login');
    }
  }, [user, router, authLoading]); // Added authLoading to dependency array

  // Fetch live user transactions
  useEffect(() => {
    if (!user) return;
    const fetchUserTransactions = async () => {
      try {
        const res = await fetch('/api/user/account-data');
        if (res.ok) {
          const data = await res.json();
          if (data.transactions) {
            setTransactions(data.transactions);
            setFilteredTransactions(data.transactions);
          }
          if (data.notice && data.notice.enabled) {
            setNotice(data.notice);
          } else {
            setNotice(null);
          }
        }
      } catch (err) {
        console.error('Error fetching user transactions:', err);
      }
    };
    fetchUserTransactions();
  }, [user]);

  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter((t) => t.type === filter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter((t) => new Date(t.date) >= cutoffDate);
    }

    setFilteredTransactions(filtered);
  }, [filter, searchQuery, dateRange, transactions]);

  const getCategoryColor = (category) => {
    const colors = {
      Bills: 'bg-blue-100 text-blue-700',
      Income: 'bg-green-100 text-green-700',
      Shopping: 'bg-purple-100 text-purple-700',
      ATM: 'bg-gray-100 text-gray-700',
      Transfer: 'bg-yellow-100 text-yellow-700',
      Dining: 'bg-red-100 text-red-700',
    };
    return colors[category] || 'bg-neutral-100 text-neutral-700';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {!user ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Loading user data...
        </div>
      ) : (
        <>
          <Navbar user={user} onLogout={logout} />
          <div className="flex">
            <Sidebar isAdmin={user?.role === 'admin'} />
            <main className="flex-1 p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-primary-navy mb-2">
                      Transaction History
                    </h1>
                    <p className="text-neutral-600">
                      View and filter all your account transactions
                    </p>
                  </div>
                  {(!notice || !notice.enabled) && (
                    <Button variant="outline" className="flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>

                {notice && notice.enabled ? (
                  <AccountNoticeCard notice={notice} />
                ) : (
                  <>
                    {/* Filters */}
                    <Card>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            <Filter className="w-4 h-4 inline mr-1" />
                            Type
                          </label>
                          <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="input-field"
                          >
                            <option value="all">All Transactions</option>
                            <option value="credit">Credits Only</option>
                            <option value="debit">Debits Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Date Range
                          </label>
                          <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="input-field"
                          >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Search
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <Input
                              placeholder="Search by description or category..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Transactions Table */}
                    <Card title={`Transactions (${filteredTransactions.length})`}>
                      {/* Desktop Table (Hidden on Mobile) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                                Date & Time
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                                Description
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                                Category
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-neutral-700">
                                Account
                              </th>
                              <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                                Amount
                              </th>
                              <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {filteredTransactions.map((transaction) => {
                              const isCredit = transaction.type === 'credit' || transaction.amount > 0;
                              return (
                                <tr
                                  key={transaction.id}
                                  className="hover:bg-accent-soft transition-colors"
                                >
                                  <td className="py-4 px-4 text-neutral-600 text-sm">
                                    <div>{transaction.date}</div>
                                    <div className="text-xs text-neutral-500">
                                      {transaction.time}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                          isCredit
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                      >
                                        {isCredit ? (
                                          <ArrowDownRight className="w-4 h-4" />
                                        ) : (
                                          <ArrowUpRight className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-neutral-900">
                                          {transaction.description}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="px-2 py-1 bg-neutral-100 rounded-full text-xs font-medium">
                                      {transaction.category}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-neutral-600">
                                    {transaction.account || 'Checking'}
                                  </td>
                                  <td
                                    className={`py-4 px-4 text-right font-semibold ${
                                      isCredit
                                        ? 'text-green-600'
                                        : 'text-neutral-900'
                                    }`}
                                  >
                                    {isCredit ? '+' : ''}
                                    $
                                    {Math.abs(transaction.amount).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                        transaction.status === 'completed'
                                          ? 'bg-green-100 text-green-700'
                                          : transaction.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {transaction.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards View (Visible on Phones below md) */}
                      <div className="md:hidden divide-y divide-neutral-200">
                        {filteredTransactions.map((transaction) => {
                          const isCredit = transaction.type === 'credit' || transaction.amount > 0;
                          return (
                            <div key={transaction.id} className="py-3.5 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2.5 min-w-0">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                      isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {isCredit ? (
                                      <ArrowDownRight className="w-4 h-4" />
                                    ) : (
                                      <ArrowUpRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-neutral-900 text-sm truncate">
                                      {transaction.description}
                                    </div>
                                    <div className="text-xs text-neutral-500 truncate">
                                      {transaction.account || 'Checking'} • {transaction.date}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <div
                                    className={`font-bold text-sm ${
                                      isCredit ? 'text-green-600' : 'text-neutral-900'
                                    }`}
                                  >
                                    {isCredit ? '+' : ''}$
                                    {Math.abs(transaction.amount).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                  <div className="text-[10px] text-neutral-400">{transaction.time}</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs">
                                <span className="px-2 py-0.5 bg-neutral-100 rounded-full text-[11px] font-medium text-neutral-600">
                                  {transaction.category}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                                    transaction.status === 'completed'
                                      ? 'bg-green-100 text-green-700'
                                      : transaction.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {transaction.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <p className="text-sm text-neutral-600 mb-2">Total Credits</p>
                        <p className="text-2xl font-bold text-green-600">
                          +$
                          {filteredTransactions
                            .filter((t) => t.type === 'credit')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </p>
                      </Card>
                      <Card>
                        <p className="text-sm text-neutral-600 mb-2">Total Debits</p>
                        <p className="text-2xl font-bold text-accent-red">
                          $
                          {filteredTransactions
                            .filter((t) => t.type === 'debit')
                            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                            .toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </p>
                      </Card>
                      <Card>
                        <p className="text-sm text-neutral-600 mb-2">Net Amount</p>
                        <p className="text-2xl font-bold text-primary-blue">
                          $
                          {filteredTransactions
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </p>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
