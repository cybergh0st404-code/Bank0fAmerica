/**
 * Admin Authentication Utility
 * Default admin credentials and authentication
 */

// Default admin credentials
export const DEFAULT_ADMIN_EMAIL = 'admin@bankofamerica.com';
export const DEFAULT_ADMIN_PASSWORD = 'Admin@2024!Secure';

export const validateAdminCredentials = (email, password) => {
  return email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
};

export const isAdminEmail = (email) => {
  // Only allow login as admin with default credentials
  // The old method of checking if email includes 'admin' is no longer valid
  return email === DEFAULT_ADMIN_EMAIL;
};
