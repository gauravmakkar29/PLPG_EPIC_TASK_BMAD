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
import { onboardingStep1Schema, onboardingStep4Schema, updatePreferencesSchema } from '@plpg/shared/validation';
import { AuthenticationError, ValidationError } from '@plpg/shared';
import {
  getOnboardingStatus,
  saveStep1,
  saveStep4,
  completeOnboarding,
  updatePreferences,
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

/**
 * Save step 4 data endpoint handler.
 *
 * Saves the existing skills selection for the authenticated user.
 * These skills will be skipped in the generated roadmap.
 *
 * @route PATCH /api/v1/onboarding/step/4
 * @param {Request} req - Express request with step 4 data in body
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 *
 * @requirements
 * - AIRE-237: Story 2.5 - Existing Skills Selection
 * - Skills saved and passed to roadmap engine
 * - Selections persist in database
 *
 * @body {string[]} skillsToSkip - Array of skill IDs to skip
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
export async function saveStep4Handler(
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
    const parseResult = onboardingStep4Schema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.errors[0]?.message || 'Invalid request data';
      throw new ValidationError(errorMessage);
    }

    const { skillsToSkip } = parseResult.data;

    logger.debug(
      { userId, skillCount: skillsToSkip.length },
      'Saving step 4 data'
    );

    // Save step 4 data
    const response = await saveStep4(userId, {
      skillsToSkip,
    });

    logger.info(
      { userId, skillCount: skillsToSkip.length },
      'Step 4 saved successfully'
    );

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error({ error }, 'Error saving step 4 data');
    next(error);
  }
}

/**
 * Complete onboarding endpoint handler.
 *
 * Marks onboarding as complete and triggers roadmap generation.
 * This is the final step in the onboarding flow.
 *
 * @route POST /api/v1/onboarding/complete
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 *
 * @requirements
 * - AIRE-238: Story 2.6 - Onboarding Completion
 * - Generate My Path button triggers roadmap generation (E3)
 * - Loading state during generation (<3s target)
 * - Success redirects to Path Preview (E4)
 *
 * @response 200 - Success
 * {
 *   "success": true,
 *   "data": {
 *     "onboardingResponse": OnboardingResponse,
 *     "roadmapId": string | null
 *   }
 * }
 *
 * @response 400 - Validation Error (missing required steps)
 * @response 401 - Unauthorized
 * @response 500 - Internal Server Error
 */
export async function completeHandler(
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

    logger.debug({ userId }, 'Completing onboarding');

    // Complete onboarding and trigger roadmap generation
    const result = await completeOnboarding(userId);

    logger.info(
      {
        userId,
        roadmapId: result.roadmapId,
        completedAt: result.onboardingResponse.completedAt,
      },
      'Onboarding completed successfully'
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Error completing onboarding');
    next(error);
  }
}

/**
 * Update preferences endpoint handler.
 *
 * Updates all onboarding preferences for an existing user and triggers
 * roadmap regeneration. This is used for re-onboarding when a user wants
 * to modify their learning path preferences.
 *
 * @route PUT /api/v1/onboarding/preferences
 * @param {Request} req - Express request with preferences data in body
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 * - Pre-filled with current selections
 * - Warning: Changing preferences will regenerate your roadmap
 * - Confirmation before overwriting
 * - New roadmap generated; old progress retained where applicable
 *
 * @body {string} currentRole - Updated current role
 * @body {string} [customRoleText] - Custom role text when 'other' is selected
 * @body {string} targetRole - Updated target role
 * @body {number} weeklyHours - Updated weekly hours (5-20)
 * @body {string[]} skillsToSkip - Updated array of skill IDs to skip
 *
 * @response 200 - Success
 * {
 *   "success": true,
 *   "data": {
 *     "onboardingResponse": OnboardingResponse,
 *     "roadmapRegenerated": boolean,
 *     "newRoadmapId": string | null,
 *     "preservedModulesCount": number
 *   }
 * }
 *
 * @response 400 - Validation Error (invalid input)
 * @response 401 - Unauthorized
 * @response 404 - Onboarding not found
 * @response 500 - Internal Server Error
 */
export async function updatePreferencesHandler(
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
    const parseResult = updatePreferencesSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.errors[0]?.message || 'Invalid request data';
      throw new ValidationError(errorMessage);
    }

    const { currentRole, customRoleText, targetRole, weeklyHours, skillsToSkip } = parseResult.data;

    logger.debug(
      {
        userId,
        currentRole,
        targetRole,
        weeklyHours,
        skillsToSkipCount: skillsToSkip.length,
      },
      'Updating user preferences'
    );

    // Update preferences and trigger roadmap regeneration
    const result = await updatePreferences(userId, {
      currentRole,
      customRoleText,
      targetRole,
      weeklyHours,
      skillsToSkip,
    });

    logger.info(
      {
        userId,
        roadmapRegenerated: result.roadmapRegenerated,
        newRoadmapId: result.newRoadmapId,
        preservedModulesCount: result.preservedModulesCount,
      },
      'Preferences updated successfully'
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Error updating preferences');
    next(error);
  }
}
