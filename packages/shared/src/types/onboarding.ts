/**
 * @fileoverview Onboarding entity type definitions for PLPG.
 * Defines the onboarding flow data structures.
 *
 * @module @plpg/shared/types/onboarding
 * @description Onboarding domain types for user setup flow.
 */

/**
 * Onboarding response entity storing user's onboarding answers.
 *
 * @interface OnboardingResponse
 * @description Captures user's career transition preferences and constraints.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} userId - Reference to user
 * @property {string} currentRole - User's current job role
 * @property {string | null} customRoleText - Custom role description when 'other' is selected
 * @property {string} targetRole - Desired target role
 * @property {number} weeklyHours - Hours available per week for learning
 * @property {string[]} skillsToSkip - Skill IDs to exclude from roadmap
 * @property {Date | null} completedAt - When onboarding was completed
 * @property {Date} createdAt - Record creation timestamp
 */
export interface OnboardingResponse {
  id: string;
  userId: string;
  currentRole: string;
  customRoleText: string | null;
  targetRole: string;
  weeklyHours: number;
  skillsToSkip: string[];
  completedAt: Date | null;
  createdAt: Date;
}

/**
 * Available current roles for onboarding selection.
 *
 * @constant CurrentRole
 * @description Predefined roles users can select as their current position.
 * Aligned with Jira Story AIRE-234 requirements.
 */
export type CurrentRole =
  | 'backend_developer'
  | 'devops_engineer'
  | 'data_analyst'
  | 'qa_engineer'
  | 'it_professional'
  | 'other';

/**
 * Available target roles for career transition.
 *
 * @constant TargetRole
 * @description Predefined target roles for learning paths.
 */
export type TargetRole =
  | 'ml_engineer'
  | 'data_scientist'
  | 'mlops_engineer'
  | 'ai_engineer';

/**
 * Weekly hours commitment type.
 * Supports any integer value from 5 to 20 hours per week.
 *
 * @constant WeeklyHoursOption
 * @description Weekly time commitment value (5-20 hours).
 * @requirement AIRE-236 - Slider input for hours (range: 5-20, step: 1)
 */
export type WeeklyHoursOption = number;

/**
 * Onboarding step data for step 1 (current role).
 *
 * @interface OnboardingStep1Data
 * @property {CurrentRole} currentRole - Selected role from predefined options
 * @property {string} [customRoleText] - Custom role description when 'other' is selected
 */
export interface OnboardingStep1Data {
  currentRole: CurrentRole;
  customRoleText?: string;
}

/**
 * Onboarding step data for step 2 (target role).
 *
 * @interface OnboardingStep2Data
 */
export interface OnboardingStep2Data {
  targetRole: TargetRole;
}

/**
 * Onboarding step data for step 3 (weekly hours).
 *
 * @interface OnboardingStep3Data
 */
export interface OnboardingStep3Data {
  weeklyHours: WeeklyHoursOption;
}

/**
 * Onboarding step data for step 4 (skills assessment).
 *
 * @interface OnboardingStep4Data
 */
export interface OnboardingStep4Data {
  skillsToSkip: string[];
}

/**
 * Complete onboarding submission data.
 *
 * @interface CompleteOnboardingInput
 * @description Full onboarding data required to generate roadmap.
 */
export interface CompleteOnboardingInput {
  currentRole: CurrentRole;
  targetRole: TargetRole;
  weeklyHours: WeeklyHoursOption;
  skillsToSkip: string[];
}

/**
 * Onboarding status response.
 *
 * @interface OnboardingStatus
 * @description Current state of user's onboarding progress.
 */
export interface OnboardingStatus {
  isComplete: boolean;
  currentStep: number;
  totalSteps: number;
  response: OnboardingResponse | null;
}

/**
 * Update preferences input for re-onboarding.
 *
 * @interface UpdatePreferencesInput
 * @description Input for updating user's onboarding preferences.
 * Used when an existing user wants to modify their learning path preferences.
 *
 * @property {CurrentRole} currentRole - User's updated current role
 * @property {string} [customRoleText] - Custom role description when 'other' is selected
 * @property {TargetRole} targetRole - User's updated target career role
 * @property {WeeklyHoursOption} weeklyHours - Updated weekly time commitment
 * @property {string[]} skillsToSkip - Updated array of skill IDs to exclude
 */
export interface UpdatePreferencesInput {
  currentRole: CurrentRole;
  customRoleText?: string;
  targetRole: TargetRole;
  weeklyHours: WeeklyHoursOption;
  skillsToSkip: string[];
}

/**
 * Result of updating preferences.
 *
 * @interface UpdatePreferencesResult
 * @description Contains the updated onboarding response and regeneration status.
 *
 * @property {OnboardingResponse} onboardingResponse - Updated onboarding data
 * @property {boolean} roadmapRegenerated - Whether a new roadmap was generated
 * @property {string | null} newRoadmapId - ID of the new roadmap if regenerated
 * @property {number} preservedModulesCount - Count of modules with preserved progress
 */
export interface UpdatePreferencesResult {
  onboardingResponse: OnboardingResponse;
  roadmapRegenerated: boolean;
  newRoadmapId: string | null;
  preservedModulesCount: number;
}
