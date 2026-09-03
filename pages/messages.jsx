'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Mail, 
  Inbox, 
  Send, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock, 
  User, 
  Building
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const MessagesPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
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

  const messages = [
    {
      id: 'msg-1',
      sender: 'Bank of America Executive Client Care',
      subject: 'Welcome to your Preferred Online Banking Portal',
      preview: 'We are pleased to confirm your high-balance online banking enrollment...',
      date: 'Sep 01, 2026',
      time: '09:00 AM',
      unread: false,
      category: 'Notices',
      body: `Dear Valued Client,\n\nWelcome to your customized Bank of America online banking portal. Your checking account **** 4532 and linked card facilities are now provisioned.\n\nAs a preferred account holder, you have direct access to your dedicated relationship manager, wire transfers, e-statements, and our 24/7 security monitoring team.\n\nThank you for choosing Bank of America.\n\nSincerely,\nExecutive Client Care Division\nBank of America, N.A.`
    },
    {
      id: 'msg-2',
      sender: 'Fraud & Security Operations',
      subject: 'Security Notice: New Sign-In Verification',
      preview: 'Your recent sign-in was verified using Two-Factor Authentication...',
      date: 'Aug 29, 2026',
      time: '04:15 PM',
      unread: false,
      category: 'Security',
      body: `Dear Client,\n\nThis is an automated confirmation that a secure login session was initiated and verified on your account using your multi-factor authentication code.\n\nDevice: Windows Chrome\nLocation: Verified IP Network\n\nIf you authorized this session, no further action is required. If you did not initiate this sign-in, please immediately freeze your account or contact our fraud dispatch department.\n\nSecurity Operations Center\nBank of America`
    },
    {
      id: 'msg-3',
      sender: 'Treasury & Wire Division',
      subject: 'Scheduled Fedwire Processing Hours',
      preview: 'Please note the upcoming holiday wire processing deadlines...',
      date: 'Aug 15, 2026',
      time: '11:30 AM',
      unread: false,
      category: 'Notices',
      body: `Dear Account Holder,\n\nPlease be reminded that domestic Federal Wire submissions are processed continuously on banking business days between 8:00 AM and 5:00 PM Eastern Time.\n\nFor international wire transfers, beneficiary crediting typically takes 1 to 2 business days depending on the destination institution's SWIFT clearing timezone.\n\nTreasury Services\nBank of America`
    },
  ];

  const filtered = activeFilter === 'all'
    ? messages
    : messages.filter((m) => m.category.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-primary-navy mb-1">Secure Message Center</h1>
              <p className="text-neutral-600 text-sm">Official encrypted correspondence, compliance notices, and customer care alerts.</p>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Sidebar Filter */}
                <div className="lg:col-span-3">
                  <Card className="p-3">
                    <nav className="space-y-1">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-bank text-xs font-semibold transition-colors ${
                          activeFilter === 'all'
                            ? 'bg-primary-blue text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Inbox className="w-4 h-4" />
                          <span>All Messages</span>
                        </div>
                        <span className="text-[10px] bg-white bg-opacity-20 px-1.5 py-0.5 rounded">
                          {messages.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveFilter('notices')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-bank text-xs font-semibold transition-colors ${
                          activeFilter === 'notices'
                            ? 'bg-primary-blue text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>Official Notices</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">2</span>
                      </button>

                      <button
                        onClick={() => setActiveFilter('security')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-bank text-xs font-semibold transition-colors ${
                          activeFilter === 'security'
                            ? 'bg-primary-blue text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Security Alerts</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">1</span>
                      </button>
                    </nav>
                  </Card>
                </div>

                {/* Messages List */}
                <div className="lg:col-span-9">
                  <Card title={`Inbox (${filtered.length})`} subtitle="Encrypted banking communications">
                    <div className="divide-y divide-neutral-200">
                      {filtered.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => setSelectedMessage(msg)}
                          className="py-4 px-2 hover:bg-neutral-50 rounded-bank cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-primary-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-neutral-900">{msg.sender}</span>
                                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-semibold">
                                  {msg.category}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-neutral-800 mt-0.5">{msg.subject}</div>
                              <p className="text-xs text-neutral-500 line-clamp-1">{msg.preview}</p>
                            </div>
                          </div>
                          <div className="text-right text-[11px] text-neutral-400 whitespace-nowrap sm:pl-4">
                            <div>{msg.date}</div>
                            <div>{msg.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

              </div>
            )}

            {/* Message Modal Reader */}
            {selectedMessage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
                <div className="bg-white rounded-card shadow-bank-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-start pb-4 border-b border-neutral-200 mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                        {selectedMessage.category}
                      </span>
                      <h3 className="text-lg font-bold text-primary-navy mt-1.5">{selectedMessage.subject}</h3>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        From: <strong className="text-neutral-800">{selectedMessage.sender}</strong> • {selectedMessage.date} at {selectedMessage.time}
                      </div>
                    </div>
                    <button onClick={() => setSelectedMessage(null)} className="text-neutral-400 hover:text-neutral-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed bg-neutral-50 p-4 rounded-bank border border-neutral-200 mb-5 font-sans">
                    {selectedMessage.body}
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-200">
                    <Button variant="secondary" onClick={() => setSelectedMessage(null)}>
                      Close
                    </Button>
                    <Button onClick={() => alert('Your response has been forwarded to your Bank of America relationship manager.')}>
                      Reply to Representative
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default MessagesPage;
