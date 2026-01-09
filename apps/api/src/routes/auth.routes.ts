/**
 * @fileoverview Authentication routes.
 * Defines endpoints for user authentication and token management.
 *
 * @module @plpg/api/routes/auth
 */

import { Router } from 'express';
import {
  login,
  register,
  refreshAccessToken,
  logout,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Authenticate user with email and password
 * Public access
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/login', authRateLimiter, login);

/**
 * POST /api/v1/auth/register
 * Register a new user account
 * Public access
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/register', authRateLimiter, register);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 * Public access
 */
router.post('/refresh', refreshAccessToken);

/**
 * POST /api/v1/auth/logout
 * Logout user and invalidate refresh token
 * Requires authentication
 */
router.post('/logout', requireAuth, logout);

export default router;
