'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Navbar from '../components/Navbar'; // Adjust path after component migration
import Sidebar from '../components/Sidebar'; // Adjust path after component migration
import Card from '../components/Card'; // Adjust path after component migration
import Button from '../components/Button'; // Adjust path after component migration
// import { isProjectExpired } from '../src/utils/expiryCheck'; // This file will be deleted later
import { useAuth } from '../utils/AuthContext'; // Import useAuth

const Dashboard = () => {
  const [balance, setBalance] = useState(1324742.22);
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

  // Note: The original onLogout prop for Navbar will now be the logout function from useAuth.
  // We'll also update the Navbar call below.

  const recentTransactions = [
    {
      id: 1,
      type: 'debit',
      description: 'Heather L Gordon',
      amount: -10000.0,
      date: '2026-01-20',
      category: 'Failed',
    },
    {
      id: 2,
      type: 'debit',
      description: 'Sell Farmer',
      amount: -5000.0,
      date: '2026-01-18',
      category: 'Failed',
    },
    {
      id: 3,
      type: 'debit',
      description: 'Brent McKenzie',
      amount: -10000.0,
      date: '2026-01-08',
      category: 'Failed',
    },
    {
      id: 4,
      type: 'debit',
      description: 'James M Nelson',
      amount: -5000.0,
      date: '2026-01-15',
      category: 'Failed',
    }
  ];

  const quickActions = [
    {
      label: 'Transfer Money',
      icon: ArrowLeftRight,
      action: () => router.push('/transfer'),
      color: 'bg-primary-blue',
    },
    {
      label: 'Pay Bills',
      icon: FileText,
      action: () => router.push('/transfer'),
      color: 'bg-green-600',
    },
    {
      label: 'Deposit',
      icon: ArrowDownRight,
      action: () => router.push('/transfer'),
      color: 'bg-blue-600',
    },
    {
      label: 'Withdraw',
      icon: ArrowUpRight,
      action: () => router.push('/transfer'),
      color: 'bg-accent-red',
    },
  ];

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
            <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-0">
              <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Welcome Section */}
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-primary-navy mb-2">
                    Welcome back, {user?.name || 'User'}
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-600">
                    Here's an overview of your accounts and recent activity
                  </p>
                </div>

                {/* Account Summary Card */}
                <Card className="bg-gradient-to-br from-primary-navy to-primary-blue text-white shadow-bank-lg">
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <p className="text-white text-opacity-80 text-xs sm:text-sm mb-2">Total Balance</p>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    </div>
                    <div className="text-white text-opacity-80 w-full sm:w-auto">
                      <p className="text-xs sm:text-sm">Account Number</p>
                      <p className="text-base sm:text-lg font-mono">**** **** 4532</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-white border-opacity-20 gap-3 sm:gap-0">
                    <div>
                      <p className="text-white text-opacity-80 text-xs mb-1">Available Balance</p>
                      <p className="text-lg sm:text-xl font-semibold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-white text-opacity-80 text-xs mb-1">Account Type</p>
                      <p className="text-base sm:text-lg font-semibold">Checking</p>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card title="Quick Actions" subtitle="Common banking operations">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={index}
                          onClick={action.action}
                          className={`${action.color} text-white p-4 sm:p-6 rounded-card hover:shadow-bank-lg transition-all duration-200 transform hover:-translate-y-1`}
                        >
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 mb-2 sm:mb-3 mx-auto" />
                          <p className="text-xs sm:text-sm font-medium">{action.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Analytics and Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Spending Analytics */}
                  <Card title="Spending Overview" subtitle="Last 30 days">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-bank">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm text-neutral-600">Income</p>
                            <p className="text-lg font-semibold text-green-600">$3,500.00</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-bank">
                        <div className="flex items-center space-x-3">
                          <TrendingDown className="w-5 h-5 text-accent-red" />
                          <div>
                            <p className="text-sm text-neutral-600">Expenses</p>
                            <p className="text-lg font-semibold text-accent-red">$448.44</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600">Net Savings</span>
                          <span className="text-xl font-bold text-primary-blue">+$3,051.56</span>
                        </div>
                      </div>
                      {/* Simple Chart Representation */}
                      <div className="mt-6 h-32 bg-accent-soft rounded-bank p-4 flex items-end justify-between">
                        {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
                          <div
                            key={i}
                            className="bg-primary-blue rounded-t-bank flex-1 mx-1"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Recent Transactions */}
                  <Card 
                    title="Recent Transactions" 
                    subtitle="Last 10 transactions"
                    headerAction={
                      <Link
                        href="/transactions"
                        className="text-sm px-4 py-2 border border-neutral-300 rounded-bank hover:bg-neutral-100 transition-colors"
                      >
                        View All
                      </Link>
                    }
                  >
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-2 sm:p-3 bg-accent-soft rounded-bank hover:bg-neutral-200 transition-colors cursor-pointer gap-2 sm:gap-0"
                          onClick={() => router.push('/transactions')}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                transaction.type === 'credit'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-accent-red'
                              }`}
                            >
                              {transaction.type === 'credit' ? (
                                <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-neutral-900 text-sm sm:text-base truncate">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-neutral-600 truncate">
                                {transaction.date} • {transaction.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p
                              className={`font-semibold text-sm sm:text-base ${
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
                          </div>
                        </div>
                      ))}
                    </div>
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

export default Dashboard;
