/**
 * @fileoverview Onboarding service for API interactions.
 * Provides type-safe methods for all onboarding-related API calls.
 *
 * @module @plpg/web/services/onboarding.service
 *
 * @description
 * This service encapsulates all onboarding API interactions including:
 * - Getting onboarding status
 * - Updating preferences (re-onboarding)
 * - Completing onboarding
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 */

import { api, getErrorMessage } from '../lib/api';

import type {
  OnboardingStatus,
  OnboardingResponse,
  UpdatePreferencesResult,
  CurrentRole,
  TargetRole,
} from '@plpg/shared';

/**
 * Get onboarding status API response.
 *
 * @interface GetOnboardingStatusResponse
 * @property {OnboardingStatus} data - The onboarding status data
 */
export interface GetOnboardingStatusResponse {
  isComplete: boolean;
  currentStep: number;
  totalSteps: number;
  response: OnboardingResponse | null;
}

/**
 * Update preferences input.
 *
 * @interface UpdatePreferencesInput
 * @property {CurrentRole} currentRole - The user's current role
 * @property {string} [customRoleText] - Custom role text when 'other' is selected
 * @property {TargetRole} targetRole - The user's target role
 * @property {number} weeklyHours - Weekly time commitment (5-20)
 * @property {string[]} skillsToSkip - Array of skill IDs to skip
 */
export interface UpdatePreferencesInput {
  currentRole: CurrentRole;
  customRoleText?: string;
  targetRole: TargetRole;
  weeklyHours: number;
  skillsToSkip: string[];
}

/**
 * Update preferences API response.
 *
 * @interface UpdatePreferencesResponse
 * @property {boolean} success - Whether the update was successful
 * @property {UpdatePreferencesResult} data - The update result data
 */
export interface UpdatePreferencesResponse {
  success: boolean;
  data: UpdatePreferencesResult;
}

/**
 * Fetches the current user's onboarding status.
 *
 * @returns {Promise<OnboardingStatus>} The onboarding status
 * @throws {Error} If the request fails
 *
 * @example
 * ```ts
 * const status = await getOnboardingStatus();
 * if (!status.isComplete) {
 *   // Redirect to onboarding
 * }
 * ```
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    const response = await api.get<GetOnboardingStatusResponse>('/v1/onboarding');
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Failed to get onboarding status');
  }
}

/**
 * Updates the user's onboarding preferences.
 * Used for re-onboarding when user wants to modify their learning path.
 *
 * @param {UpdatePreferencesInput} input - The new preference values
 * @returns {Promise<UpdatePreferencesResult>} The update result
 * @throws {Error} If the request fails
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 * - Pre-filled with current selections
 * - New roadmap generated on confirmation
 * - Existing progress retained for matching modules
 *
 * @example
 * ```ts
 * const result = await updatePreferences({
 *   currentRole: 'backend_developer',
 *   targetRole: 'ml_engineer',
 *   weeklyHours: 15,
 *   skillsToSkip: ['skill-1', 'skill-2'],
 * });
 *
 * if (result.roadmapRegenerated) {
 *   console.log(`New roadmap: ${result.newRoadmapId}`);
 *   console.log(`Preserved ${result.preservedModulesCount} modules`);
 * }
 * ```
 */
export async function updatePreferences(
  input: UpdatePreferencesInput
): Promise<UpdatePreferencesResult> {
  try {
    const response = await api.put<UpdatePreferencesResponse>(
      '/v1/onboarding/preferences',
      input
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Failed to update preferences');
  }
}

/**
 * Gets the user's current onboarding response (preferences).
 * Used to pre-fill the edit preferences form.
 *
 * @returns {Promise<OnboardingResponse | null>} The current preferences or null
 * @throws {Error} If the request fails
 *
 * @example
 * ```ts
 * const preferences = await getCurrentPreferences();
 * if (preferences) {
 *   // Pre-fill form with preferences
 *   setCurrentRole(preferences.currentRole);
 * }
 * ```
 */
export async function getCurrentPreferences(): Promise<OnboardingResponse | null> {
  try {
    const status = await getOnboardingStatus();
    return status.response;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message || 'Failed to get current preferences');
  }
}
