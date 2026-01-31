import React, { useState, useEffect } from 'react';
import { getWebsiteStatus, openWebsite, closeWebsite } from '../utils/websiteStatus';
import Button from './Button'; // Assuming Button component path
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const WebsiteStatusControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const status = await getWebsiteStatus();
      setIsOpen(status.isOpen);
      setStatusMessage('');
    } catch (error) {
      console.error('Error fetching website status:', error);
      setStatusMessage('Failed to fetch website status.');
      setIsOpen(false); // Default to closed on fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleOpenWebsite = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      await openWebsite();
      await fetchStatus(); // Re-fetch status to confirm
      setStatusMessage('Website is now OPEN.');
    } catch (error) {
      console.error('Error opening website:', error);
      setStatusMessage('Failed to open website.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWebsite = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      await closeWebsite();
      await fetchStatus(); // Re-fetch status to confirm
      setStatusMessage('Website is now CLOSED.');
    } catch (error) {
      console.error('Error closing website:', error);
      setStatusMessage('Failed to close website.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-primary-navy">Website Status Control</h2>
      {loading ? (
        <div className="flex items-center space-x-2 text-neutral-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading status...</span>
        </div>
      ) : (
        <div className="mb-4">
          <div className={`flex items-center space-x-2 font-medium ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
            {isOpen ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>Website is currently: {isOpen ? 'Open' : 'Closed'}</span>
          </div>
          {statusMessage && (
            <p className={`mt-2 text-sm ${isOpen ? 'text-green-500' : 'text-red-500'}`}>
              {statusMessage}
            </p>
          )}
        </div>
      )}

      <div className="flex space-x-4">
        <Button onClick={handleOpenWebsite} disabled={loading || isOpen} className="bg-green-500 hover:bg-green-600 text-white">
          Open Website
        </Button>
        <Button onClick={handleCloseWebsite} disabled={loading || !isOpen} className="bg-red-500 hover:bg-red-600 text-white">
          Close Website
        </Button>
      </div>
    </div>
  );
};

export default WebsiteStatusControl;
