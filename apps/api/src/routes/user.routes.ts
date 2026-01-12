/**
 * @fileoverview User routes configuration.
 * Defines routes for user profile management.
 *
 * @module @plpg/api/routes/user
 * @description User profile management routes.
 */

import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { jwtMiddleware, requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Apply authentication middleware to all user routes.
 * All user routes require authentication.
 */
router.use(jwtMiddleware, requireAuth);

/**
 * @route GET /api/v1/users/profile
 * @description Gets the current user's profile
 * @access Private - requires authentication
 */
router.get('/profile', getProfile);

/**
 * @route PATCH /api/v1/users/profile
 * @description Updates the current user's profile
 * @access Private - requires authentication
 * @body {name?: string, avatarUrl?: string | null}
 */
router.patch('/profile', updateProfile);

export const userRoutes = router;
