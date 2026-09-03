import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import Card from './Card';

const AccountNoticeCard = ({ 
  notice, 
  isPopup = false, 
  onDismiss = null, 
  autoDismissSeconds = 6 
}) => {
  const [secondsLeft, setSecondsLeft] = useState(autoDismissSeconds);

  useEffect(() => {
    if (!isPopup || !onDismiss) return;

    if (secondsLeft <= 0) {
      onDismiss();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPopup, secondsLeft, onDismiss]);

  if (!notice || !notice.enabled) return null;

  const message = notice.message || "Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.";
  const progress = typeof notice.progress === 'number' ? notice.progress : 65;
  const progressStatus = notice.progressStatus || `${progress}% • Failed`;
  const progressLabel = notice.progressLabel || "Authorization Progress";

  if (isPopup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fade-in">
        <div className="bg-white rounded-card shadow-bank-lg max-w-lg w-full p-6 relative border-t-4 border-accent-red animate-scale-in">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-accent-red flex-shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-navy">Account Authorization Alert</h3>
                <p className="text-xs text-neutral-500">Security & Authorization Requirement</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full transition-colors"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notice Banner */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-bank mb-5">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-neutral-600 font-medium">{progressLabel}</span>
              <span className="font-bold text-accent-red bg-red-100 px-2 py-0.5 rounded-full">
                {progressStatus}
              </span>
            </div>
            <div className="w-full h-3.5 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-red rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Auto dismiss timer */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-500">
            <span>Notice will auto-dismiss in {secondsLeft}s...</span>
            <button
              onClick={onDismiss}
              className="text-primary-blue hover:underline font-semibold"
            >
              Dismiss Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full blocking card mode
  return (
    <div className="max-w-3xl mx-auto my-8 animate-fade-in">
      <Card className="border-t-4 border-accent-red shadow-bank-lg p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-5 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-accent-red flex-shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary-navy mb-1">Access Restricted</h2>
            <p className="text-neutral-600 text-sm">
              Account authorization required to view or execute operations on this page.
            </p>
          </div>
        </div>

        {/* Notice Message */}
        <div className="p-5 bg-red-50 border border-red-200 rounded-bank mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-accent-red flex-shrink-0 mt-0.5 hidden sm:block" />
            <p className="text-sm sm:text-base text-red-900 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 bg-neutral-50 p-4 rounded-bank border border-neutral-200 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-700">{progressLabel}</span>
            <span className="text-sm font-bold text-accent-red bg-red-100 px-2.5 py-0.5 rounded-full">
              {progressStatus}
            </span>
          </div>
          <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-red rounded-full transition-all duration-700" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-neutral-500 border-t border-neutral-200 pt-4 text-center">
          If you believe this restriction is an error or you have completed payment, please contact Bank of America customer support.
        </div>
      </Card>
    </div>
  );
};

export default AccountNoticeCard;
