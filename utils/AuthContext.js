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
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
};

// Helper function to get a cookie
const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state for initial auth check

  useEffect(() => {
    // Attempt to load user from cookies on mount
    const storedAuthStatus = getCookie('isAuthenticated');
    const storedUserData = getCookie('user');

    if (storedAuthStatus === 'true' && storedUserData) {
      try {
        setUser(JSON.parse(storedUserData));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user data from cookies", e);
        // Clear invalid data
        setCookie('user', '', -1); // Remove cookie
        setCookie('isAuthenticated', '', -1); // Remove cookie
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCookie('isAuthenticated', 'true', 7); // Set for 7 days
    setCookie('user', JSON.stringify(userData), 7); // Set for 7 days
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCookie('isAuthenticated', '', -1); // Expire cookie
    setCookie('user', '', -1); // Expire cookie
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
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
