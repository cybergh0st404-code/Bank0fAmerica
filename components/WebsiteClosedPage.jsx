import React from 'react';
import { AlertCircle, Lock, XCircle } from 'lucide-react';

const WebsiteClosedPage = () => {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-card shadow-bank-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-primary-navy mb-3">
            Page Not Found
          </h1>
          
          <div className="flex items-center justify-center mb-4 text-accent-red">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p className="text-sm font-medium">Error 404</p>
          </div>
          
          <div className="bg-neutral-50 rounded-bank p-4 mb-6">
            <p className="text-neutral-700 text-sm leading-relaxed">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              Please check the URL for errors or return to the homepage.
            </p>
          </div>
          
          <div className="border-t border-neutral-200 pt-4">
            <p className="text-xs text-neutral-500">
              We apologize for any inconvenience.
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Bank of America. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebsiteClosedPage;
