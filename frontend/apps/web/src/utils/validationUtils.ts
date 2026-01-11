/**
 * Utility functions for validation
 */

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: at least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate session ID format
 * Returns error message if invalid, null if valid
 */
export const validateSessionId = (sessionId: string): string | null => {
  if (!sessionId || typeof sessionId !== 'string') {
    return 'Session ID is required';
  }
  const trimmed = sessionId.trim();
  if (trimmed.length === 0) {
    return 'Session ID cannot be empty';
  }
  // Optional: validate UUID format if needed
  // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // if (!uuidRegex.test(trimmed)) {
  //   return 'Session ID must be a valid UUID format';
  // }
  return null;
};

