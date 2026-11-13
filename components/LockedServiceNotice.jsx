import React from 'react';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useRouter } from 'next/router';

const LockedServiceNotice = ({ serviceName = 'Online Banking Service', pageId = '' }) => {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto my-8 animate-fade-in px-4">
      <Card className="border-t-4 border-accent-red shadow-bank-lg p-6 sm:p-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-accent-red flex-shrink-0 shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-accent-red border border-red-200 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
              <span>Service Administratively Locked</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary-navy">
              {serviceName} is Temporarily Restricted
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-0.5">
              Administrative Compliance Lock • Hold Reference: SEC-LOC-{pageId ? pageId.toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PORTAL'}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-red-50/80 border border-red-200 rounded-bank mb-6 text-left">
          <div className="flex items-start space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm text-red-900 leading-relaxed font-semibold">
                Access to this feature has been restricted by bank administration.
              </p>
              <p className="text-xs text-red-800 leading-relaxed">
                Transactions, submissions, and service requests for {serviceName} are temporarily suspended on your account pursuant to security and administrative review.
              </p>
              <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-red-200/60">
                To request unlocking or for assistance, please contact your account representative or call Bank of America Customer Care.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-200">
          <span className="text-xs text-neutral-500 text-center sm:text-left">
            Security Status: <code className="font-mono font-bold text-accent-red">HOLD_ACTIVE</code>
          </span>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="primary"
            className="w-full sm:w-auto px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 inline" />
            Return to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LockedServiceNotice;

