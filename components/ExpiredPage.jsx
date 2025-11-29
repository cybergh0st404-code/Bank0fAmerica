import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';

const ExpiredPage = () => {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-card shadow-bank-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-neutral-100 rounded-full p-4">
              <Lock className="w-12 h-12 text-neutral-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-primary-navy mb-3">
            PROJECT EXPIRED
          </h1>
          
          <div className="flex items-center justify-center mb-4 text-accent-red">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p className="text-sm font-medium">Access Restricted</p>
          </div>
          
          <div className="bg-neutral-50 rounded-bank p-4 mb-6">
            <p className="text-neutral-700 text-sm leading-relaxed">
              This demo banking system is no longer available. 
              The project has reached its expiration date and access has been restricted.
            </p>
          </div>
          
          <div className="border-t border-neutral-200 pt-4">
            <p className="text-xs text-neutral-500">
              For inquiries, please contact the system administrator.
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} ProBank. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpiredPage;


