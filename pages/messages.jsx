'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Mail,
  Inbox,
  Send,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  X,
  Building,
  Headphones,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../utils/AuthContext';
import LockedServiceNotice from '../components/LockedServiceNotice';
import { usePageSecurity } from '../lib/usePageSecurity';

const MessagesPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { isLocked: isMessagesLocked } = usePageSecurity('messages');
  const { isLocked: isSupportLocked } = usePageSecurity('support');

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'notices' | 'security' | 'support'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [notice, setNotice] = useState(null);

  // Live Support Chat & Corporate Email State
  const [supportChat, setSupportChat] = useState({
    corporateEmail: 'concierge.desk@bankofamerica.com',
    advisorName: 'Bank of America Client Care Desk',
    messages: [],
    unreadByUser: 0,
  });
  const [supportMessageInput, setSupportMessageInput] = useState('');
  const [sendingSupportMsg, setSendingSupportMsg] = useState(false);
  const [copiedCorpEmail, setCopiedCorpEmail] = useState(false);
  const supportChatEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, router, authLoading]);

  // Switch to Support tab if ?tab=support or ?support=open is in URL
  useEffect(() => {
    if (router.isReady) {
      if (router.query.tab === 'support' || router.query.support === 'open') {
        setActiveFilter('support');
      }
    }
  }, [router.isReady, router.query.tab, router.query.support]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchAccountData = async () => {
      try {
        const res = await fetch('/api/user/account-data');
        if (!isMounted || !res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        if (data.notice) {
          setNotice(data.notice);
        }
      } catch (err) {
        console.error('Error fetching account data:', err);
      }
    };
    fetchAccountData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Poll Live Support Chat
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const isViewingSupport = activeFilter === 'support';

    const fetchSupportChat = async (markRead = false) => {
      try {
        const res = await fetch(`/api/support${markRead ? '?markRead=user' : ''}`, { cache: 'no-store' });
        if (!isMounted || !res.ok) return;
        const data = await res.json();
        if (isMounted && data.supportChat) {
          setSupportChat(data.supportChat);
        }
      } catch (_) {}
    };

    fetchSupportChat(isViewingSupport);
    const interval = setInterval(() => {
      fetchSupportChat(isViewingSupport);
    }, isViewingSupport ? 5000 : 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id, activeFilter]);

  useEffect(() => {
    if (activeFilter === 'support' && supportChatEndRef.current) {
      supportChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeFilter, supportChat.messages?.length]);

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportMessageInput.trim() || sendingSupportMsg) return;
    const textToSend = supportMessageInput.trim();
    setSendingSupportMsg(true);
    setSupportMessageInput('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.supportChat) {
          setSupportChat(data.supportChat);
        }
      } else {
        setSupportMessageInput(textToSend);
      }
    } catch (_) {
      setSupportMessageInput(textToSend);
    } finally {
      setSendingSupportMsg(false);
    }
  };

  const handleCopyCorporateEmail = () => {
    if (!supportChat?.corporateEmail) return;
    try {
      navigator.clipboard.writeText(supportChat.corporateEmail);
      setCopiedCorpEmail(true);
      setTimeout(() => setCopiedCorpEmail(false), 2000);
    } catch (_) {}
  };

  const baseMessages = [
    {
      id: 'msg-1',
      sender: 'Bank of America Executive Client Care',
      subject: 'Welcome to your Preferred Online Banking Portal',
      preview: 'We are pleased to confirm your high-balance online banking enrollment...',
      date: 'Sep 01, 2026',
      time: '09:00 AM',
      unread: false,
      category: 'Notices',
      body: `Dear Valued Client,\n\nWelcome to your customized Bank of America online banking portal. Your accounts and linked card facilities are now active and provisioned.\n\nAs a preferred account holder, you have direct access to your relationship manager, wire transfers, e-statements, and our 24/7 security monitoring team.\n\nThank you for choosing Bank of America.\n\nSincerely,\nExecutive Client Care Division\nBank of America, N.A.`,
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
      body: `Dear Client,\n\nThis is an automated confirmation that a secure login session was initiated and verified on your account using your multi-factor authentication code.\n\nDevice: Verified Web Browser\nLocation: Encrypted IP Network\n\nIf you authorized this session, no further action is required. If you did not initiate this sign-in, please immediately freeze your account or contact our fraud dispatch department.\n\nSecurity Operations Center\nBank of America`,
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
      body: `Dear Account Holder,\n\nPlease be reminded that domestic Federal Wire submissions are processed continuously on banking business days between 8:00 AM and 5:00 PM Eastern Time.\n\nFor international wire transfers, beneficiary crediting typically takes 1 to 2 business days depending on the destination institution's SWIFT clearing timezone.\n\nTreasury Services\nBank of America`,
    },
  ];

  const rawNoticeHistory =
    notice && Array.isArray(notice.messages) && notice.messages.length > 0
      ? notice.messages
      : notice && (notice.sendAsMessage || notice.enabled) && notice.message
      ? [notice]
      : [];

  const adminNoticeMessages = rawNoticeHistory.map((nItem, idx) => ({
    id: nItem.id || `msg-admin-notice-${idx}`,
    sender: nItem.sender || 'Bank of America Executive Compliance',
    subject: nItem.subject || nItem.progressLabel || 'Official Account & Compliance Notice',
    preview: nItem.message || '',
    date: nItem.sentDate || 'Today',
    time: nItem.sentTime || 'Priority',
    unread: true,
    isPriorityNotice: true,
    category: nItem.category || 'Notices',
    body: nItem.message || '',
    progress: nItem.progress,
    progressStatus: nItem.progressStatus,
    progressLabel: nItem.progressLabel,
    showProgress: Boolean(nItem.enabled ?? notice?.enabled),
  }));

  const adminNoticeMessage = adminNoticeMessages[0] || null;
  const messages = [...adminNoticeMessages, ...baseMessages];

  const filtered =
    activeFilter === 'all' || activeFilter === 'support'
      ? messages
      : messages.filter((m) => m.category.toLowerCase() === activeFilter.toLowerCase());

  const noticesCount = messages.filter((m) => m.category.toLowerCase() === 'notices').length;
  const securityCount = messages.filter((m) => m.category.toLowerCase() === 'security').length;

  const isCurrentViewLocked =
    activeFilter === 'support' ? isSupportLocked : isMessagesLocked;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-primary-navy mb-1">
                  {activeFilter === 'support'
                    ? 'Live Support & Client Concierge'
                    : 'Secure Message Center'}
                </h1>
                <p className="text-neutral-600 text-sm">
                  {activeFilter === 'support'
                    ? 'Direct encrypted two-way messaging with your dedicated Bank of America advisor.'
                    : 'Official encrypted correspondence, compliance notices, and customer care alerts.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'support' ? 'all' : 'support')}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-bank text-xs sm:text-sm font-bold shadow-sm transition-all ${
                  activeFilter === 'support'
                    ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                    : 'bg-primary-navy text-white hover:bg-primary-blue'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>
                  {activeFilter === 'support' ? 'Back to Message Inbox' : 'Open Live Support Chat'}
                </span>
                {supportChat.unreadByUser > 0 && activeFilter !== 'support' && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-accent-red text-white text-[10px] font-bold animate-pulse">
                    {supportChat.unreadByUser} New
                  </span>
                )}
              </button>
            </div>

            {/* Active Restriction Notice Banner */}
            {notice && notice.enabled && (
              <div
                onClick={() => {
                  if (adminNoticeMessage) {
                    setActiveFilter('all');
                    setSelectedMessage(adminNoticeMessage);
                  }
                }}
                className="cursor-pointer p-4 rounded-card bg-red-50 border border-red-200 flex items-start space-x-3 shadow-sm hover:bg-red-100/70 transition-colors"
              >
                <AlertTriangle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-red-900 uppercase tracking-wide">
                      {notice.subject || notice.progressLabel || 'Action Required: Account Restriction Notice'}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-accent-red border border-red-300">
                      {notice.progressStatus || `${notice.progress || 65}%`}
                    </span>
                  </div>
                  <p className="text-xs text-red-800 mt-1 line-clamp-2">{notice.message}</p>
                </div>
              </div>
            )}

            {isCurrentViewLocked ? (
              <LockedServiceNotice
                serviceName={
                  activeFilter === 'support'
                    ? 'Live Support & Concierge'
                    : 'Secure Message Center'
                }
                pageId={activeFilter === 'support' ? 'support' : 'messages'}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar Filter */}
                <div className="lg:col-span-3">
                  <Card className="p-3">
                    <nav className="space-y-1.5">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-bank text-xs font-semibold transition-colors ${
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-bank text-xs font-semibold transition-colors ${
                          activeFilter === 'notices'
                            ? 'bg-primary-blue text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>Official Notices</span>
                        </div>
                        <span className="text-[10px] opacity-80">{noticesCount}</span>
                      </button>

                      <button
                        onClick={() => setActiveFilter('security')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-bank text-xs font-semibold transition-colors ${
                          activeFilter === 'security'
                            ? 'bg-primary-blue text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Security Alerts</span>
                        </div>
                        <span className="text-[10px] opacity-80">{securityCount}</span>
                      </button>

                      <div className="pt-2 mt-2 border-t border-neutral-200">
                        <button
                          onClick={() => setActiveFilter('support')}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-bank text-xs font-bold transition-colors ${
                            activeFilter === 'support'
                              ? 'bg-primary-navy text-white shadow-sm'
                              : 'bg-blue-50/80 text-primary-navy hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-primary-blue" />
                            <span>Live Support Chat</span>
                          </div>
                          {supportChat.unreadByUser > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-accent-red text-white text-[10px] font-bold animate-pulse">
                              {supportChat.unreadByUser}
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                          )}
                        </button>
                      </div>
                    </nav>
                  </Card>
                </div>

                {/* Main Content Area: Either Live Support Chat or Messages Inbox */}
                <div className="lg:col-span-9">
                  {activeFilter === 'support' ? (
                    <div className="bg-white rounded-card shadow-bank border border-neutral-200 overflow-hidden flex flex-col">
                      {/* Support Desk Header */}
                      <div className="px-5 py-4 bg-gradient-to-r from-primary-navy via-[#062b78] to-primary-blue text-white flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white">
                            <Headphones className="w-5 h-5" />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-primary-navy" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold">
                              {supportChat?.advisorName || 'Bank of America Client Care Desk'}
                            </h3>
                            <p className="text-xs text-blue-100 flex items-center space-x-1.5">
                              <span>Encrypted Client Support Line • Online</span>
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-300/40 text-emerald-200 text-xs font-semibold">
                          256-Bit Encrypted Chat
                        </span>
                      </div>

                      {/* Official Corporate Support Email Banner */}
                      <div className="px-5 py-3 bg-blue-50/70 border-b border-blue-200/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary-blue/10 border border-primary-blue/25 flex items-center justify-center text-primary-blue flex-shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-primary-navy">
                                Official Corporate Support Email
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[9px] font-bold">
                                Verified Desk
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-mono font-bold text-primary-blue truncate">
                              {supportChat?.corporateEmail || 'concierge.desk@bankofamerica.com'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCorporateEmail}
                          className="px-3 py-1.5 rounded-bank border border-primary-blue/30 bg-white hover:bg-blue-50 text-primary-navy text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
                        >
                          {copiedCorpEmail ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-primary-blue" />
                              <span>Copy Email</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Chat Messages Feed */}
                      <div className="p-4 sm:p-5 space-y-3.5 bg-slate-50 min-h-[340px] max-h-[460px] overflow-y-auto">
                        {/* Welcome System Message */}
                        <div className="flex items-start space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-navy text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border border-neutral-200 p-3.5 text-xs sm:text-sm text-neutral-800 shadow-xs">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="text-[11px] font-bold text-primary-navy">
                                {supportChat?.advisorName || 'Bank of America Client Care Desk'}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                {supportChat?.corporateEmail || 'concierge.desk@bankofamerica.com'}
                              </span>
                            </div>
                            <p className="leading-relaxed text-neutral-700">
                              Welcome, <span className="font-bold text-primary-navy">{user?.name || 'Valued Client'}</span>. You are connected to your dedicated Bank of America Support Desk. Send a message below and your account administrator will respond directly here.
                            </p>
                          </div>
                        </div>

                        {(supportChat?.messages || []).map((msg) => {
                          const isUserMsg = msg.sender === 'user';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isUserMsg ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-xs ${
                                  isUserMsg
                                    ? 'rounded-tr-sm bg-primary-blue text-white'
                                    : 'rounded-tl-sm bg-white border border-blue-200 text-neutral-900'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 mb-1">
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider ${
                                      isUserMsg ? 'text-blue-100' : 'text-primary-navy'
                                    }`}
                                  >
                                    {isUserMsg
                                      ? 'You'
                                      : msg.senderName || supportChat?.advisorName || 'Bank of America Support'}
                                  </span>
                                  <span
                                    className={`text-[10px] font-mono ${
                                      isUserMsg ? 'text-blue-200' : 'text-neutral-400'
                                    }`}
                                  >
                                    {msg.timestamp || 'Just now'}
                                  </span>
                                </div>
                                <p className="whitespace-pre-line leading-relaxed break-words">{msg.text}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={supportChatEndRef} />
                      </div>

                      {/* Send Message Form */}
                      <form
                        onSubmit={handleSendSupportMessage}
                        className="p-3.5 sm:p-4 bg-white border-t border-neutral-200 flex items-center space-x-2.5"
                      >
                        <input
                          type="text"
                          value={supportMessageInput}
                          onChange={(e) => setSupportMessageInput(e.target.value)}
                          placeholder="Type your message to Bank of America Support..."
                          className="flex-1 border border-neutral-300 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 rounded-bank px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
                        />
                        <Button
                          type="submit"
                          disabled={!supportMessageInput.trim() || sendingSupportMsg}
                          className="flex items-center space-x-1.5 px-5 py-2.5 text-xs sm:text-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingSupportMsg ? 'Sending...' : 'Send'}</span>
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <Card title={`Inbox (${filtered.length})`} subtitle="Encrypted banking communications">
                      <div className="divide-y divide-neutral-200">
                        {filtered.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg)}
                            className={`py-4 px-3 rounded-bank cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              msg.isPriorityNotice
                                ? 'bg-blue-50/70 hover:bg-blue-100/70 border-l-4 border-primary-blue my-1'
                                : 'hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  msg.isPriorityNotice
                                    ? 'bg-primary-blue text-white shadow-sm'
                                    : 'bg-blue-100 text-primary-blue'
                                }`}
                              >
                                {msg.isPriorityNotice ? (
                                  <AlertCircle className="w-4 h-4" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-neutral-900">{msg.sender}</span>
                                  {msg.isPriorityNotice && (
                                    <span className="text-[10px] bg-accent-red text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      New Notice
                                    </span>
                                  )}
                                  <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-semibold">
                                    {msg.category}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-neutral-800 mt-0.5">
                                  {msg.subject}
                                </div>
                                <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{msg.preview}</p>
                              </div>
                            </div>
                            <div className="text-right text-[11px] text-neutral-500 whitespace-nowrap sm:pl-4 font-medium">
                              <div>{msg.date}</div>
                              <div>{msg.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
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
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-primary-blue px-2 py-0.5 rounded">
                          {selectedMessage.category}
                        </span>
                        {selectedMessage.isPriorityNotice && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-accent-red px-2 py-0.5 rounded">
                            Official Account Notice
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-primary-navy mt-1.5">
                        {selectedMessage.subject}
                      </h3>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        From: <strong className="text-neutral-800">{selectedMessage.sender}</strong> •{' '}
                        {selectedMessage.date} {selectedMessage.time ? `at ${selectedMessage.time}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="text-sm text-neutral-800 whitespace-pre-line leading-relaxed bg-neutral-50 p-4 rounded-bank border border-neutral-200 mb-5 font-sans">
                    {selectedMessage.body}
                  </div>

                  {selectedMessage.showProgress && (
                    <div className="p-3.5 bg-red-50/70 rounded-bank border border-red-200 mb-5">
                      <div className="text-xs font-semibold text-neutral-700 mb-1.5 flex justify-between">
                        <span>{selectedMessage.progressLabel || 'Authorization Progress'}</span>
                        <span className="text-accent-red font-bold">
                          {selectedMessage.progressStatus || `${selectedMessage.progress || 65}%`}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-red rounded-full transition-all"
                          style={{ width: `${selectedMessage.progress || 65}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-200">
                    <Button variant="secondary" onClick={() => setSelectedMessage(null)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedMessage(null);
                        setActiveFilter('support');
                      }}
                    >
                      Reply via Live Support
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
