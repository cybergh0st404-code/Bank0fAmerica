'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  CreditCard, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sliders, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Plane, 
  RefreshCw,
  ShoppingBag,
  Coffee,
  Smartphone
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const CardsPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [isLocked, setIsLocked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(2500);
  const [onlinePurchases, setOnlinePurchases] = useState(true);
  const [travelMode, setTravelMode] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const copyCardNumber = () => {
    navigator.clipboard.writeText('4532 8912 3456 7890');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardTransactions = [
    { id: 1, title: 'Apple Store NYC', date: 'Yesterday, 4:12 PM', amount: -199.00, icon: Smartphone, category: 'Electronics' },
    { id: 2, title: 'Starbucks Coffee #421', date: 'Yesterday, 8:45 AM', amount: -6.75, icon: Coffee, category: 'Food & Drink' },
    { id: 3, title: 'Target Supercenter', date: 'Sep 01, 2:30 PM', amount: -84.20, icon: ShoppingBag, category: 'Retail' },
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
              <h1 className="text-3xl font-bold text-primary-navy mb-1">Cards & Virtual Wallets</h1>
              <p className="text-neutral-600 text-sm">Manage your physical cards, virtual security details, and spending limits.</p>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Visual Card & Security Toggles */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* REALISTIC BANK OF AMERICA CARD */}
                  <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-bank-lg bg-gradient-to-tr from-[#001435] via-[#012169] to-[#0A3282] border border-blue-900 transition-all duration-300">
                    
                    {/* Card Brand Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="text-xs tracking-widest text-blue-200 uppercase font-semibold">Bank of America®</div>
                        <div className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
                          <span>Customized Cash Rewards</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono tracking-widest uppercase bg-blue-900 bg-opacity-60 px-2 py-0.5 rounded border border-blue-400 border-opacity-30">
                          Debit / Contactless
                        </span>
                        {/* Contactless waves icon */}
                        <div className="w-6 h-6 flex items-center justify-center text-blue-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 16.5a5 5 0 010-7m3.5 9a8.5 8.5 0 000-11m3.5 13a12 12 0 000-15" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Chip & Locked Overlay */}
                    <div className="flex justify-between items-center mb-8">
                      {/* Realistic EMV Chip */}
                      <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-amber-600 shadow-inner flex flex-col justify-between p-1.5 opacity-95">
                        <div className="w-full h-0.5 bg-amber-700 opacity-40"></div>
                        <div className="w-full h-0.5 bg-amber-700 opacity-40"></div>
                        <div className="w-full h-0.5 bg-amber-700 opacity-40"></div>
                      </div>

                      {isLocked && (
                        <div className="flex items-center space-x-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow animate-pulse">
                          <Lock className="w-3.5 h-3.5" />
                          <span>CARD FROZEN</span>
                        </div>
                      )}
                    </div>

                    {/* 16-Digit Card Number */}
                    <div className="mb-6">
                      <div className="text-[11px] text-blue-300 mb-1 tracking-wider uppercase">Card Number</div>
                      <div className="flex items-center space-x-3 font-mono text-xl sm:text-2xl tracking-widest text-white font-bold">
                        {showDetails ? (
                          <span>4532 8912 3456 7890</span>
                        ) : (
                          <span>•••• •••• •••• 7890</span>
                        )}
                        <button
                          onClick={copyCardNumber}
                          className="p-1 hover:bg-white hover:bg-opacity-20 rounded text-blue-200 transition-colors"
                          title="Copy Card Number"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {copied && <span className="text-[10px] font-sans text-green-300">Copied!</span>}
                      </div>
                    </div>

                    {/* Footer Details: Expiry, CVV, Cardholder Name */}
                    <div className="flex justify-between items-end pt-4 border-t border-blue-400 border-opacity-20">
                      <div>
                        <div className="text-[10px] text-blue-300 uppercase tracking-wider">Cardholder</div>
                        <div className="font-semibold text-sm sm:text-base tracking-wider uppercase">
                          {user?.name || 'PATTCH P JONES'}
                        </div>
                      </div>

                      <div className="flex space-x-6 text-right">
                        <div>
                          <div className="text-[10px] text-blue-300 uppercase tracking-wider">Expires</div>
                          <div className="font-mono text-sm font-bold">08/29</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-blue-300 uppercase tracking-wider">CVV</div>
                          <div className="font-mono text-sm font-bold">
                            {showDetails ? '482' : '•••'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visa Logo Badge */}
                    <div className="absolute right-6 bottom-5 font-black italic text-2xl tracking-tighter text-white opacity-90 select-none">
                      VISA
                    </div>
                  </div>

                  {/* Card Security Controls */}
                  <Card title="Quick Card Controls" subtitle="Manage status and security switches">
                    <div className="space-y-4">
                      
                      {/* Freeze Toggle */}
                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-bank border border-neutral-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isLocked ? 'bg-red-100 text-accent-red' : 'bg-green-100 text-green-700'
                          }`}>
                            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-neutral-800">
                              {isLocked ? 'Card is Frozen' : 'Lock / Freeze Card'}
                            </div>
                            <div className="text-xs text-neutral-500">
                              Temporarily disable all in-person and online transactions
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={isLocked ? 'danger' : 'outline'}
                          onClick={() => setIsLocked(!isLocked)}
                          className="text-xs px-3 py-1.5"
                        >
                          {isLocked ? 'Unlock Card' : 'Freeze Card'}
                        </Button>
                      </div>

                      {/* Reveal Sensitive Info Toggle */}
                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-bank border border-neutral-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary-blue">
                            {showDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-neutral-800">Show Card Details</div>
                            <div className="text-xs text-neutral-500">Reveal 16-digit card number, expiration, and CVV</div>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => setShowDetails(!showDetails)}
                          className="text-xs px-3 py-1.5"
                        >
                          {showDetails ? 'Hide Details' : 'Show Details'}
                        </Button>
                      </div>

                    </div>
                  </Card>
                </div>

                {/* Right Column: Spending Limits & Activity */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Daily Limits Card */}
                  <Card title="Card Limits & Preferences" subtitle="Adjust real-time purchase thresholds">
                    <div className="space-y-5">
                      
                      {/* Daily Limit Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-semibold text-neutral-700">Daily Spending Limit</label>
                          <span className="text-sm font-bold text-primary-navy">
                            ${dailyLimit.toLocaleString()} / day
                          </span>
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="10000"
                          step="250"
                          value={dailyLimit}
                          onChange={(e) => setDailyLimit(parseInt(e.target.value, 10))}
                          className="w-full accent-primary-blue cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                          <span>$500 min</span>
                          <span>$10,000 max</span>
                        </div>
                      </div>

                      {/* Online Purchases Switch */}
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                        <div>
                          <div className="text-xs font-bold text-neutral-800">Online & Mobile Purchases</div>
                          <div className="text-[11px] text-neutral-500">Allow internet and Apple/Google Pay charges</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={onlinePurchases}
                          onChange={(e) => setOnlinePurchases(e.target.checked)}
                          className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                        />
                      </div>

                      {/* Travel Mode */}
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                        <div className="flex items-center space-x-2">
                          <Plane className="w-4 h-4 text-neutral-500" />
                          <div>
                            <div className="text-xs font-bold text-neutral-800">Travel & Overseas Notice</div>
                            <div className="text-[11px] text-neutral-500">Prevent fraud blocks while traveling</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={travelMode}
                          onChange={(e) => setTravelMode(e.target.checked)}
                          className="rounded text-primary-blue focus:ring-primary-blue h-4 w-4"
                        />
                      </div>

                    </div>
                  </Card>

                  {/* Recent Card Transactions */}
                  <Card title="Recent Card Purchases" subtitle="Pending & settled authorizations">
                    <div className="divide-y divide-neutral-100">
                      {cardTransactions.map((tx) => {
                        const Icon = tx.icon;
                        return (
                          <div key={tx.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-neutral-900">{tx.title}</div>
                                <div className="text-xs text-neutral-500">{tx.date}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-neutral-900">
                                ${Math.abs(tx.amount).toFixed(2)}
                              </div>
                              <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                Approved
                              </span>
                            </div>
                          </div>
                        );
                      })}
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

export default CardsPage;
