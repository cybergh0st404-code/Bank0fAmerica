import React, { useState } from 'react';
import { Bell, User, Menu, X, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/router';

const Navbar = ({ user, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
              <img
                src="/logo.png"
                alt="Bank of America"
                className="h-8 sm:h-10 w-auto flex-shrink-0 object-contain"
                style={{
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.2) brightness(0.95)',
                  backgroundColor: 'transparent',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="text-primary-navy font-bold text-sm sm:text-base md:text-xl">
                Bank of America
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-neutral-600 hover:text-primary-blue hover:bg-accent-soft rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full"></span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-neutral-700 hover:bg-accent-soft rounded-bank transition-colors"
              >
                <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block font-medium">{user?.name || 'User'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-bank-lg border border-neutral-200 py-2 z-20">
                    <button
                      onClick={() => {
                        router.push('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-accent-soft transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-accent-soft transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
