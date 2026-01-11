/**
 * Unit tests for validation utility functions
 */
import { describe, it, expect, vi } from 'vitest';
import { validateEmail, validatePassword, validateSessionId } from '../validationUtils';

describe('validationUtils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('user space@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.co')).toBe(true); // Minimal valid email
      expect(validateEmail('test@example')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for invalid passwords', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle edge cases', () => {
      const result1 = validatePassword('');
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('Password must be at least 8 characters long');

      const result2 = validatePassword('P@ssw0rd!');
      expect(result2.valid).toBe(true);
    });
  });

  describe('validateSessionId', () => {
    it('should validate non-empty session IDs', () => {
      expect(validateSessionId('session-123')).toBe(true);
      expect(validateSessionId('abc')).toBe(true);
      expect(validateSessionId('1234567890')).toBe(true);
    });

    it('should reject empty or whitespace-only session IDs', () => {
      expect(validateSessionId('')).toBe(false);
      expect(validateSessionId('   ')).toBe(false);
      expect(validateSessionId('\t\n')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateSessionId('a')).toBe(true); // Single character
      expect(validateSessionId('session-id-with-dashes')).toBe(true);
      expect(validateSessionId('session_id_with_underscores')).toBe(true);
    });
  });
});

