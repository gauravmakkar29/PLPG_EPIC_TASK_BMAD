/**
 * @fileoverview Validation barrel file for PLPG shared package.
 * Re-exports all Zod validation schemas.
 *
 * @module @plpg/shared/validation
 * @description Central export point for all validation schemas.
 */

// Auth validation schemas
export {
  emailSchema,
  passwordSchema,
  nameSchema,
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
  type LoginInput,
  type RegisterInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from './auth.schema';

// Onboarding validation schemas
export {
  currentRoleValues,
  targetRoleValues,
  weeklyHoursValues,
  currentRoleSchema,
  targetRoleSchema,
  weeklyHoursSchema,
  weeklyHoursNumberSchema,
  skillsToSkipSchema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
  completeOnboardingSchema,
  type OnboardingStep1Input,
  type OnboardingStep2Input,
  type OnboardingStep3Input,
  type OnboardingStep4Input,
  type CompleteOnboardingInput,
} from './onboarding.schema';

// Progress validation schemas
export {
  moduleIdSchema,
  timeSpentSchema,
  startModuleSchema,
  completeModuleSchema,
  updateProgressSchema,
  ratingSchema,
  createFeedbackSchema,
  checkInTypeSchema,
  createCheckInSchema,
  recalculateRoadmapSchema,
  type StartModuleInput,
  type CompleteModuleInput,
  type UpdateProgressInput,
  type CreateFeedbackInput,
  type CreateCheckInInput,
  type RecalculateRoadmapInput,
} from './progress.schema';
