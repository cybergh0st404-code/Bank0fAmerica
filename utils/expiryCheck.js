// utils/expiryCheck.js

// Set the expiration date for the project
const EXPIRATION_DATE = new Date('2024-12-31T23:59:59');

/**
 * Checks if the project has expired.
 * @returns {boolean} - Always false (project expiration disabled).
 */
export const isProjectExpired = () => {
  return false;
};
