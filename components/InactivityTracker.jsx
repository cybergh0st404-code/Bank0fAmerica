'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import Button from './Button';

// Banking standard: 14 minutes of idle time + 60 seconds warning = 15 minutes total session limit
const DEFAULT_IDLE_WARNING_SECONDS = 14 * 60; // 840 seconds (14 min)
const DEFAULT_COUNTDOWN_SECONDS = 60;         // 60 seconds

export default function InactivityTracker() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_COUNTDOWN_SECONDS);

  const lastActivityRef = useRef(Date.now());
  const countdownIntervalRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const isLoggingOutRef = useRef(false);

  const warningThresholdSec = Number(process.env.NEXT_PUBLIC_INACTIVITY_WARNING_SECONDS) || DEFAULT_IDLE_WARNING_SECONDS;
  const countdownDurationSec = Number(process.env.NEXT_PUBLIC_INACTIVITY_COUNTDOWN_SECONDS) || DEFAULT_COUNTDOWN_SECONDS;

  // Handle explicit sign out
  const handleSignOut = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setShowWarning(false);
    clearInterval(countdownIntervalRef.current);
    clearInterval(checkIntervalRef.current);
    await logout();
    router.push('/login');
  }, [logout, router]);

  // Handle automatic timeout logout
  const handleTimeout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setShowWarning(false);
    clearInterval(countdownIntervalRef.current);
    clearInterval(checkIntervalRef.current);
    await logout();
    router.push('/login?reason=timeout');
  }, [logout, router]);

  // Extend session: user clicked "Stay Signed In"
  const handleStaySignedIn = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsLeft(countdownDurationSec);
    clearInterval(countdownIntervalRef.current);

    // Optional background heartbeat ping to verify session validity
    try {
      fetch('/api/user/account-data', { cache: 'no-store' }).catch(() => {});
    } catch (_) {}
  }, [countdownDurationSec]);

  // Track user activity when warning modal is NOT open
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserActivity = () => {
      // Only reset activity timestamp if the warning modal is not currently showing
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, showWarning]);

  // Inactivity check interval
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      clearInterval(countdownIntervalRef.current);
      clearInterval(checkIntervalRef.current);
      return;
    }

    isLoggingOutRef.current = false;
    lastActivityRef.current = Date.now();

    checkIntervalRef.current = setInterval(() => {
      if (showWarning || isLoggingOutRef.current) return;

      const idleSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (idleSeconds >= warningThresholdSec) {
        setShowWarning(true);
        setSecondsLeft(countdownDurationSec);
      }
    }, 1000);

    return () => {
      clearInterval(checkIntervalRef.current);
    };
  }, [isAuthenticated, showWarning, warningThresholdSec, countdownDurationSec]);

  // Countdown timer when warning modal is open
  useEffect(() => {
    if (!showWarning) {
      clearInterval(countdownIntervalRef.current);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, handleTimeout]);

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / countdownDurationSec) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 animate-scale-in">
        {/* Top colored accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-primary-blue to-primary-navy" />

        <div className="p-6 text-center space-y-5">
          {/* Pulsing icon */}
          <div className="relative inline-flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-red-400 opacity-25" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600">
              <Clock className="w-8 h-8" />
            </div>
          </div>

          <div>
            <h2 id="inactivity-modal-title" className="text-xl font-bold text-primary-navy">
              Session Timeout Warning
            </h2>
            <p className="text-sm text-neutral-600 mt-2">
              For your security, banking sessions expire automatically after 15 minutes of inactivity.
            </p>
          </div>

          {/* Countdown indicator */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              <span>Time Remaining</span>
              <span className={`text-base font-bold ${secondsLeft <= 15 ? 'text-red-600' : 'text-primary-navy'}`}>
                {secondsLeft}s
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  secondsLeft <= 15 ? 'bg-red-600' : 'bg-primary-blue'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-neutral-500">
            Would you like to remain signed in to your account?
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center text-sm py-2.5"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
            <Button
              variant="primary"
              onClick={handleStaySignedIn}
              className="w-full flex items-center justify-center text-sm py-2.5"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Stay Signed In
            </Button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="bg-neutral-100 px-6 py-2.5 border-t border-neutral-200 flex items-center justify-center space-x-1.5 text-xs text-neutral-500">
          <ShieldAlert className="w-3.5 h-3.5 text-primary-navy" />
          <span>Bank of America 256-Bit Secure Session Protection</span>
        </div>
      </div>
    </div>
  );
}
