// utils/expiryCheck.js

// Set the expiration date for the project
const EXPIRATION_DATE = new Date('2024-12-31T23:59:59');

/**
 * Checks if the project has expired.
 * @returns {boolean} - True if the project has expired, false otherwise.
 */
export const isProjectExpired = () => {
  return new Date() > EXPIRATION_DATE;
};
