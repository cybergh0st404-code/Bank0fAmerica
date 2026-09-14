/**
 * Admin Authentication Utility
 * Default admin credentials and authentication
 */

export const DEFAULT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
export const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export const validateAdminCredentials = (email, password) => {
  return email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
};

export const isAdminEmail = (email) => {
  return email === DEFAULT_ADMIN_EMAIL;
};
