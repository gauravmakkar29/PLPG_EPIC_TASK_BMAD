/**
 * @fileoverview User controller for PLPG API.
 * Handles user profile management endpoints.
 *
 * @module @plpg/api/controllers/user
 * @description HTTP handlers for user profile endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import { updateProfileSchema, AuthenticationError, ValidationError } from '@plpg/shared';
import { updateUserProfile, getUserProfile } from '../services/user.service';
import { logger } from '../lib/logger';

/**
 * Gets the current user's profile.
 *
 * @route GET /api/v1/users/profile
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>}
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    logger.debug({ userId: req.user.id }, 'Getting user profile');

    const profile = await getUserProfile(req.user.id);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

/**
 * Updates the current user's profile.
 *
 * @route PATCH /api/v1/users/profile
 * @param {Request} req - Express request with authenticated user and profile data
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>}
 *
 * @example
 * // Request body
 * { "name": "New Name" }
 *
 * // Response
 * { "id": "...", "email": "...", "name": "New Name", "avatarUrl": null, "emailVerified": true }
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    logger.debug({ userId: req.user.id, body: req.body }, 'Updating user profile');

    // Validate request body
    const parseResult = updateProfileSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.errors[0]?.message || 'Invalid request data';
      throw new ValidationError({ errors: parseResult.error.errors }, errorMessage);
    }

    const profile = await updateUserProfile(req.user.id, parseResult.data);

    logger.info({ userId: req.user.id }, 'User profile updated');

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}
