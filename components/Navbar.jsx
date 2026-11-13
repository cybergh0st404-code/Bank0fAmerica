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

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-bank-sidebar'));
    }
  };

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left: Mobile Menu Hamburger + Brand Logo */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            <button
              onClick={handleToggleSidebar}
              className="lg:hidden p-2 rounded-bank text-neutral-600 hover:text-primary-navy hover:bg-neutral-100 transition-colors focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-shrink-0 flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Bank of America"
                className="h-7 sm:h-9 w-auto flex-shrink-0 object-contain"
                style={{
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.2) brightness(0.95)',
                  backgroundColor: 'transparent',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="text-primary-navy font-bold text-sm sm:text-base md:text-xl tracking-tight">
                Bank of America
              </div>
            </div>
          </div>

          {/* Right side: Notifications & Profile Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <button 
              onClick={() => router.push('/messages')}
              className="relative p-2 text-neutral-600 hover:text-primary-blue hover:bg-accent-soft rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full"></span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-neutral-700 hover:bg-accent-soft rounded-bank transition-colors"
              >
                <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block font-medium text-sm text-neutral-800 max-w-[120px] truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-bank-lg border border-neutral-200 py-1.5 z-20 animate-fade-in">
                    <div className="px-4 py-2 border-b border-neutral-100 sm:hidden">
                      <p className="text-xs font-semibold text-neutral-800 truncate">{user?.name || 'User'}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{user?.email || ''}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs sm:text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-2 text-neutral-500" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-xs sm:text-sm text-accent-red hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2 text-accent-red" />
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
