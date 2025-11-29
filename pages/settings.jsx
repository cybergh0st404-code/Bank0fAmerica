'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Bell, Shield, Mail, Phone, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar'; // Adjust path after component migration
import Sidebar from '../components/Sidebar'; // Adjust path after component migration
import Card from '../components/Card'; // Adjust path after component migration
import Button from '../components/Button'; // Adjust path after component migration
import Input from '../components/Input'; // Adjust path after component migration
import { useAuth } from '../utils/AuthContext';
//import { isProjectExpired } from '../src/utils/expiryCheck';

const Settings = () => {
   const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    transactionAlerts: true,
  });
  const router = useRouter();

  // useEffect(() => {
  //   if (isProjectExpired()) {
  //     router.push('/expired');
  //     return;
  //   }
  // }, [router]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    alert('Password changed successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const ActiveIcon = tabs.find((t) => t.id === activeTab)?.icon || User;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary-navy mb-2">Settings</h1>
              <p className="text-neutral-600">Manage your account settings and preferences</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-card shadow-bank p-1 flex space-x-1 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-bank transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-blue text-white shadow-bank'
                        : 'text-neutral-600 hover:bg-accent-soft'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card
                title="Profile Information"
                subtitle="Update your personal information"
                className="animate-fade-in"
              >
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Input
                        label="Address"
                        type="text"
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <Input
                        label="City"
                        type="text"
                        placeholder="New York"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="State"
                          type="text"
                          placeholder="NY"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <Input
                          label="ZIP Code"
                          type="text"
                          placeholder="10001"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
                    <Button type="submit" variant="primary">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <Card title="Change Password" subtitle="Update your account password">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      required
                    />
                    <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
                      <Button type="submit" variant="primary">
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security">
                  <div className="flex items-center justify-between p-4 bg-accent-soft rounded-bank mb-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-primary-blue" />
                      <div>
                        <p className="font-semibold text-neutral-900">2FA Status</p>
                        <p className="text-sm text-neutral-600">
                          {twoFactorEnabled
                            ? 'Two-factor authentication is enabled'
                            : 'Two-factor authentication is disabled'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={twoFactorEnabled}
                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>
                  {twoFactorEnabled && (
                    <div className="bg-green-50 border border-green-200 rounded-bank p-4">
                      <p className="text-sm text-green-800">
                        ✓ Two-factor authentication is now active. You'll be required to enter a
                        code from your authenticator app when signing in.
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card
                title="Notification Preferences"
                subtitle="Choose how you want to receive notifications"
                className="animate-fade-in"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-bank">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-primary-blue" />
                      <div>
                        <p className="font-semibold text-neutral-900">Email Notifications</p>
                        <p className="text-sm text-neutral-600">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.email}
                        onChange={(e) =>
                          setNotifications({ ...notifications, email: e.target.checked })
                        }
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-bank">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-primary-blue" />
                      <div>
                        <p className="font-semibold text-neutral-900">SMS Notifications</p>
                        <p className="text-sm text-neutral-600">
                          Receive notifications via text message
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.sms}
                        onChange={(e) =>
                          setNotifications({ ...notifications, sms: e.target.checked })
                        }
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-bank">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-primary-blue" />
                      <div>
                        <p className="font-semibold text-neutral-900">Push Notifications</p>
                        <p className="text-sm text-neutral-600">
                          Receive push notifications in your browser
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.push}
                        onChange={(e) =>
                          setNotifications({ ...notifications, push: e.target.checked })
                        }
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-bank">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-primary-blue" />
                      <div>
                        <p className="font-semibold text-neutral-900">Transaction Alerts</p>
                        <p className="text-sm text-neutral-600">
                          Get notified about all transactions
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.transactionAlerts}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            transactionAlerts: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-200">
                    <Button
                      variant="primary"
                      onClick={() => alert('Notification preferences saved!')}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
