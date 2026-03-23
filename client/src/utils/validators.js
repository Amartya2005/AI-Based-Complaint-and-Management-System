/**
 * Validation Utilities
 * Centralized validation functions for forms and inputs
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets minimum requirements
 */
export const isStrongPassword = (password) => {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) && // Has lowercase
    /[A-Z]/.test(password) && // Has uppercase
    /[0-9]/.test(password)    // Has number
  );
};

/**
 * Validate complaint form data
 * @param {object} data - Form data to validate
 * @returns {object} Errors object (empty if valid)
 */
export const validateComplaintForm = (data) => {
  const errors = {};

  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }

  if (!data.description || data.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }

  if (!data.category) {
    errors.category = 'Please select a category';
  }

  return errors;
};

/**
 * Validate user form data
 * @param {object} data - Form data to validate
 * @returns {object} Errors object (empty if valid)
 */
export const validateUserForm = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.college_id || data.college_id.trim().length < 3) {
    errors.college_id = 'College ID is required';
  }

  if (!data.role) {
    errors.role = 'Please select a role';
  }

  // Only validate password if it's being set (create mode or password change)
  if (data.password && !isStrongPassword(data.password)) {
    errors.password =
      'Password must be at least 8 characters with uppercase, lowercase, and numbers';
  }

  return errors;
};

/**
 * Check if form has any errors
 * @param {object} errors - Errors object
 * @returns {boolean} True if errors exist
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Validate required field
 * @param {string} value - Value to check
 * @param {string} fieldName - Name of field for error message
 * @returns {string|null} Error message or null
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate minimum length
 * @param {string} value - Value to check
 * @param {number} minLength - Minimum length required
 * @param {string} fieldName - Name of field for error message
 * @returns {string|null} Error message or null
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

/**
 * Validate maximum length
 * @param {string} value - Value to check
 * @param {number} maxLength - Maximum length allowed
 * @param {string} fieldName - Name of field for error message
 * @returns {string|null} Error message or null
 */
export const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
  if (value && value.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return null;
};
