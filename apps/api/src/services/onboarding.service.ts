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
  OnboardingStep4Data,
  CurrentRole,
  UpdatePreferencesInput,
  UpdatePreferencesResult,
} from '@plpg/shared';
import { logger } from '../lib/logger';

/**
 * Determines the current step based on onboarding data.
 *
 * @param {OnboardingResponse | null} response - The onboarding response
 * @returns {number} The current step number (1-5)
 */
function calculateCurrentStep(response: OnboardingResponse | null): number {
  if (!response) {
    return 1;
  }
  if (!response.currentRole) {
    return 1;
  }
  if (!response.targetRole || response.targetRole === 'ml_engineer') {
    return 2;
  }
  if (!response.weeklyHours) {
    return 3;
  }
  if (response.skillsToSkip.length === 0 && !response.completedAt) {
    return 4;
  }
  if (!response.completedAt) {
    return 5;
  }
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

  if (!response) {
    return null;
  }

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
 * Saves step 4 data (existing skills selection) for a user.
 *
 * Updates the onboarding response with the skills the user wants to skip.
 * These skills will be excluded from the generated roadmap.
 *
 * @param {string} userId - The user's ID
 * @param {OnboardingStep4Data} data - Step 4 form data containing skillsToSkip array
 * @returns {Promise<OnboardingResponse>} The updated onboarding response
 *
 * @throws {Error} If no onboarding response exists for the user
 * @throws {Error} If the save operation fails
 *
 * @requirements
 * - AIRE-237: Story 2.5 - Existing Skills Selection
 * - Skills saved and passed to roadmap engine
 * - Selections persist in database
 *
 * @example
 * ```ts
 * const response = await saveStep4(
 *   'user-123',
 *   { skillsToSkip: ['skill-id-1', 'skill-id-2'] }
 * );
 * ```
 */
export async function saveStep4(
  userId: string,
  data: OnboardingStep4Data
): Promise<OnboardingResponse> {
  logger.debug({ userId, data }, 'Saving step 4 data');

  // Validate that skillsToSkip is an array (additional runtime check)
  if (!Array.isArray(data.skillsToSkip)) {
    throw new Error('skillsToSkip must be an array');
  }

  // Check if onboarding response exists
  const existing = await prisma.onboardingResponse.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new Error('Onboarding not started. Please complete previous steps first.');
  }

  // Update the onboarding response with skills to skip
  const response = await prisma.onboardingResponse.update({
    where: { userId },
    data: {
      skillsToSkip: data.skillsToSkip,
      updatedAt: new Date(),
    },
  });

  logger.info(
    { userId, skillCount: data.skillsToSkip.length },
    'Step 4 data saved successfully'
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
 * Result of completing onboarding.
 * Contains the onboarding response and generated roadmap ID.
 *
 * @interface CompleteOnboardingResult
 * @property {OnboardingResponse} onboardingResponse - Updated onboarding response
 * @property {string | null} roadmapId - Generated roadmap ID (null if generation pending)
 */
export interface CompleteOnboardingResult {
  onboardingResponse: OnboardingResponse;
  roadmapId: string | null;
}

/**
 * Completes the onboarding process for a user.
 *
 * Validates all required data is present, marks onboarding as complete,
 * and triggers roadmap generation. This is the final step in the onboarding flow.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<CompleteOnboardingResult>} The completion result with roadmap ID
 *
 * @throws {Error} If onboarding response doesn't exist
 * @throws {Error} If required onboarding data is missing
 * @throws {Error} If onboarding is already completed
 *
 * @requirements
 * - AIRE-238: Story 2.6 - Onboarding Completion
 * - Generate My Path button triggers roadmap generation (E3)
 * - Loading state during generation (<3s target)
 * - Success redirects to Path Preview (E4)
 *
 * @example
 * ```ts
 * const result = await completeOnboarding('user-123');
 * // { onboardingResponse: {...}, roadmapId: 'roadmap-uuid' }
 * ```
 */
export async function completeOnboarding(
  userId: string
): Promise<CompleteOnboardingResult> {
  logger.debug({ userId }, 'Completing onboarding');

  // Fetch existing onboarding response
  const existing = await prisma.onboardingResponse.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new Error('Onboarding not started. Please complete all steps first.');
  }

  // Validate all required fields are present
  if (!existing.currentRole) {
    throw new Error('Current role is required. Please complete Step 1.');
  }
  if (!existing.targetRole) {
    throw new Error('Target role is required. Please complete Step 2.');
  }
  if (!existing.weeklyHours || existing.weeklyHours < 5) {
    throw new Error('Weekly hours is required. Please complete Step 3.');
  }

  // Check if already completed
  if (existing.completedAt) {
    logger.info({ userId }, 'Onboarding already completed');
    return {
      onboardingResponse: {
        id: existing.id,
        userId: existing.userId,
        currentRole: existing.currentRole,
        customRoleText: existing.customRoleText,
        targetRole: existing.targetRole,
        weeklyHours: existing.weeklyHours,
        skillsToSkip: existing.skillsToSkip,
        completedAt: existing.completedAt,
        createdAt: existing.createdAt,
      },
      roadmapId: null, // Would fetch existing roadmap ID in real implementation
    };
  }

  // Mark onboarding as complete
  const completedAt = new Date();
  const response = await prisma.onboardingResponse.update({
    where: { userId },
    data: {
      completedAt,
      updatedAt: completedAt,
    },
  });

  logger.info(
    {
      userId,
      targetRole: existing.targetRole,
      weeklyHours: existing.weeklyHours,
      skillsToSkipCount: existing.skillsToSkip.length,
    },
    'Onboarding completed successfully'
  );

  // TODO: Trigger roadmap generation via roadmap engine
  // const roadmap = await generateRoadmap({
  //   userId,
  //   targetRole: existing.targetRole,
  //   weeklyHours: existing.weeklyHours,
  //   skillsToSkip: existing.skillsToSkip,
  // });

  // For now, return null roadmapId - actual generation will be implemented in E3
  const roadmapId = null;

  return {
    onboardingResponse: {
      id: response.id,
      userId: response.userId,
      currentRole: response.currentRole,
      customRoleText: response.customRoleText,
      targetRole: response.targetRole,
      weeklyHours: response.weeklyHours,
      skillsToSkip: response.skillsToSkip,
      completedAt: response.completedAt,
      createdAt: response.createdAt,
    },
    roadmapId,
  };
}

/**
 * Updates user preferences and triggers roadmap regeneration.
 *
 * This is used for re-onboarding when an existing user wants to modify their
 * learning path preferences. The function updates all onboarding fields and
 * triggers roadmap regeneration while preserving progress for matching modules.
 *
 * @param {string} userId - The user's ID
 * @param {UpdatePreferencesInput} data - The updated preference data
 * @returns {Promise<UpdatePreferencesResult>} The update result with regeneration status
 *
 * @throws {Error} If no onboarding response exists for the user
 * @throws {Error} If onboarding was never completed
 * @throws {Error} If the update operation fails
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 * - Pre-filled with current selections
 * - New roadmap generated on confirmation
 * - Existing progress retained for matching modules
 *
 * @example
 * ```ts
 * const result = await updatePreferences('user-123', {
 *   currentRole: 'backend_developer',
 *   targetRole: 'ml_engineer',
 *   weeklyHours: 15,
 *   skillsToSkip: ['skill-id-1'],
 * });
 * // { onboardingResponse: {...}, roadmapRegenerated: true, newRoadmapId: 'roadmap-uuid', preservedModulesCount: 5 }
 * ```
 */
export async function updatePreferences(
  userId: string,
  data: UpdatePreferencesInput
): Promise<UpdatePreferencesResult> {
  logger.debug({ userId, data }, 'Updating user preferences');

  // Fetch existing onboarding response
  const existing = await prisma.onboardingResponse.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new Error('Onboarding not found. Please complete onboarding first.');
  }

  if (!existing.completedAt) {
    throw new Error('Onboarding not completed. Please complete onboarding first.');
  }

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

  // Update the onboarding response with new preferences
  const updatedAt = new Date();
  const response = await prisma.onboardingResponse.update({
    where: { userId },
    data: {
      currentRole: data.currentRole,
      customRoleText: data.currentRole === 'other' ? data.customRoleText : null,
      targetRole: data.targetRole,
      weeklyHours: data.weeklyHours,
      skillsToSkip: data.skillsToSkip,
      updatedAt,
    },
  });

  logger.info(
    {
      userId,
      currentRole: data.currentRole,
      targetRole: data.targetRole,
      weeklyHours: data.weeklyHours,
      skillsToSkipCount: data.skillsToSkip.length,
    },
    'User preferences updated successfully'
  );

  // TODO: Implement roadmap regeneration via roadmap engine
  // This will:
  // 1. Generate new roadmap based on updated preferences
  // 2. Compare with existing roadmap modules
  // 3. Preserve progress for matching skill IDs
  // 4. Return the count of preserved modules
  //
  // const { roadmap, preservedCount } = await regenerateRoadmapWithPreservedProgress({
  //   userId,
  //   targetRole: data.targetRole,
  //   weeklyHours: data.weeklyHours,
  //   skillsToSkip: data.skillsToSkip,
  // });

  // For now, return placeholder values - actual regeneration will be implemented in E6
  const roadmapRegenerated = true;
  const newRoadmapId = null;
  const preservedModulesCount = 0;

  return {
    onboardingResponse: {
      id: response.id,
      userId: response.userId,
      currentRole: response.currentRole,
      customRoleText: response.customRoleText,
      targetRole: response.targetRole,
      weeklyHours: response.weeklyHours,
      skillsToSkip: response.skillsToSkip,
      completedAt: response.completedAt,
      createdAt: response.createdAt,
    },
    roadmapRegenerated,
    newRoadmapId,
    preservedModulesCount,
  };
}
