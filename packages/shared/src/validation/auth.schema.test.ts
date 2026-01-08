/**
 * @fileoverview Tests for authentication validation schemas.
 * Example test demonstrating validation schema testing patterns.
 *
 * @module @plpg/shared/validation/auth.schema.test
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.schema';

describe('Auth Validation Schemas', () => {
  describe('emailSchema', () => {
    /**
     * Tests that valid emails pass validation.
     */
    it('accepts valid emails', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'name+tag@gmail.com',
      ];

      for (const email of validEmails) {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      }
    });

    /**
     * Tests that invalid emails fail validation.
     */
    it('rejects invalid emails', () => {
      const invalidEmails = [
        'invalid',
        'user@',
        '@domain.com',
        'user@domain',
        '',
      ];

      for (const email of invalidEmails) {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      }
    });

    /**
     * Tests that email is normalized to lowercase.
     */
    it('normalizes email to lowercase', () => {
      const result = emailSchema.safeParse('User@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });

    /**
     * Tests that email minimum length is enforced.
     */
    it('rejects emails shorter than 5 characters', () => {
      const result = emailSchema.safeParse('a@b');
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    /**
     * Tests that strong passwords pass validation.
     */
    it('accepts strong passwords', () => {
      const validPasswords = [
        'SecureP@ss123',
        'MyP@ssw0rd!',
        'C0mpl3x!Pass',
      ];

      for (const password of validPasswords) {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      }
    });

    /**
     * Tests that passwords without uppercase are rejected.
     */
    it('rejects passwords without uppercase', () => {
      const result = passwordSchema.safeParse('securep@ss123');
      expect(result.success).toBe(false);
    });

    /**
     * Tests that passwords without lowercase are rejected.
     */
    it('rejects passwords without lowercase', () => {
      const result = passwordSchema.safeParse('SECUREP@SS123');
      expect(result.success).toBe(false);
    });

    /**
     * Tests that passwords without numbers are rejected.
     */
    it('rejects passwords without numbers', () => {
      const result = passwordSchema.safeParse('SecureP@ssword');
      expect(result.success).toBe(false);
    });

    /**
     * Tests that passwords without special characters are rejected.
     */
    it('rejects passwords without special characters', () => {
      const result = passwordSchema.safeParse('SecurePass123');
      expect(result.success).toBe(false);
    });

    /**
     * Tests that short passwords are rejected.
     */
    it('rejects passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Sec@1');
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    /**
     * Tests that valid login data passes validation.
     */
    it('accepts valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    /**
     * Tests that missing email fails validation.
     */
    it('rejects missing email', () => {
      const result = loginSchema.safeParse({
        password: 'anypassword',
      });
      expect(result.success).toBe(false);
    });

    /**
     * Tests that missing password fails validation.
     */
    it('rejects missing password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    /**
     * Tests that valid registration data passes validation.
     */
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'newuser@example.com',
        password: 'SecureP@ss123',
        name: 'New User',
      });
      expect(result.success).toBe(true);
    });

    /**
     * Tests that weak passwords are rejected during registration.
     */
    it('rejects weak passwords', () => {
      const result = registerSchema.safeParse({
        email: 'newuser@example.com',
        password: 'weak',
        name: 'New User',
      });
      expect(result.success).toBe(false);
    });

    /**
     * Tests that missing name fails validation.
     */
    it('rejects missing name', () => {
      const result = registerSchema.safeParse({
        email: 'newuser@example.com',
        password: 'SecureP@ss123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    /**
     * Tests that valid email passes validation.
     */
    it('accepts valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(true);
    });

    /**
     * Tests that invalid email fails validation.
     */
    it('rejects invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    /**
     * Tests that valid reset data passes validation.
     */
    it('accepts valid reset data', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'valid-reset-token',
        password: 'NewSecureP@ss123',
      });
      expect(result.success).toBe(true);
    });

    /**
     * Tests that missing token fails validation.
     */
    it('rejects missing token', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewSecureP@ss123',
      });
      expect(result.success).toBe(false);
    });

    /**
     * Tests that weak new password fails validation.
     */
    it('rejects weak new password', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'valid-reset-token',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    /**
     * Tests that valid refresh token passes validation.
     */
    it('accepts valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'valid-refresh-token',
      });
      expect(result.success).toBe(true);
    });

    /**
     * Tests that empty refresh token fails validation.
     */
    it('rejects empty refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: '',
      });
      expect(result.success).toBe(false);
    });

    /**
     * Tests that missing refresh token fails validation.
     */
    it('rejects missing refresh token', () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
