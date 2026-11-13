'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Helper function to set a cookie
const setCookie = (name, value, days) => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + encodeURIComponent(value || '') + expires + '; path=/';
};

// Helper function to get a cookie
const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const raw = c.substring(nameEQ.length, c.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuthStatus = getCookie('isAuthenticated');
    const storedUserData = getCookie('user');

    if (storedAuthStatus === 'true' && storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        setUser(parsed);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          if (parsed.allowedPages && Array.isArray(parsed.allowedPages)) {
            localStorage.setItem('bank_allowed_pages', JSON.stringify(parsed.allowedPages));
          }
          if (parsed.lockedPages && Array.isArray(parsed.lockedPages)) {
            localStorage.setItem('bank_locked_pages', JSON.stringify(parsed.lockedPages));
          }
        }
      } catch (e) {
        console.error("Failed to parse user data from cookies", e);
        setCookie('user', '', -1);
        setCookie('isAuthenticated', '', -1);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCookie('isAuthenticated', 'true', 7);
    setCookie('user', JSON.stringify(userData), 7);
    if (typeof window !== 'undefined') {
      try {
        if (userData?.allowedPages && Array.isArray(userData.allowedPages)) {
          localStorage.setItem('bank_allowed_pages', JSON.stringify(userData.allowedPages));
        }
        if (userData?.lockedPages && Array.isArray(userData.lockedPages)) {
          localStorage.setItem('bank_locked_pages', JSON.stringify(userData.lockedPages));
        }
      } catch (_) {}
    }
  };

  const updateUser = (fields) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...fields };
      setCookie('user', JSON.stringify(updated), 7);
      if (typeof window !== 'undefined') {
        try {
          if (updated.allowedPages && Array.isArray(updated.allowedPages)) {
            localStorage.setItem('bank_allowed_pages', JSON.stringify(updated.allowedPages));
          }
          if (updated.lockedPages && Array.isArray(updated.lockedPages)) {
            localStorage.setItem('bank_locked_pages', JSON.stringify(updated.lockedPages));
          }
        } catch (_) {}
      }
      return updated;
    });
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setCookie('isAuthenticated', '', -1);
    setCookie('user', '', -1);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bank_allowed_pages');
        localStorage.removeItem('bank_locked_pages');
      } catch (_) {}
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
