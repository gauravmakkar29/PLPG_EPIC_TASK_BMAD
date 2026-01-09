/**
 * @fileoverview Authentication routes for PLPG API.
 * Defines routes for login, logout, registration, and session management.
 *
 * @module @plpg/api/routes/auth
 * @description Authentication endpoint routing.
 */

import { Router } from 'express';
import { registerSchema } from '@plpg/shared/validation';
import { login, register, getMe } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { jwtMiddleware, requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

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

export const authRoutes = router;
export default router;
