'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, CheckCircle, Shield, User, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar'; // Adjust path after component migration
import Sidebar from '../components/Sidebar'; // Adjust path after component migration
import Card from '../components/Card'; // Adjust path after component migration
import Button from '../components/Button'; // Adjust path after component migration
import Input from '../components/Input'; // Adjust path after component migration
import { useAuth } from '../utils/AuthContext';
//import { isProjectExpired } from '../src/utils/expiryCheck';

const Transfer = () => {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
   
  const router = useRouter();

  // useEffect(() => {
  //   if (isProjectExpired()) {
  //     router.push('/expired');
  //     return;
  //   }
  // }, [router]);

  const recipients = [
    { id: 1, name: 'Sarah Johnson', account: '**** 5678', email: 'sarah.j@email.com' },
    { id: 2, name: 'Michael Chen', account: '**** 9012', email: 'm.chen@email.com' },
    { id: 3, name: 'Emily Davis', account: '**** 3456', email: 'emily.d@email.com' },
    { id: 4, name: 'David Wilson', account: '**** 7890', email: 'd.wilson@email.com' },
  ];

  const filteredRecipients = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = () => {
    if (step === 1) {
      if (selectedRecipient) {
        setStep(2);
      }
    } else if (step === 2) {
      if (amount && parseFloat(amount) > 0) {
        setStep(3);
      }
    } else if (step === 3) {
      // Complete transfer
      setTimeout(() => {
        alert('Transfer completed successfully!');
        router.push('/dashboard');
      }, 1500);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setAmount(value);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary-navy mb-2">Transfer Money</h1>
              <p className="text-neutral-600">Send money securely to another account</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[
                { num: 1, label: 'Select Recipient' },
                { num: 2, label: 'Enter Amount' },
                { num: 3, label: 'Confirm' },
              ].map((s, index) => (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= s.num
                          ? 'bg-primary-blue text-white'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className="mt-2 text-xs text-neutral-600">{s.label}</span>
                  </div>
                  {index < 2 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        step > s.num ? 'bg-primary-blue' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1: Select Recipient */}
            {step === 1 && (
              <Card title="Select Recipient" subtitle="Choose who you want to send money to">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => setSelectedRecipient(recipient)}
                      className={`w-full p-4 rounded-bank border-2 text-left transition-all ${
                        selectedRecipient?.id === recipient.id
                          ? 'border-primary-blue bg-blue-50'
                          : 'border-neutral-200 hover:border-primary-blue hover:bg-accent-soft'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center text-white font-semibold">
                          {recipient.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900">{recipient.name}</p>
                          <p className="text-sm text-neutral-600">{recipient.email}</p>
                          <p className="text-xs text-neutral-500 mt-1">Account: {recipient.account}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <Button
                    onClick={handleTransfer}
                    disabled={!selectedRecipient}
                    className="w-full"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Enter Amount */}
            {step === 2 && (
              <Card title="Enter Transfer Details" subtitle="Specify the amount and add a note">
                <div className="space-y-6">
                  <div className="bg-accent-soft rounded-bank p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-primary-blue" />
                      <div>
                        <p className="text-sm text-neutral-600">Recipient</p>
                        <p className="font-semibold text-neutral-900">{selectedRecipient?.name}</p>
                        <p className="text-xs text-neutral-500">{selectedRecipient?.account}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Amount <span className="text-accent-red ml-1">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        required
                        className="input-field pl-10"
                      />
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">
                      Available Balance: $125,430.50
                    </p>
                  </div>

                  <div>
                    <Input
                      label="Memo (Optional)"
                      type="text"
                      placeholder="What's this transfer for?"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleTransfer}
                      disabled={!amount || parseFloat(amount) <= 0}
                      className="flex-1"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <Card title="Review and Confirm" subtitle="Please review your transfer details">
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-bank p-6 text-center">
                    <Shield className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Secure Transfer
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Your transaction is protected with bank-level encryption
                    </p>
                  </div>

                  <div className="bg-accent-soft rounded-bank p-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">To:</span>
                      <span className="font-semibold text-neutral-900">
                        {selectedRecipient?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">Account:</span>
                      <span className="font-mono text-neutral-900">
                        {selectedRecipient?.account}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                      <span className="text-neutral-600">Amount:</span>
                      <span className="text-xl font-bold text-primary-blue">
                        ${parseFloat(amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {memo && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-neutral-600">Memo:</span>
                        <span className="text-neutral-900">{memo}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button onClick={handleTransfer} className="flex-1">
                      Confirm Transfer
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

export default Transfer;
