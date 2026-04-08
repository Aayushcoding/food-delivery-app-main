/**
 * Utility functions for validation
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone number (10-15 digits, optionally starting with +)
 */
const isValidPhone = (phone) => {
  const regex = /^\+?\d{10,15}$/;
  return regex.test(phone.replace(/\D/g, '')) && phone.replace(/\D/g, '').length >= 10 && phone.replace(/\D/g, '').length <= 15;
};

/**
 * Validate required fields
 */
const validateRequiredFields = (data, fields) => {
  const missing = fields.filter(field => !data[field]);
  return {
    isValid: missing.length === 0,
    errors: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null
  };
};

/**
 * Validate enum values
 */
const isValidEnum = (value, enumArray) => {
  return enumArray.includes(value);
};

/**
 * Validate positive number
 */
const isPositiveNumber = (num) => {
  return typeof num === 'number' && num > 0;
};

/**
 * Validate quantity (positive integer)
 */
const isValidQuantity = (qty) => {
  return Number.isInteger(qty) && qty > 0;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validateRequiredFields,
  isValidEnum,
  isPositiveNumber,
  isValidQuantity
};
