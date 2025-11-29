'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, CreditCard, History, CheckCircle, AlertCircle, Search, Power, PowerOff, Shield } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/router'; // Use next/router for pages directory
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../utils/AuthContext'; // Import useAuth

// Sample admin data (moved outside component to be a constant)
const sampleUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    status: 'active',
    accounts: 2,
    createdAt: '2024-01-01',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    accounts: 1,
    createdAt: '2024-01-05',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'user',
    status: 'pending',
    accounts: 0,
    createdAt: '2024-01-10',
  },
  {
    id: 4,
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'user',
    status: 'flagged',
    accounts: 1,
    createdAt: '2024-01-12',
  },
];

const AdminUsersPage = () => { // Remove user, onLogout props
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth(); // Use useAuth to get user, logout, and authLoading
  
  const [users, setUsers] = useState(sampleUsers); // Initialize directly with sampleUsers
  const [searchQuery, setSearchQuery] = useState('');
  const [websiteOpen, setWebsiteOpen] = useState(true); // Default to true, actual status fetched in useEffect
  const [loadingWebsiteStatus, setLoadingWebsiteStatus] = useState(true);

  // If auth is not loading and user is null or not admin, redirect
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/'); // Redirect non-admins to home or login
    }
  }, [user, router, authLoading]); // Add authLoading to dependency array

  useEffect(() => {
    const fetchWebsiteStatus = async () => {
      setLoadingWebsiteStatus(true);
      try {
        const res = await fetch('/api/website-status');
        if (res.ok) {
          const data = await res.json();
          setWebsiteOpen(data.isOpen);
        } else {
          console.error('Failed to fetch website status:', res.status);
        }
      } catch (error) {
        console.error('Error fetching website status:', error);
      } finally {
        setLoadingWebsiteStatus(false);
      }
    };
    fetchWebsiteStatus();
  }, []); // Fetch status on mount

  const handleApprove = (id, type) => {
    if (type === 'user') {
      setUsers(users.map((u) => (u.id === id ? { ...u, status: 'active' } : u)));
    }
    alert('Item approved successfully!');
  };

  const handleFlag = (id, type) => {
    if (type === 'user') {
      setUsers(users.map((u) => (u.id === id ? { ...u, status: 'flagged' } : u)));
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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, path: '/admin' },
    { id: 'accounts', label: 'Accounts', icon: CreditCard, path: '/admin/accounts' },
    { id: 'transactions', label: 'Transactions', icon: History, path: '/admin/transactions' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {authLoading ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Loading authentication status...
        </div>
      ) : (!user || user.role !== 'admin') ? (
        <div className="flex items-center justify-center min-h-screen text-lg text-neutral-600">
          Redirecting to login or home page...
        </div>
      ) : (
        <>
          <Navbar user={user} onLogout={logout} />
          <div className="flex">
            <Sidebar isAdmin={true} />
            <main className="flex-1 p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-primary-navy mb-2">Admin Panel</h1>
                      <p className="text-neutral-600">Manage users, accounts, and transactions</p>
                    </div>
                    {/* Website Control */}
                    <Card className="p-4 w-full sm:w-auto">
                      <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-primary-blue" />
                          <span className="font-medium text-sm">Website Status:</span>
                          {loadingWebsiteStatus ? (
                            <span className="text-neutral-500 text-xs">Loading...</span>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              websiteOpen 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {websiteOpen ? 'Open' : 'Closed'}
                            </span>
                          )}
                        </div>
                        {!loadingWebsiteStatus && (
                          <Button
                            variant={websiteOpen ? 'danger' : 'primary'}
                            onClick={async () => {
                              try {
                                const newStatus = !websiteOpen;
                                const res = await fetch('/api/website-status', {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ isOpen: newStatus }),
                                });
                                if (res.ok) {
                                  setWebsiteOpen(newStatus);
                                  alert(`Website has been ${newStatus ? 'opened' : 'closed'}.`);
                                } else {
                                  alert('Failed to update website status.');
                                }
                              } catch (error) {
                                console.error('Error updating website status:', error);
                                alert('Error updating website status.');
                              }
                            }}
                            className="px-4 py-2 text-sm w-full sm:w-auto"
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
                        )}
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-card shadow-bank p-1 flex flex-wrap justify-center sm:justify-start gap-1 mb-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <Link
                        key={tab.id}
                        href={tab.path}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-bank transition-all text-sm sm:flex-grow-0 ${
                          router.pathname === tab.path // Use router.pathname for active state
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
                      placeholder={`Search users...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </Card>

                {/* Users Tab Content */}
                <Card title="User Management" subtitle="View and manage all users">
                  <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Name</th>
                      <th className="hidden sm:table-cell text-left py-3 px-4 font-semibold text-neutral-700">Email</th>
                      <th className="hidden md:table-cell text-left py-3 px-4 font-semibold text-neutral-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-neutral-700">Status</th>
                      <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold text-neutral-700">
                        Accounts
                      </th>
                      <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold text-neutral-700">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-accent-soft transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center text-white font-medium">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell py-3 px-4 text-neutral-600">{user.email}</td>
                        <td className="hidden md:table-cell py-3 px-4">
                          <span className="px-2 py-1 bg-neutral-100 rounded-full text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                        <td className="hidden lg:table-cell py-3 px-4">{user.accounts}</td>
                        <td className="hidden lg:table-cell py-3 px-4 text-neutral-600 text-sm">{user.createdAt}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            {user.status === 'pending' && (
                              <Button
                                variant="primary"
                                onClick={() => handleApprove(user.id, 'user')}
                                className="text-xs px-3 py-1"
                              >
                                <CheckCircle className="w-3 h-3 mr-1 inline" />
                                Approve
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              onClick={() => handleFlag(user.id, 'user')}
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
        </>
      )}
    </div>
  );
};

export default AdminUsersPage;
