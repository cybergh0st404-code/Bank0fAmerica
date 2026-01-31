import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../utils/AuthContext';
import { validateAdminCredentials } from '../../utils/adminAuth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call for admin login
    setTimeout(() => {
      if (email && password) {
        if (validateAdminCredentials(email, password)) {
          const userData = {
            id: 'admin-1',
            name: 'Admin User',
            email: email,
            role: 'admin',
          };

          login(userData);
          setLoading(false);
          router.push('/admin'); // Admin goes to admin dashboard
        } else {
          setError('Invalid admin credentials.');
          setLoading(false);
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
                placeholder="admin@bankofamerica.com"
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
