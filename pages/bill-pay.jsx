'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Receipt, 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Building2, 
  Zap, 
  Wifi, 
  Home, 
  ShieldCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const BillPayPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [selectedPayee, setSelectedPayee] = useState(1);
  const [payAmount, setPayAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoPay, setAutoPay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const payees = [
    { id: 1, name: 'ConEdison Electric & Gas', category: 'Utilities', icon: Zap, acct: '•••• 9812', nextDue: 'Sep 15, 2026', dueAmount: '$142.50' },
    { id: 2, name: 'Verizon Fios Broadband', category: 'Telecom', icon: Wifi, acct: '•••• 3341', nextDue: 'Sep 18, 2026', dueAmount: '$89.99' },
    { id: 3, name: 'MetLife Home Insurance', category: 'Insurance', icon: Home, acct: '•••• 7702', nextDue: 'Oct 01, 2026', dueAmount: '$320.00' },
  ];

  const recentPayments = [
    { id: 'bp-901', payee: 'ConEdison Electric & Gas', date: 'Aug 14, 2026', amount: '$138.20', status: 'Delivered', conf: 'BOFA-BP-4912' },
    { id: 'bp-902', payee: 'Verizon Fios Broadband', date: 'Aug 17, 2026', amount: '$89.99', status: 'Delivered', conf: 'BOFA-BP-8812' },
    { id: 'bp-903', payee: 'MetLife Home Insurance', date: 'Jul 01, 2026', amount: '$320.00', status: 'Delivered', conf: 'BOFA-BP-2091' },
  ];

  const handlePay = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert(`Payment of $${parseFloat(payAmount).toFixed(2)} to ${payees.find(p => p.id === selectedPayee)?.name} scheduled successfully!`);
      setSubmitting(false);
      setPayAmount('');
    }, 1200);
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
              <h1 className="text-3xl font-bold text-primary-navy mb-1">Bill Pay & Scheduled Payments</h1>
              <p className="text-neutral-600 text-sm">Pay utilities, service providers, and manage automated recurring payments.</p>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Payees List & Payment Form */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Select Payee */}
                  <Card title="Select Payee or Company" subtitle="Choose an enrolled billing service">
                    <div className="space-y-3">
                      {payees.map((p) => {
                        const Icon = p.icon;
                        const isSelected = selectedPayee === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPayee(p.id);
                              setPayAmount(p.dueAmount.replace('$', ''));
                            }}
                            className={`p-4 rounded-bank border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-primary-blue bg-blue-50 ring-2 ring-primary-blue'
                                : 'border-neutral-200 bg-white hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-primary-blue flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-sm text-neutral-900">{p.name}</div>
                                <div className="text-xs text-neutral-500">{p.category} • Acct {p.acct}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-neutral-500">Due {p.nextDue}</div>
                              <div className="text-sm font-bold text-primary-navy">{p.dueAmount}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Payment Details Form */}
                  <Card title="Payment Details" subtitle="Send payment from your Checking Account **** 4532">
                    <form onSubmit={handlePay} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Payment Amount ($) *</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                          <Input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="pl-10 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">Deliver By Date</label>
                          <Input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center pt-5">
                          <label className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoPay}
                              onChange={(e) => setAutoPay(e.target.checked)}
                              className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                            />
                            <span>Enroll this bill in AutoPay</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-200 flex justify-end">
                        <Button type="submit" disabled={submitting} className="px-6 py-2.5">
                          {submitting ? 'Submitting Payment...' : 'Schedule Payment'}
                        </Button>
                      </div>
                    </form>
                  </Card>

                </div>

                {/* Right Column: Payment History & Guarantees */}
                <div className="lg:col-span-5 space-y-6">
                  
                  <Card title="Past Bill Deliveries" subtitle="Recently cleared utility payments">
                    <div className="divide-y divide-neutral-100 text-sm">
                      {recentPayments.map((item) => (
                        <div key={item.id} className="py-3.5 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-neutral-900 text-xs sm:text-sm">{item.payee}</span>
                            <span className="font-bold text-neutral-900">{item.amount}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-neutral-500">
                            <span>Paid on {item.date}</span>
                            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                              {item.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Ref: {item.conf}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Bank of America On-Time Guarantee">
                    <div className="flex items-start space-x-3 text-xs text-neutral-600">
                      <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <p className="leading-relaxed">
                        If a properly scheduled payment arrives late, Bank of America will bear responsibility for any late fees incurred, up to the full terms of our Online Banking Guarantee.
                      </p>
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

export default BillPayPage;
