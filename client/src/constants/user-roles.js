/**
 * User Roles Constants
 * Centralized source of truth for user roles
 */

export const USER_ROLES = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
  [USER_ROLES.STUDENT]: 'Student',
  [USER_ROLES.STAFF]: 'Staff',
  [USER_ROLES.ADMIN]: 'Administrator',
};

export const ROLE_ROUTES = {
  [USER_ROLES.STUDENT]: '/student',
  [USER_ROLES.STAFF]: '/staff',
  [USER_ROLES.ADMIN]: '/admin',
};

/**
 * Get label for a role
 * @param {string} role - Role key from USER_ROLES
 * @returns {string} Human-readable label
 */
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role?.toUpperCase()] || 'Unknown';
};

/**
 * Get dashboard route for a role
 * @param {string} role - Role key from USER_ROLES
 * @returns {string} Route path
 */
export const getRoleRoute = (role) => {
  return ROLE_ROUTES[role?.toUpperCase()] || '/';
};

/**
 * Check if user has a specific role
 * @param {object} user - User object with role property
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  return user?.role?.toUpperCase() === role?.toUpperCase();
};

/**
 * Check if user has any of multiple roles
 * @param {object} user - User object with role property
 * @param {Array<string>} roles - Array of roles to check
 * @returns {boolean}
 */
export const hasAnyRole = (user, roles) => {
  return roles.some(role => hasRole(user, role));
};
