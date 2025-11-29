// utils/websiteStatus.js

let isWebsiteOpen = true;

/**
 * Gets the current status of the website.
 * @returns {boolean} - True if the website is open, false otherwise.
 */
export const getWebsiteStatus = () => {
  return isWebsiteOpen;
};

/**
 * Closes the website.
 */
export const closeWebsite = () => {
  isWebsiteOpen = false;
};

/**
 * Opens the website.
 */
export const openWebsite = () => {
  isWebsiteOpen = true;
};
