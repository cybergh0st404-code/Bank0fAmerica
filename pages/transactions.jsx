'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Removed duplicate import
import { ArrowUpRight, ArrowDownRight, Filter, Download, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar'; // Adjust path after component migration
import Sidebar from '../components/Sidebar'; // Adjust path after component migration
import Card from '../components/Card'; // Adjust path after component migration
import Button from '../components/Button'; // Adjust path after component migration
import Input from '../components/Input'; // Adjust path after component migration
// import { isProjectExpired } from '../src/utils/expiryCheck'; // Removed as per user request to link website status
import { useAuth } from '../utils/AuthContext'; // Import useAuth
import { useRouter } from 'next/router'; // Use next/router for pages directory

const sampleTransactions = [
  {
    id: 1001,
    type: 'debit',
    description: 'Cathie Pritchard',
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
    description: 'Brent McKenzie',
    amount: -10000.0,
    date: '2026-01-18',
    time: '11:45 AM',
    category: 'Transfer',
    status: 'failed',
    account: 'Checking',
  },
  {
    id: 1003,
    type: 'debit',
    description: 'Patch P Jones',
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
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth(); // Use useAuth to get user, logout, and authLoading

  // If auth is not loading and user is null (not authenticated), redirect to login
  useEffect(() => {
    if (!authLoading && !user) { // Removed isProjectExpired check
      router.push('/login');
    }
  }, [user, router, authLoading]); // Added authLoading to dependency array

  // Removed the isProjectExpired check as it's no longer relevant after middleware refactor
  // useEffect(() => {
  //   if (isProjectExpired()) {
  //     router.push('/expired');
  //     return;
  //   }
  // }, [router]);

  // No need to set transactions here as they are initialized directly

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
                  <Button variant="outline" className="flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <Card>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-bank">
                      <p className="text-sm text-red-700 font-medium">
                        Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-neutral-600">Authorization Progress</span>
                        <span className="text-sm font-semibold text-accent-red">65% • Failed</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-3 bg-accent-red rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </div>
                </Card>

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
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="all">All time</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Search
                      </label>
                      <Input
                        placeholder="Search by description or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                {/* Transaction List */}
                <Card>
                  <div className="space-y-3">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-bank hover:shadow-bank transition-all cursor-pointer"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                transaction.type === 'credit'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-accent-red'
                              }`}
                            >
                              {transaction.type === 'credit' ? (
                                <ArrowDownRight className="w-6 h-6" />
                              ) : (
                                <ArrowUpRight className="w-6 h-6" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-semibold text-neutral-900">
                                  {transaction.description}
                                </p>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                                    transaction.category
                                  )}`}
                                >
                                  {transaction.category}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-600">
                                {transaction.date} at {transaction.time} • {transaction.account}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p
                              className={`text-lg font-bold ${
                                transaction.type === 'credit'
                                  ? 'text-green-600'
                                  : 'text-neutral-900'
                              }`}
                            >
                              {transaction.type === 'credit' ? '+' : ''}
                              ${Math.abs(transaction.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1 capitalize">
                              {transaction.status}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-neutral-600">No transactions found</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <p className="text-sm text-neutral-600 mb-2">Total Credits</p>
                    <p className="text-2xl font-bold text-green-600">
                      $
                      {filteredTransactions
                        .filter((t) => t.type === 'credit')
                        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
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
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
