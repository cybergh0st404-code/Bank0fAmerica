'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  CreditCard, 
  ArrowUpRight,
  Info
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const CreditScorePage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
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

  const scoreFactors = [
    { name: 'Payment History', grade: 'Exceptional', impact: 'High Impact', stat: '100% on-time payments', color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Credit Card Utilization', grade: 'Good', impact: 'High Impact', stat: '11% ($2,200 of $20,000 used)', color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Derogatory Marks', grade: 'Exceptional', impact: 'High Impact', stat: '0 public records or collections', color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Average Age of Credit', grade: 'Good', impact: 'Medium Impact', stat: '8 yrs 2 mos', color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Accounts', grade: 'Good', impact: 'Low Impact', stat: '14 credit lines & loans', color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Hard Credit Inquiries', grade: 'Low', impact: 'Low Impact', stat: '1 inquiry in past 12 mos', color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-primary-navy mb-1">FICO® Score & Credit Health</h1>
              <p className="text-neutral-600 text-sm">Complimentary monthly credit score powered by Equifax® data.</p>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <>
                {/* Score Gauge Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Gauge Card */}
                  <div className="lg:col-span-5">
                    <Card className="text-center p-6 sm:p-8 relative overflow-hidden bg-gradient-to-b from-white to-neutral-50 shadow-bank">
                      <div className="text-xs tracking-widest font-bold text-neutral-400 uppercase mb-4">
                        FICO® Score 8 • Equifax
                      </div>

                      {/* Circular Gauge Representation */}
                      <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                        <div className="w-full h-full rounded-full border-8 border-neutral-100 border-t-green-500 border-r-green-500 border-b-green-500 rotate-45 transform"></div>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-5xl font-black text-primary-navy tracking-tight">748</span>
                          <span className="text-sm font-bold text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full mt-1">
                            Excellent
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-neutral-400 px-6 mt-4">
                        <span>300 (Poor)</span>
                        <span>850 (Exceptional)</span>
                      </div>

                      <div className="mt-6 pt-4 border-t border-neutral-200 text-xs text-neutral-500">
                        Updated on <strong>Sep 01, 2026</strong> • Your score increased by <span className="text-green-600 font-bold">+6 pts</span> since last month.
                      </div>
                    </Card>
                  </div>

                  {/* Summary & Loan Pre-approvals */}
                  <div className="lg:col-span-7 space-y-6">
                    <Card title="Credit Health Summary" subtitle="You are in the top 20% of US consumers">
                      <div className="space-y-3 text-sm text-neutral-600 leading-relaxed">
                        <p>
                          Lenders consider you a <strong>low-risk borrower</strong>. Consumers with an Excellent FICO® score typically qualify for our lowest annual percentage rates (APR) on auto loans, mortgages, and rewards cards.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 pt-3">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-bank">
                            <div className="text-xs text-neutral-500">Auto Loan APR as low as</div>
                            <div className="text-xl font-bold text-primary-navy">4.49% APR</div>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-bank">
                            <div className="text-xs text-neutral-500">Credit Card Limit Eligibility</div>
                            <div className="text-xl font-bold text-primary-navy">Up to $35,000</div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card title="Pre-Approved Bank of America Offer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 text-accent-red flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-neutral-900">Bank of America® Premium Rewards®</div>
                            <div className="text-xs text-neutral-500">50,000 bonus points offer with $0 intro APR</div>
                          </div>
                        </div>
                        <Button className="text-xs px-3 py-1.5 flex items-center space-x-1">
                          <span>View Offer</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  </div>

                </div>

                {/* Factors Breakdown */}
                <Card title="FICO® Score Factor Breakdown" subtitle="How your day-to-day finances shape your score">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scoreFactors.map((factor, index) => (
                      <div key={index} className="p-4 bg-white border border-neutral-200 rounded-bank hover:shadow-bank transition-all space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-sm text-neutral-900">{factor.name}</div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${factor.bg} ${factor.color}`}>
                            {factor.grade}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500">{factor.stat}</div>
                        <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase pt-1">
                          {factor.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default CreditScorePage;
