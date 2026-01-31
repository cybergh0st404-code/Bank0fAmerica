import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Shield, ArrowRight } from 'lucide-react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useAuth } from '../../../utils/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { slug } = router.query;

  // Validate the slug when the component mounts or slug changes
  useEffect(() => {
    const adminLoginSlug = process.env.ADMIN_SECRET_SLUG || 'supersecretadmin';
    if (slug && slug !== adminLoginSlug) {
      // If the slug doesn't match, redirect to 404
      router.replace('/404');
    }
  }, [slug, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ensure slug is valid before attempting login
    const adminLoginSlug = process.env.ADMIN_SECRET_SLUG || 'supersecretadmin';
    if (slug !== adminLoginSlug) {
      setError('Invalid access URL.');
      setLoading(false);
      router.replace('/404');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid admin credentials.');
        setLoading(false);
        return;
      }
      if (data.user && data.user.role === 'admin') {
        login(data.user);
        setLoading(false);
        router.push('/admin');
        return;
      }
      setError('Unexpected response.');
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // Only render the form if the slug is valid (or not yet loaded)
  if (!slug || slug !== (process.env.ADMIN_SECRET_SLUG || 'supersecretadmin')) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center text-neutral-600">Loading or Invalid URL...</div>
      </div>
    );
  }

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
            Admin Sign-In
          </h1>
          <p className="text-neutral-600 text-sm">
            Enter admin credentials to access the administration panel
          </p>
        </div>

        {/* Login Card */}
        <div className="card shadow-bank-lg">
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <Input
                label="Admin Email Address"
                type="email"
                placeholder="admin@bankofamerica.ambankofamerica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <Input
                label="Admin Password"
                type="password"
                placeholder="Enter your admin password"
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
              {loading ? 'Signing In...' : 'Admin Sign In'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
