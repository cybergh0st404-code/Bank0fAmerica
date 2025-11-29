// utils/websiteStatus.js
import axios from 'axios';

/**
 * Gets the current status of the website.
 * @returns {Promise<boolean>} - True if the website is open, false otherwise.
 */
export const getWebsiteStatus = async () => {
  try {
    const response = await axios.get('/api/website-status', {
      params: { _: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get website status:', error);
    return { isOpen: false }; // Default to closed on error
  }
};

/**
 * Closes the website.
 */
export const closeWebsite = async () => {
  try {
    await axios.put('/api/website-status', { isOpen: false }, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('Failed to close website:', error);
  }
};

/**
 * Opens the website.
 */
export const openWebsite = async () => {
  try {
    await axios.put('/api/website-status', { isOpen: true }, {
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('Failed to open website:', error);
  }
};
