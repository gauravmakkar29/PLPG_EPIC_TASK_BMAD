/**
 * @fileoverview Authentication routes for PLPG API.
 * Defines routes for login, logout, and token management.
 *
 * @module @plpg/api/routes/auth
 * @description Authentication endpoint routing.
 */

import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
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
router.post('/register', authRateLimiter, register);

export const authRoutes = router;
export default router;
