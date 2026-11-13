import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Shield, ArrowRight, Lock, Eye, EyeOff, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid administrator credentials.');
        setLoading(false);
        return;
      }
      if (data.user && data.user.role === 'superadmin') {
        login(data.user);
        setLoading(false);
        router.push('/super-admin');
        return;
      }
      if (data.user && data.user.role === 'admin') {
        login(data.user);
        setLoading(false);
        router.push('/admin');
        return;
      }
      setError('You do not have administrator privileges.');
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle decorative circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-md border border-neutral-200/80 mb-4">
            <img
              src="/logo.png"
              alt="Bank of America"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-primary-navy border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-primary-blue" />
            <span>Banking Operations Administrator</span>
          </div>

          <h1 className="text-2xl font-bold text-primary-navy tracking-tight">
            Administrator Sign-In
          </h1>
          <p className="text-neutral-600 text-xs sm:text-sm mt-1">
            Access your assigned client accounts, transfer queues & operations portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/80 p-6 sm:p-8">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-primary-blue to-red-600 rounded-full mb-6" />

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Administrator Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@bankofamerica.com"
                required
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start space-x-2">
                <Lock className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-primary-navy hover:bg-[#001744] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Tier Role Verified</span>
            </span>
            <span className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>256-Bit SSL Encrypted</span>
            </span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} Bank of America, N.A. Member FDIC. Equal Housing Lender.
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
