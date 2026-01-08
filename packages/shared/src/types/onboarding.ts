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
 */
export type CurrentRole =
  | 'backend_developer'
  | 'frontend_developer'
  | 'fullstack_developer'
  | 'data_analyst'
  | 'devops_engineer'
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
 * Weekly hours commitment options.
 *
 * @constant WeeklyHoursOption
 * @description Predefined weekly time commitment options.
 */
export type WeeklyHoursOption = 5 | 10 | 15 | 20;

/**
 * Onboarding step data for step 1 (current role).
 *
 * @interface OnboardingStep1Data
 */
export interface OnboardingStep1Data {
  currentRole: CurrentRole;
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
