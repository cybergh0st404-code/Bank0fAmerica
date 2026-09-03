'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Send, 
  Globe, 
  ShieldCheck, 
  AlertCircle, 
  DollarSign, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  Info,
  Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const WireTransferPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [wireType, setWireType] = useState('domestic'); // 'domestic' | 'international'
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const exchangeRates = {
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    JPY: 154.20,
    CHF: 0.88,
  };

  const wireFee = wireType === 'domestic' ? 25.00 : 45.00;
  const parsedAmount = parseFloat(amount) || 0;
  const convertedAmount = (parsedAmount * (exchangeRates[targetCurrency] || 1)).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert(`Wire transfer of $${parsedAmount.toLocaleString()} submitted successfully! Confirmation Ref: BOFA-WIRE-${Date.now().toString().slice(-8)}`);
      setIsSubmitting(false);
      setAmount('');
      setRecipientName('');
      setBankName('');
      setRoutingNumber('');
      setSwiftCode('');
      setAccountNumber('');
      setMemo('');
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
              <h1 className="text-3xl font-bold text-primary-navy mb-1">Fedwire & International Wire</h1>
              <p className="text-neutral-600 text-sm">Send same-day domestic federal wires and international SWIFT remittances.</p>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main Form */}
                <div className="lg:col-span-8">
                  <Card>
                    
                    {/* Wire Type Toggle */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        type="button"
                        onClick={() => setWireType('domestic')}
                        className={`p-3.5 rounded-bank border text-left transition-all ${
                          wireType === 'domestic'
                            ? 'border-primary-blue bg-blue-50 text-primary-navy ring-2 ring-primary-blue'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="font-bold text-sm">Domestic Wire</div>
                        <div className="text-xs text-neutral-500">Same-day Fedwire to US banks ($25 fee)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWireType('international')}
                        className={`p-3.5 rounded-bank border text-left transition-all ${
                          wireType === 'international'
                            ? 'border-primary-blue bg-blue-50 text-primary-navy ring-2 ring-primary-blue'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="font-bold text-sm">International SWIFT</div>
                        <div className="text-xs text-neutral-500">Worldwide cross-border wire ($45 fee)</div>
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      
                      {/* Amount & Currency */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">Transfer Amount (USD) *</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <Input
                              type="number"
                              step="0.01"
                              required
                              placeholder="5000.00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="pl-10 font-bold"
                            />
                          </div>
                        </div>

                        {wireType === 'international' && (
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">Beneficiary Currency</label>
                            <select
                              value={targetCurrency}
                              onChange={(e) => setTargetCurrency(e.target.value)}
                              className="input-field text-sm"
                            >
                              <option value="EUR">EUR - Euros (€)</option>
                              <option value="GBP">GBP - British Pounds (£)</option>
                              <option value="CAD">CAD - Canadian Dollars ($)</option>
                              <option value="JPY">JPY - Japanese Yen (¥)</option>
                              <option value="CHF">CHF - Swiss Francs (Fr)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Recipient Details */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Beneficiary Name (Individual or Business) *</label>
                        <Input
                          required
                          placeholder="e.g. Acme Global Logistics Ltd."
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">Beneficiary Bank Name *</label>
                          <Input
                            required
                            placeholder="e.g. JPMorgan Chase or Barclays"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                          />
                        </div>
                        <div>
                          {wireType === 'domestic' ? (
                            <>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">9-Digit Routing Number (ABA) *</label>
                              <Input
                                required
                                maxLength={9}
                                placeholder="e.g. 021000021"
                                value={routingNumber}
                                onChange={(e) => setRoutingNumber(e.target.value)}
                              />
                            </>
                          ) : (
                            <>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">SWIFT / BIC Code *</label>
                              <Input
                                required
                                maxLength={11}
                                placeholder="e.g. BARCGB22"
                                value={swiftCode}
                                onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          {wireType === 'domestic' ? 'Account Number *' : 'Account Number / IBAN *'}
                        </label>
                        <Input
                          required
                          placeholder={wireType === 'domestic' ? 'e.g. 9876543210' : 'e.g. GB29BARC20041598765432'}
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">Wire Memo / Reference Purpose</label>
                        <Input
                          placeholder="e.g. Invoice #9021 or Property Acquisition"
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                        />
                      </div>

                      <div className="pt-4 border-t border-neutral-200 flex justify-end">
                        <Button type="submit" disabled={isSubmitting} className="px-6 py-2.5">
                          {isSubmitting ? 'Processing Wire...' : 'Authorize & Submit Wire'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>

                {/* Summary & Exchange Rate Card */}
                <div className="lg:col-span-4 space-y-6">
                  <Card title="Transfer Breakdown">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-neutral-600">
                        <span>Wire Amount:</span>
                        <span className="font-semibold text-neutral-900">${parsedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>Outgoing Wire Fee:</span>
                        <span className="font-semibold text-neutral-900">${wireFee.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-base text-primary-navy">
                        <span>Total Debit:</span>
                        <span>${(parsedAmount + wireFee).toFixed(2)}</span>
                      </div>

                      {wireType === 'international' && parsedAmount > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-bank space-y-1 text-xs">
                          <div className="font-bold text-primary-navy">Live Exchange Estimate</div>
                          <div className="text-neutral-600">
                            1 USD = {exchangeRates[targetCurrency]} {targetCurrency}
                          </div>
                          <div className="text-sm font-bold text-green-700 pt-1">
                            Recipient Gets: {convertedAmount} {targetCurrency}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card title="Important Wire Deadlines">
                    <div className="space-y-2.5 text-xs text-neutral-600">
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-primary-blue flex-shrink-0 mt-0.5" />
                        <div><strong>Domestic Cutoff:</strong> Submissions before 5:00 PM ET process same-day.</div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Globe className="w-4 h-4 text-primary-blue flex-shrink-0 mt-0.5" />
                        <div><strong>International Delivery:</strong> Delivered in 1–2 business days via SWIFT.</div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div><strong>Bank of America Guarantee:</strong> End-to-end encrypted transfer authorization.</div>
                      </div>
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

export default WireTransferPage;
