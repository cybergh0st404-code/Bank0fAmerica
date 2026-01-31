import React, { useEffect, useState } from 'react';
import Router from 'next/router';
import { Loader2 } from 'lucide-react';

const RouteLoading = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleDone = () => setLoading(false);

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleDone);
    Router.events.on('routeChangeError', handleDone);

    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleDone);
      Router.events.off('routeChangeError', handleDone);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-bank shadow-bank-lg px-6 py-4 flex items-center space-x-3">
        <Loader2 className="w-5 h-5 text-primary-blue animate-spin" />
        <span className="text-sm font-medium text-neutral-700">Loading...</span>
      </div>
    </div>
  );
};

export default RouteLoading;
