/**
 * @fileoverview Zod validation schemas for authentication.
 * Defines request/response validation for auth endpoints.
 *
 * @module @plpg/shared/validation/auth.schema
 * @description Authentication validation schemas.
 */

import { z } from 'zod';

/**
 * Email validation schema.
 * Validates email format with reasonable constraints.
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be at most 255 characters')
  .toLowerCase()
  .trim();

/**
 * Password validation schema.
 * Enforces strong password requirements.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Name validation schema.
 * Validates display name with reasonable constraints.
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .trim();

/**
 * Login request validation schema.
 *
 * @schema loginSchema
 * @description Validates login request body.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register request validation schema.
 *
 * @schema registerSchema
 * @description Validates registration request body.
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

/**
 * Refresh token request validation schema.
 *
 * @schema refreshTokenSchema
 * @description Validates token refresh request.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Forgot password request validation schema.
 *
 * @schema forgotPasswordSchema
 * @description Validates forgot password request.
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password request validation schema.
 *
 * @schema resetPasswordSchema
 * @description Validates password reset request.
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

/**
 * Verify email request validation schema.
 *
 * @schema verifyEmailSchema
 * @description Validates email verification request.
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Change password request validation schema.
 *
 * @schema changePasswordSchema
 * @description Validates password change request.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

/**
 * Update profile request validation schema.
 *
 * @schema updateProfileSchema
 * @description Validates profile update request.
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  avatarUrl: z.string().url('Invalid URL').nullable().optional(),
});

// Type exports inferred from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
