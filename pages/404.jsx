import React from 'react';
import Link from 'next/link'; // Import Link for navigation

const Custom404 = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-medium text-gray-600 mb-8">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-lg">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/" className="text-blue-600 hover:underline text-lg">
        Go back to the homepage
      </Link>
    </div>
  );
};

export default Custom404;
