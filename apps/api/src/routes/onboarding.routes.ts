/**
 * @fileoverview Onboarding routes for PLPG API.
 * Defines routes for onboarding flow management.
 *
 * @module @plpg/api/routes/onboarding
 *
 * @description
 * This module provides routes for:
 * - Getting onboarding status
 * - Saving step 1 data (current role selection)
 * - Future: Steps 2-5 endpoints
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - Selection saved immediately (no data loss on navigation)
 * - Selection persists in database
 */

import { Router } from 'express';
import { onboardingStep1Schema, onboardingStep4Schema, updatePreferencesSchema } from '@plpg/shared/validation';
import { getStatus, saveStep1Handler, saveStep4Handler, completeHandler, updatePreferencesHandler } from '../controllers/onboarding.controller';
import { validate } from '../middleware/validate.middleware';
import { jwtMiddleware, requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get Onboarding Status Endpoint
 *
 * @route GET /api/v1/onboarding
 * @description Returns the current onboarding state for the authenticated user.
 *
 * @header Authorization - Bearer token (required)
 *
 * @response 200 - Success
 * {
 *   "isComplete": boolean,
 *   "currentStep": number (1-5),
 *   "totalSteps": number (5),
 *   "response": OnboardingResponse | null
 * }
 *
 * @response 401 - Unauthorized
 * {
 *   "error": "AuthenticationError",
 *   "message": "Authentication required",
 *   "code": "UNAUTHORIZED"
 * }
 */
router.get('/', jwtMiddleware, requireAuth, getStatus);

/**
 * Save Step 1 Data Endpoint
 *
 * @route PATCH /api/v1/onboarding/step/1
 * @description Saves the current role selection for step 1 of onboarding.
 * Creates a new onboarding record if none exists, or updates existing.
 *
 * @header Authorization - Bearer token (required)
 *
 * @body {string} currentRole - One of: 'backend_developer', 'devops_engineer',
 *                              'data_analyst', 'qa_engineer', 'it_professional', 'other'
 * @body {string} [customRoleText] - Required when currentRole is 'other' (2-100 chars)
 *
 * @response 200 - Success
 * {
 *   "success": true,
 *   "data": {
 *     "id": string,
 *     "userId": string,
 *     "currentRole": string,
 *     "customRoleText": string | null,
 *     "targetRole": string,
 *     "weeklyHours": number,
 *     "skillsToSkip": string[],
 *     "completedAt": Date | null,
 *     "createdAt": Date
 *   }
 * }
 *
 * @response 400 - Validation Error
 * {
 *   "error": "ValidationError",
 *   "message": "Please select a valid current role"
 * }
 *
 * @response 401 - Unauthorized
 */
router.patch(
  '/step/1',
  jwtMiddleware,
  requireAuth,
  validate({ body: onboardingStep1Schema }),
  saveStep1Handler
);

/**
 * Save Step 4 Data Endpoint
 *
 * @route PATCH /api/v1/onboarding/step/4
 * @description Saves the existing skills selection for step 4 of onboarding.
 * Updates the skillsToSkip array with skill IDs the user wants to skip.
 *
 * @requirements
 * - AIRE-237: Story 2.5 - Existing Skills Selection
 * - Skills saved and passed to roadmap engine
 *
 * @header Authorization - Bearer token (required)
 *
 * @body {string[]} skillsToSkip - Array of skill UUIDs to skip
 *
 * @response 200 - Success
 * {
 *   "success": true,
 *   "data": {
 *     "id": string,
 *     "userId": string,
 *     "currentRole": string,
 *     "customRoleText": string | null,
 *     "targetRole": string,
 *     "weeklyHours": number,
 *     "skillsToSkip": string[],
 *     "completedAt": Date | null,
 *     "createdAt": Date
 *   }
 * }
 *
 * @response 400 - Validation Error (invalid skill IDs)
 * @response 401 - Unauthorized
 * @response 500 - Internal Server Error
 */
router.patch(
  '/step/4',
  jwtMiddleware,
  requireAuth,
  validate({ body: onboardingStep4Schema }),
  saveStep4Handler
);

// Future endpoints for remaining steps will be added here:
// router.patch('/step/2', jwtMiddleware, requireAuth, validate({ body: onboardingStep2Schema }), saveStep2Handler);
// router.patch('/step/3', jwtMiddleware, requireAuth, validate({ body: onboardingStep3Schema }), saveStep3Handler);

/**
 * Complete Onboarding Endpoint
 *
 * @route POST /api/v1/onboarding/complete
 * @description Marks onboarding as complete and triggers roadmap generation.
 * Validates that all required steps are completed before processing.
 *
 * @requirements
 * - AIRE-238: Story 2.6 - Onboarding Completion
 * - Generate My Path button triggers roadmap generation (E3)
 * - Loading state during generation (<3s target)
 * - Success redirects to Path Preview (E4)
 *
 * @header Authorization - Bearer token (required)
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
router.post('/complete', jwtMiddleware, requireAuth, completeHandler);

/**
 * Update Preferences Endpoint
 *
 * @route PUT /api/v1/onboarding/preferences
 * @description Updates all onboarding preferences for an existing user.
 * Triggers roadmap regeneration while preserving progress for matching modules.
 * This is used for re-onboarding when a user wants to modify their learning path.
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 * - Pre-filled with current selections
 * - Warning: Changing preferences will regenerate your roadmap
 * - Confirmation before overwriting
 * - New roadmap generated; old progress retained where applicable
 *
 * @header Authorization - Bearer token (required)
 *
 * @body {string} currentRole - One of: 'backend_developer', 'devops_engineer',
 *                              'data_analyst', 'qa_engineer', 'it_professional', 'other'
 * @body {string} [customRoleText] - Required when currentRole is 'other' (2-100 chars)
 * @body {string} targetRole - One of: 'ml_engineer', 'data_scientist', 'mlops_engineer', 'ai_engineer'
 * @body {number} weeklyHours - Weekly hours commitment (5-20)
 * @body {string[]} skillsToSkip - Array of skill UUIDs to skip
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
router.put(
  '/preferences',
  jwtMiddleware,
  requireAuth,
  validate({ body: updatePreferencesSchema }),
  updatePreferencesHandler
);

export const onboardingRoutes = router;
export default router;
