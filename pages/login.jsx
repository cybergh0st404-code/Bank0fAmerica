import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../utils/AuthContext';
 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorTicket, setTwoFactorTicket] = useState('');
  const [timeoutNotice, setTimeoutNotice] = useState(false);
  const router = useRouter();
  const { login } = useAuth(); // Use the login function from AuthContext

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'timeout') {
        setTimeoutNotice(true);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
        if (data.user.role === 'admin') {
          setError('Invalid credentials.');
          setLoading(false);
          return;
        }
        login(data.user);
        setLoading(false);
        router.push('/dashboard');
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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 space-x-3">
            <img
              src="/ubslogo.png"
              alt="UBS"
              className="h-12 w-auto flex-shrink-0 object-contain"
              style={{
                mixBlendMode: 'multiply',
                filter: 'contrast(1.2) brightness(0.95)',
                backgroundColor: 'transparent',
              }}
            />
            <div className="text-primary-navy font-bold text-2xl">
              E-Banking
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary-navy mb-2">
            Secure Sign-In
          </h1>
          <p className="text-neutral-600 text-sm">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Login Card */}
        <div className="card shadow-bank-lg">
          {timeoutNotice && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-bank flex items-start space-x-2.5 text-amber-800 text-sm animate-fade-in">
              <Lock className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900">Session Expired</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  For your security, you were signed out due to inactivity. Please sign in to continue.
                </p>
              </div>
            </div>
          )}
          <form onSubmit={handleLogin}>
            {!show2FA ? (
              <>
                <div className="mb-6">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-bank text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-blue bg-opacity-10 rounded-full mb-4">
                    <Shield className="w-8 h-8 text-primary-blue" />
                  </div>
                  <h2 className="text-xl font-semibold text-primary-navy mb-2">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-sm text-neutral-600">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                <div className="mb-6">
                  <Input
                    label="Authentication Code"
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-bank text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full mb-3"
                  disabled={loading || twoFactorCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShow2FA(false);
                    setTwoFactorCode('');
                    setTwoFactorTicket('');
                    setError('');
                  }}
                  className="w-full text-sm text-primary-blue hover:underline"
                >
                  Back to login
                </button>
              </>
            )}
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Link href="/enroll" className="text-primary-blue hover:underline font-medium">
              Enroll Now
            </Link>
            <span className="text-neutral-300">|</span>
            <Link href="/forgot-password" className="text-primary-blue hover:underline font-medium">
              Forgot Password?
            </Link>
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs text-neutral-500">
            <Lock className="w-3 h-3" />
            <span>Your information is protected with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
