// Cookie utility functions for storing user session data

/**
 * Set a cookie with the given name, value, and expiration days
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Number of days until expiration (default: 30)
 */
export const setCookie = (name, value, days = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Set user quotation form data in cookies
 * @param {string} email - User email
 * @param {string} phoneNumber - User phone number
 */
export const setQuotationFormData = (email, phoneNumber) => {
  setCookie('quotation_email', email, 30);
  setCookie('quotation_phone', phoneNumber, 30);
};

/**
 * Get user quotation form data from cookies
 * @returns {Object} - Object with email and phoneNumber, or null values if not found
 */
export const getQuotationFormData = () => {
  return {
    email: getCookie('quotation_email') || '',
    phoneNumber: getCookie('quotation_phone') || ''
  };
};

/**
 * Clear user quotation form data from cookies
 */
export const clearQuotationFormData = () => {
  deleteCookie('quotation_email');
  deleteCookie('quotation_phone');
};

