/**
 * @fileoverview Onboarding controller for PLPG API.
 * Handles HTTP requests for onboarding endpoints.
 *
 * @module @plpg/api/controllers/onboarding
 *
 * @description
 * This controller manages:
 * - GET /onboarding - Get onboarding status
 * - PATCH /onboarding/step/1 - Save step 1 data
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - Selection saved immediately (no data loss on navigation)
 * - Selection persists in database
 */

import type { Request, Response, NextFunction } from 'express';
import { onboardingStep1Schema } from '@plpg/shared/validation';
import { AuthenticationError, ValidationError } from '@plpg/shared';
import {
  getOnboardingStatus,
  saveStep1,
} from '../services/onboarding.service';
import { logger } from '../lib/logger';

/**
 * Get onboarding status endpoint handler.
 *
 * Returns the current onboarding state for the authenticated user,
 * including progress information and any existing responses.
 *
 * @route GET /api/v1/onboarding
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 *
 * @response 200 - Success
 * {
 *   "isComplete": boolean,
 *   "currentStep": number,
 *   "totalSteps": number,
 *   "response": OnboardingResponse | null
 * }
 *
 * @response 401 - Unauthorized
 * @response 500 - Internal Server Error
 */
export async function getStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User should be set by jwtMiddleware + requireAuth
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userId = req.user.id;
    logger.debug({ userId }, 'Getting onboarding status');

    const status = await getOnboardingStatus(userId);

    res.status(200).json(status);
  } catch (error) {
    logger.error({ error }, 'Error getting onboarding status');
    next(error);
  }
}

/**
 * Save step 1 data endpoint handler.
 *
 * Saves the current role selection for the authenticated user.
 * Creates a new onboarding response if none exists.
 *
 * @route PATCH /api/v1/onboarding/step/1
 * @param {Request} req - Express request with step 1 data in body
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 *
 * @body {string} currentRole - Selected current role
 * @body {string} [customRoleText] - Custom role text when 'other' is selected
 *
 * @response 200 - Success
 * {
 *   "success": true,
 *   "data": OnboardingResponse
 * }
 *
 * @response 400 - Validation Error
 * @response 401 - Unauthorized
 * @response 500 - Internal Server Error
 */
export async function saveStep1Handler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User should be set by jwtMiddleware + requireAuth
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userId = req.user.id;

    // Validate request body
    const parseResult = onboardingStep1Schema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.errors[0]?.message || 'Invalid request data';
      throw new ValidationError(errorMessage);
    }

    const { currentRole, customRoleText } = parseResult.data;

    logger.debug(
      { userId, currentRole, hasCustomRole: !!customRoleText },
      'Saving step 1 data'
    );

    // Save step 1 data
    const response = await saveStep1(userId, {
      currentRole,
      customRoleText,
    });

    logger.info({ userId, currentRole }, 'Step 1 saved successfully');

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error({ error }, 'Error saving step 1 data');
    next(error);
  }
}
