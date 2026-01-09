/**
 * @fileoverview Authentication routes.
 * Defines endpoints for user authentication and token management.
 *
 * @module @plpg/api/routes/auth
 */

import { Router } from 'express';
import { register } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user account
 * Public access
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/register', authRateLimiter, register);

export default router;
