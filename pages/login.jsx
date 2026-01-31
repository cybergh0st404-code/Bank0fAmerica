import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../utils/AuthContext';
import { validateAdminCredentials, isAdminEmail } from '../utils/adminAuth';

const DEFAULT_USER_EMAIL = process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL;
const DEFAULT_USER_PASSWORD = process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD;
const DEFAULT_2FA_CODE = process.env.NEXT_PUBLIC_DEFAULT_2FA_CODE;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const router = useRouter();
  const { login } = useAuth(); // Use the login function from AuthContext

  // No useEffect needed for expiry/website status as handled by middleware

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (email && password) {
        // Check for default user credentials (Pattch P Jones)
        const isDefaultUser = email === DEFAULT_USER_EMAIL && password === DEFAULT_USER_PASSWORD;

        if (isDefaultUser) {
          if (!show2FA) {
            // First step for default user: show 2FA
            setShow2FA(true);
            setLoading(false);
            return;
          } else {
            // Second step for default user: validate 2FA code
            if (twoFactorCode === DEFAULT_2FA_CODE) {
              const userData = {
                id: '1',
                name: 'James M Nelson',
                email: email,
                role: 'user',
              };

              // No need to set localStorage here, AuthContext handles cookies
              // localStorage.setItem('user', JSON.stringify(userData));
              // localStorage.setItem('isAuthenticated', 'true');
              
              login(userData);
              
              setLoading(false); // Reset loading state
              router.push('/dashboard'); // Default user always goes to dashboard
              return; // Exit after successful default user login
            } else {
              setError('Invalid 2FA code for default user.');
              setLoading(false);
              return;
            }
          }
        } else if (validateAdminCredentials(email, password)) { // Check for admin credentials
          const userData = {
            id: 'admin-1', // Admin ID
            name: 'Admin User', // Admin Name
            email: email,
            role: 'admin',
          };

          // AuthContext handles cookies
          login(userData);
          setLoading(false);
          router.push('/admin'); // Admin goes to admin dashboard
          return;
        }
        else {
          // If not the default user or admin, deny access
          setError('Invalid credentials. Access denied.');
          setLoading(false);
          return;
        }
      } else {
        setError('Please enter both email and password');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 space-x-3">
            <img
              src="/logo.png"
              alt="Bank of America"
              className="h-12 w-auto flex-shrink-0 object-contain"
              style={{
                mixBlendMode: 'multiply',
                filter: 'contrast(1.2) brightness(0.95)',
                backgroundColor: 'transparent',
              }}
            />
            <div className="text-primary-navy font-bold text-2xl">
              Bank of America
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
