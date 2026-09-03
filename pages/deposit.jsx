'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Camera, 
  Upload, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  ShieldCheck,
  Check
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const DepositPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [depositAmount, setDepositAmount] = useState('');
  const [frontCaptured, setFrontCaptured] = useState(false);
  const [backCaptured, setBackCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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

  const recentDeposits = [
    { id: 'dep-101', date: 'Aug 24, 2026', checkNum: '#1044', amount: '$1,250.00', status: 'Funds Cleared' },
    { id: 'dep-102', date: 'Jul 12, 2026', checkNum: '#892', amount: '$4,500.00', status: 'Funds Cleared' },
  ];

  const handleDeposit = (e) => {
    e.preventDefault();
    if (!frontCaptured || !backCaptured) {
      alert('Please capture or upload photos of both the Front and Back of the check.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSuccessMsg(`Mobile check deposit of $${parseFloat(depositAmount).toFixed(2)} received! Funds will be available in your checking account by tomorrow morning.`);
      setSubmitting(false);
      setDepositAmount('');
      setFrontCaptured(false);
      setBackCaptured(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-primary-navy mb-1">Mobile & Remote Check Deposit</h1>
              <p className="text-neutral-600 text-sm">Deposit paper checks directly into your account using camera capture.</p>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Deposit Form & Check Zone */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {successMsg && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-bank flex items-start space-x-3 text-green-800 text-sm animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
                      <div>{successMsg}</div>
                    </div>
                  )}

                  <Card title="Deposit a New Check" subtitle="Deposit into Checking Account **** 4532">
                    <form onSubmit={handleDeposit} className="space-y-5">
                      
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Check Amount ($) *</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                          <Input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="pl-10 font-bold text-lg"
                          />
                        </div>
                      </div>

                      {/* Front and Back Check Photos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Front Zone */}
                        <div
                          onClick={() => setFrontCaptured(!frontCaptured)}
                          className={`border-2 border-dashed rounded-bank p-5 text-center cursor-pointer transition-all ${
                            frontCaptured
                              ? 'border-green-500 bg-green-50'
                              : 'border-neutral-300 hover:border-primary-blue bg-neutral-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-2 text-primary-blue">
                            {frontCaptured ? <Check className="w-5 h-5 text-green-600" /> : <Camera className="w-5 h-5" />}
                          </div>
                          <div className="text-xs font-bold text-neutral-800">Front of Check</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {frontCaptured ? 'Photo Attached (Click to remove)' : 'Click to capture / attach photo'}
                          </div>
                        </div>

                        {/* Back Zone */}
                        <div
                          onClick={() => setBackCaptured(!backCaptured)}
                          className={`border-2 border-dashed rounded-bank p-5 text-center cursor-pointer transition-all ${
                            backCaptured
                              ? 'border-green-500 bg-green-50'
                              : 'border-neutral-300 hover:border-primary-blue bg-neutral-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-2 text-primary-blue">
                            {backCaptured ? <Check className="w-5 h-5 text-green-600" /> : <Camera className="w-5 h-5" />}
                          </div>
                          <div className="text-xs font-bold text-neutral-800">Back of Check</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {backCaptured ? 'Photo Attached (Click to remove)' : 'Click to capture / attach photo'}
                          </div>
                        </div>

                      </div>

                      {/* Endorsement Instructions */}
                      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-bank text-xs text-primary-navy space-y-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <FileCheck className="w-4 h-4 text-primary-blue" />
                          <span>Required Endorsement on Back of Check</span>
                        </div>
                        <p className="text-neutral-600 leading-relaxed">
                          Sign your name on the back and write: <strong>"For Mobile Deposit Only at Bank of America"</strong> directly below your signature.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-200 flex justify-end">
                        <Button type="submit" disabled={submitting} className="px-6 py-2.5">
                          {submitting ? 'Verifying Check...' : 'Submit Check for Deposit'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>

                {/* Right Column: Limits & Recent Check Deposits */}
                <div className="lg:col-span-5 space-y-6">
                  
                  <Card title="Mobile Deposit Limits">
                    <div className="space-y-3 text-xs text-neutral-600">
                      <div className="flex justify-between pb-2 border-b border-neutral-100">
                        <span>Daily Deposit Limit:</span>
                        <span className="font-bold text-neutral-900">$10,000.00</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-neutral-100">
                        <span>Monthly Deposit Limit:</span>
                        <span className="font-bold text-neutral-900">$25,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Funds Availability:</span>
                        <span className="font-semibold text-green-700">Next Business Day</span>
                      </div>
                    </div>
                  </Card>

                  <Card title="Recent Check Deposits" subtitle="Past mobile checks credited to account">
                    <div className="divide-y divide-neutral-100 text-sm">
                      {recentDeposits.map((item) => (
                        <div key={item.id} className="py-3 flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-neutral-800 text-xs sm:text-sm">{item.checkNum}</div>
                            <div className="text-xs text-neutral-500">{item.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-neutral-900">{item.amount}</div>
                            <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                              {item.status}
                            </span>
                          </div>
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

export default DepositPage;
