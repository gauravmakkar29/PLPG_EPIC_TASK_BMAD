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
import { onboardingStep1Schema } from '@plpg/shared/validation';
import { getStatus, saveStep1Handler } from '../controllers/onboarding.controller';
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

// Future endpoints for steps 2-5 will be added here:
// router.patch('/step/2', jwtMiddleware, requireAuth, validate({ body: onboardingStep2Schema }), saveStep2Handler);
// router.patch('/step/3', jwtMiddleware, requireAuth, validate({ body: onboardingStep3Schema }), saveStep3Handler);
// router.patch('/step/4', jwtMiddleware, requireAuth, validate({ body: onboardingStep4Schema }), saveStep4Handler);
// router.post('/complete', jwtMiddleware, requireAuth, validate({ body: completeOnboardingSchema }), completeHandler);

export const onboardingRoutes = router;
export default router;
