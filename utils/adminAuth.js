/**
 * Admin Authentication Utility
 * Default admin credentials and authentication
 */

export const DEFAULT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@bankofamerica.com';
export const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@2024!Secure';

export const validateAdminCredentials = (email, password) => {
  return email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
};

export const isAdminEmail = (email) => {
  return email === DEFAULT_ADMIN_EMAIL;
};
