/**
 * @fileoverview Onboarding components barrel export.
 * Centralizes exports for all onboarding-related components.
 *
 * @module @plpg/web/components/onboarding
 * @description Exports for onboarding flow components.
 */

export { Step1CurrentRole } from './Step1CurrentRole';
export { Step2TargetRole } from './Step2TargetRole';
export type { Step2TargetRoleProps } from './Step2TargetRole';
export { Step3WeeklyTime } from './Step3WeeklyTime';
export type { Step3WeeklyTimeProps } from './Step3WeeklyTime';
export {
  calculateCompletionWeeks,
  formatDuration,
  isInRecommendedRange,
  calculateSliderPercentage,
} from './Step3WeeklyTime';
export { Step4ExistingSkills } from './Step4ExistingSkills';
export type { Step4ExistingSkillsProps } from './Step4ExistingSkills';
export {
  getSelectionStatusText,
  calculateTimeSaved,
  formatTimeSaved,
} from './Step4ExistingSkills';
export { OnboardingWelcome } from './OnboardingWelcome';
export type { OnboardingWelcomeProps } from './OnboardingWelcome';
