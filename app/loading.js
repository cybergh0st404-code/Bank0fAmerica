'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[1000] bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-bank shadow-bank-lg px-6 py-4 flex items-center space-x-3">
        <Loader2 className="w-5 h-5 text-primary-blue animate-spin" />
        <span className="text-sm font-medium text-neutral-700">Loading...</span>
      </div>
    </div>
  );
}
