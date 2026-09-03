'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Shield, 
  Smartphone, 
  Laptop, 
  Key, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  LogOut, 
  Eye, 
  BellRing
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const SecurityPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!user) return;
    const fetchAccountData = async () => {
      try {
        const res = await fetch('/api/user/account-data');
        if (res.ok) {
          const data = await res.json();
          if (data.notice && data.notice.enabled) {
            setNotice(data.notice);
          } else {
            setNotice(null);
          }
        }
      } catch (err) {
        console.error('Error fetching account data:', err);
      }
    };
    fetchAccountData();
  }, [user]);

  const activeSessions = [
    { id: 1, device: 'Windows PC • Chrome 128.0', location: 'New York, NY, USA', ip: '192.168.1.45', current: true, time: 'Active now' },
    { id: 2, device: 'iPhone 15 Pro • Mobile Safari', location: 'New York, NY, USA', ip: '172.56.21.90', current: false, time: '2 hours ago' },
  ];

  const securityLog = [
    { id: 'sec-1', event: 'Successful Two-Factor Authentication Login', date: 'Today, 08:30 AM', status: 'Success' },
    { id: 'sec-2', event: 'Password Verified from Trusted Device', date: 'Yesterday, 04:12 PM', status: 'Success' },
    { id: 'sec-3', event: 'Session Refresh from Chrome Browser', date: 'Sep 01, 2026', status: 'Success' },
  ];

  const handleRevokeOthers = () => {
    alert('All other remote sessions and devices have been logged out.');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-primary-navy mb-1">Security Center & Active Sessions</h1>
              <p className="text-neutral-600 text-sm">Monitor login devices, multi-factor authentication, and account activity alerts.</p>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: 2FA & Active Sessions */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* 2FA Status Card */}
                  <Card title="Two-Factor Authentication (2FA)" subtitle="Protecting access to your accounts">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-bank flex items-start space-x-3 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-green-900">Two-Factor Authentication is Active</div>
                        <p className="text-xs text-green-700 mt-0.5">
                          Every sign-in requires your secure verification code before dashboard access is permitted.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-600 pt-2">
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4 text-primary-blue" />
                        <span>Authentication Method: <strong>6-Digit Security Code</strong></span>
                      </div>
                      <span className="bg-blue-50 text-primary-blue px-2 py-0.5 rounded font-mono font-bold">
                        Enrolled
                      </span>
                    </div>
                  </Card>

                  {/* Active Devices & Sessions */}
                  <Card title="Active Signed-In Devices" subtitle="Devices with current authorization tokens">
                    <div className="divide-y divide-neutral-100">
                      {activeSessions.map((session) => (
                        <div key={session.id} className="py-3.5 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
                              {session.device.includes('iPhone') ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-neutral-900 flex items-center space-x-2">
                                <span>{session.device}</span>
                                {session.current && (
                                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Current Session
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {session.location} • IP: {session.ip} • {session.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-neutral-200 flex justify-end">
                      <Button variant="outline" onClick={handleRevokeOthers} className="text-xs">
                        <LogOut className="w-3.5 h-3.5 mr-1.5 inline" />
                        Log Out All Other Devices
                      </Button>
                    </div>
                  </Card>

                </div>

                {/* Right Column: Security Alerts & Audit Log */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Security Alert Settings */}
                  <Card title="Instant Security Alerts" subtitle="Notifications for suspicious activity">
                    <div className="space-y-4">
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-neutral-800">Email Login Notifications</div>
                          <div className="text-[11px] text-neutral-500">Alert me when a sign-in occurs from a new device</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={emailAlerts}
                          onChange={(e) => setEmailAlerts(e.target.checked)}
                          className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                        <div>
                          <div className="text-xs font-bold text-neutral-800">SMS Transaction Alerts</div>
                          <div className="text-[11px] text-neutral-500">Text message for transfers above $1,000</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={smsAlerts}
                          onChange={(e) => setSmsAlerts(e.target.checked)}
                          className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                        />
                      </div>

                    </div>
                  </Card>

                  {/* Audit Event Log */}
                  <Card title="Recent Security Activity" subtitle="Official security audit record">
                    <div className="divide-y divide-neutral-100 text-xs">
                      {securityLog.map((log) => (
                        <div key={log.id} className="py-3 flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-neutral-800">{log.event}</div>
                            <div className="text-neutral-400 mt-0.5">{log.date}</div>
                          </div>
                          <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold text-[10px]">
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default SecurityPage;
