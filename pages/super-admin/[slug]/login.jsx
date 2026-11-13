import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Shield, ArrowRight, Lock, Eye, EyeOff, Server, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useAuth } from '../../../utils/AuthContext';

export async function getServerSideProps(context) {
  const { slug } = context.params;
  const { getAdminSecretSlug } = await import('../../../lib/security.js');
  const configuredSlug = getAdminSecretSlug();

  if (!configuredSlug || !slug || slug !== configuredSlug) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      validSlug: configuredSlug,
    },
  };
}

const SuperAdminLogin = ({ validSlug }) => {
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
        body: JSON.stringify({ email, password, adminSlug: validSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid super admin credentials.');
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
      setError('You do not have Super Administrator privileges.');
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060d1a] via-[#011438] to-[#0a192f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/95 rounded-2xl shadow-xl shadow-black/20 mb-5 border border-white/20">
            <img
              src="/logo.png"
              alt="Bank of America"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Master Oversight Key</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Super Administrator Portal
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Global governance, administrator onboarding & systemic control
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Super Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bankofamerica.com"
                  required
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Security Key / Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  required
                  className="w-full px-4 py-3 pr-11 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-start space-x-2">
                <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating System...' : 'Authorize Master Session'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Encrypted Session</span>
            </span>
            <span className="flex items-center space-x-1">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Production Node</span>
            </span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Bank of America Corporation. Restricted Administrative Network.
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;

