/**
 * @fileoverview Main entry point for PLPG shared package.
 * Re-exports all types, validation schemas, constants, and utilities.
 *
 * @module @plpg/shared
 * @description Shared types, validation, constants, and utilities for PLPG.
 *
 * @example
 * // Import types
 * import type { User, Roadmap, Skill } from '@plpg/shared';
 *
 * // Import validation schemas (use subpath to avoid naming conflicts)
 * import { loginSchema, registerSchema } from '@plpg/shared/validation';
 *
 * // Import constants
 * import { PHASE_NAMES, PLAN_CONFIGS } from '@plpg/shared/constants';
 *
 * // Import utilities
 * import { formatHours, formatDateDisplay } from '@plpg/shared/utils';
 */

// Re-export all types
export * from './types';

// Re-export validation schemas (excluding types that conflict with types/index.ts)
// For full validation exports, use '@plpg/shared/validation' subpath
export {
  // Auth schemas
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
  // Onboarding schemas
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
  // Progress schemas
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
} from './validation';

// Re-export all constants
export * from './constants';

// Re-export all utilities
export * from './utils';
