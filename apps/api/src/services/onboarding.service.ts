/**
 * @fileoverview Onboarding service for PLPG API.
 * Handles business logic for onboarding operations.
 *
 * @module @plpg/api/services/onboarding
 *
 * @description
 * This service manages:
 * - Creating and updating onboarding responses
 * - Fetching onboarding status
 * - Validating step data
 * - Tracking onboarding progress
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - Selection saved immediately (no data loss on navigation)
 * - Selection persists in database
 */

import { prisma } from '../lib/prisma';
import type {
  OnboardingResponse,
  OnboardingStatus,
  OnboardingStep1Data,
  CurrentRole,
} from '@plpg/shared';
import { logger } from '../lib/logger';

/**
 * Determines the current step based on onboarding data.
 *
 * @param {OnboardingResponse | null} response - The onboarding response
 * @returns {number} The current step number (1-5)
 */
function calculateCurrentStep(response: OnboardingResponse | null): number {
  if (!response) return 1;
  if (!response.currentRole) return 1;
  if (!response.targetRole || response.targetRole === 'ml_engineer') return 2;
  if (!response.weeklyHours) return 3;
  if (response.skillsToSkip.length === 0 && !response.completedAt) return 4;
  if (!response.completedAt) return 5;
  return 5;
}

/**
 * Gets the onboarding status for a user.
 *
 * Retrieves the current onboarding response and calculates the progress.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<OnboardingStatus>} The onboarding status
 *
 * @example
 * ```ts
 * const status = await getOnboardingStatus('user-123');
 * // { isComplete: false, currentStep: 1, totalSteps: 5, response: null }
 * ```
 */
export async function getOnboardingStatus(
  userId: string
): Promise<OnboardingStatus> {
  logger.debug({ userId }, 'Getting onboarding status');

  const response = await prisma.onboardingResponse.findUnique({
    where: { userId },
  });

  const isComplete = response?.completedAt !== null && response?.completedAt !== undefined;
  const currentStep = calculateCurrentStep(response as OnboardingResponse | null);

  const status: OnboardingStatus = {
    isComplete,
    currentStep,
    totalSteps: 5,
    response: response
      ? {
          id: response.id,
          userId: response.userId,
          currentRole: response.currentRole,
          customRoleText: response.customRoleText,
          targetRole: response.targetRole,
          weeklyHours: response.weeklyHours,
          skillsToSkip: response.skillsToSkip,
          completedAt: response.completedAt,
          createdAt: response.createdAt,
        }
      : null,
  };

  logger.debug({ userId, status }, 'Onboarding status retrieved');

  return status;
}

/**
 * Saves step 1 data (current role selection) for a user.
 *
 * Creates a new onboarding response if none exists,
 * or updates the existing one with the new current role.
 *
 * @param {string} userId - The user's ID
 * @param {OnboardingStep1Data} data - Step 1 form data
 * @returns {Promise<OnboardingResponse>} The updated onboarding response
 *
 * @throws {Error} If the save operation fails
 *
 * @example
 * ```ts
 * const response = await saveStep1(
 *   'user-123',
 *   { currentRole: 'backend_developer' }
 * );
 * ```
 */
export async function saveStep1(
  userId: string,
  data: OnboardingStep1Data
): Promise<OnboardingResponse> {
  logger.debug({ userId, data }, 'Saving step 1 data');

  // Validate role value
  const validRoles: CurrentRole[] = [
    'backend_developer',
    'devops_engineer',
    'data_analyst',
    'qa_engineer',
    'it_professional',
    'other',
  ];

  if (!validRoles.includes(data.currentRole)) {
    throw new Error(`Invalid current role: ${data.currentRole}`);
  }

  // Validate custom role text if 'other' is selected
  if (data.currentRole === 'other') {
    if (!data.customRoleText || data.customRoleText.trim().length < 2) {
      throw new Error('Custom role text is required when selecting "Other"');
    }
  }

  // Upsert the onboarding response
  const response = await prisma.onboardingResponse.upsert({
    where: { userId },
    update: {
      currentRole: data.currentRole,
      customRoleText: data.currentRole === 'other' ? data.customRoleText : null,
      updatedAt: new Date(),
    },
    create: {
      userId,
      currentRole: data.currentRole,
      customRoleText: data.currentRole === 'other' ? data.customRoleText : null,
      targetRole: 'ml_engineer', // Default value
      weeklyHours: 10, // Default value
      skillsToSkip: [],
    },
  });

  logger.info(
    { userId, currentRole: data.currentRole },
    'Step 1 data saved successfully'
  );

  return {
    id: response.id,
    userId: response.userId,
    currentRole: response.currentRole,
    customRoleText: response.customRoleText,
    targetRole: response.targetRole,
    weeklyHours: response.weeklyHours,
    skillsToSkip: response.skillsToSkip,
    completedAt: response.completedAt,
    createdAt: response.createdAt,
  };
}

/**
 * Checks if a user has completed onboarding.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} True if onboarding is complete
 *
 * @example
 * ```ts
 * const isComplete = await hasCompletedOnboarding('user-123');
 * ```
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const response = await prisma.onboardingResponse.findUnique({
    where: { userId },
    select: { completedAt: true },
  });

  return response?.completedAt !== null && response?.completedAt !== undefined;
}

/**
 * Gets the onboarding response for a user.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<OnboardingResponse | null>} The onboarding response or null
 *
 * @example
 * ```ts
 * const response = await getOnboardingByUserId('user-123');
 * ```
 */
export async function getOnboardingByUserId(
  userId: string
): Promise<OnboardingResponse | null> {
  const response = await prisma.onboardingResponse.findUnique({
    where: { userId },
  });

  if (!response) return null;

  return {
    id: response.id,
    userId: response.userId,
    currentRole: response.currentRole,
    customRoleText: response.customRoleText,
    targetRole: response.targetRole,
    weeklyHours: response.weeklyHours,
    skillsToSkip: response.skillsToSkip,
    completedAt: response.completedAt,
    createdAt: response.createdAt,
  };
}
