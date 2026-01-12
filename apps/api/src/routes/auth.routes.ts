/**
 * @fileoverview Authentication routes for PLPG API.
 * Defines routes for login, logout, registration, session management, and password reset.
 *
 * @module @plpg/api/routes/auth
 * @description Authentication endpoint routing.
 */

import { Router } from 'express';
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@plpg/shared/validation';
import { login, register, getMe, logout } from '../controllers/auth.controller';
import {
  forgotPassword,
  resetPasswordHandler,
  validateResetTokenHandler,
} from '../controllers/passwordReset.controller';
import { validate } from '../middleware/validate.middleware';
import { jwtMiddleware, requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @route POST /api/v1/auth/login
 * @description Authenticate user with email and password
 * @access Public (rate limited)
 *
 * @body {string} email - User's email address
 * @body {string} password - User's password
 *
 * @returns {AuthResponse} User data with access and refresh tokens
 *
 * @throws {401} Invalid credentials
 * @throws {429} Too many login attempts
 */
router.post('/login', authRateLimiter, login);

/**
 * POST /api/v1/auth/register
 * Register a new user account
 * Public access
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/register', authRateLimiter, validate({ body: registerSchema }), register);

/**
 * Get Current Session Endpoint
 *
 * @route GET /api/v1/auth/me
 * @description Returns the current authenticated user's session information.
 *
 * @header Authorization - Bearer token (required)
 *
 * @response 200 - Success
 * {
 *   "userId": string,
 *   "email": string,
 *   "name": string | null,
 *   "subscriptionStatus": "active" | "expired" | "cancelled",
 *   "trialEndsAt": string | null,
 *   "isVerified": boolean,
 *   "role": "free" | "pro" | "admin"
 * }
 *
 * @response 401 - Unauthorized
 * {
 *   "error": "AuthenticationError",
 *   "message": "Authentication required",
 *   "code": "UNAUTHORIZED"
 * }
 */
router.get('/me', jwtMiddleware, requireAuth, getMe);

/**
 * Logout Endpoint
 *
 * @route POST /api/v1/auth/logout
 * @description Invalidates the user's session by removing refresh token(s) from the database.
 *
 * @header Authorization - Bearer token (required)
 *
 * @body {string} [refreshToken] - The refresh token to invalidate (optional)
 * @body {boolean} [logoutAll=false] - If true, invalidates all user sessions
 *
 * @response 200 - Success
 * {
 *   "success": true,
 *   "message": "Successfully logged out"
 * }
 *
 * @response 401 - Unauthorized
 * {
 *   "error": "AuthenticationError",
 *   "message": "Authentication required",
 *   "code": "UNAUTHORIZED"
 * }
 */
router.post('/logout', jwtMiddleware, requireAuth, logout);

/**
 * Forgot Password Endpoint
 *
 * @route POST /api/v1/auth/forgot-password
 * @description Initiates password reset flow by sending email with reset link.
 * Always returns 200 to prevent user enumeration.
 *
 * @body {string} email - User's email address
 *
 * @response 200 - Success (always returned)
 * {
 *   "success": true,
 *   "message": "If an account exists with this email, you will receive a password reset link shortly."
 * }
 *
 * @response 429 - Too Many Requests
 * {
 *   "error": "Too many password reset requests",
 *   "message": "You have exceeded the limit for password reset requests. Please try again after 1 hour."
 * }
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
);

/**
 * Reset Password Endpoint
 *
 * @route POST /api/v1/auth/reset-password
 * @description Validates token and updates user's password.
 *
 * @body {string} token - Reset token from email link
 * @body {string} password - New password (must meet strength requirements)
 *
 * @response 200 - Success
 * {
 *   "success": true,
 *   "message": "Your password has been reset successfully. You can now sign in with your new password."
 * }
 *
 * @response 400 - Invalid Token
 * {
 *   "error": "ValidationError",
 *   "message": "Invalid or expired reset token"
 * }
 *
 * @response 429 - Too Many Requests
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate({ body: resetPasswordSchema }),
  resetPasswordHandler
);

/**
 * Validate Reset Token Endpoint
 *
 * @route GET /api/v1/auth/validate-reset-token/:token
 * @description Checks if a reset token is valid without consuming it.
 * Used by frontend to validate token before showing reset form.
 *
 * @param {string} token - Reset token to validate
 *
 * @response 200 - Success
 * {
 *   "valid": true | false
 * }
 */
router.get('/validate-reset-token/:token', validateResetTokenHandler);

export const authRoutes = router;
export default router;
