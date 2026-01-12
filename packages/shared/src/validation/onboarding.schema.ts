/**
 * @fileoverview Zod validation schemas for onboarding.
 * Defines validation for onboarding flow requests.
 *
 * @module @plpg/shared/validation/onboarding.schema
 * @description Onboarding validation schemas.
 */

import { z } from 'zod';

/**
 * Current role options.
 * Valid values for user's current job role.
 * Aligned with Jira Story AIRE-234 requirements.
 */
export const currentRoleValues = [
  'backend_developer',
  'devops_engineer',
  'data_analyst',
  'qa_engineer',
  'it_professional',
  'other',
] as const;

/**
 * Target role options.
 * Valid values for user's target career role.
 */
export const targetRoleValues = [
  'ml_engineer',
  'data_scientist',
  'mlops_engineer',
  'ai_engineer',
] as const;

/**
 * Weekly hours configuration constants.
 * Defines the valid range for weekly time commitment.
 *
 * @requirement AIRE-236 - Slider input for hours (range: 5-20, step: 1)
 */
export const WEEKLY_HOURS_MIN = 5;
export const WEEKLY_HOURS_MAX = 20;
export const WEEKLY_HOURS_DEFAULT = 10;
export const WEEKLY_HOURS_STEP = 1;
export const WEEKLY_HOURS_RECOMMENDED_MIN = 10;
export const WEEKLY_HOURS_RECOMMENDED_MAX = 15;

/**
 * Legacy weekly hours options.
 * Kept for backward compatibility with existing code.
 * @deprecated Use WEEKLY_HOURS_MIN/MAX for range validation
 */
export const weeklyHoursValues = [5, 10, 15, 20] as const;

/**
 * Current role validation schema.
 *
 * @schema currentRoleSchema
 * @description Validates current role selection.
 */
export const currentRoleSchema = z.enum(currentRoleValues, {
  errorMap: () => ({ message: 'Please select a valid current role' }),
});

/**
 * Target role validation schema.
 *
 * @schema targetRoleSchema
 * @description Validates target role selection.
 */
export const targetRoleSchema = z.enum(targetRoleValues, {
  errorMap: () => ({ message: 'Please select a valid target role' }),
});

/**
 * Weekly hours validation schema (string input).
 * Accepts string input and transforms to number.
 *
 * @schema weeklyHoursSchema
 * @description Validates weekly hours selection from string input.
 * @requirement AIRE-236 - Slider input for hours (range: 5-20, step: 1)
 */
export const weeklyHoursSchema = z
  .string()
  .transform((val) => parseInt(val, 10))
  .refine(
    (val) => !isNaN(val) && val >= WEEKLY_HOURS_MIN && val <= WEEKLY_HOURS_MAX,
    {
      message: `Weekly hours must be between ${WEEKLY_HOURS_MIN} and ${WEEKLY_HOURS_MAX}`,
    }
  );

/**
 * Weekly hours validation schema accepting numbers directly.
 * Primary schema for slider input validation.
 *
 * @schema weeklyHoursNumberSchema
 * @description Validates weekly hours as integer within valid range.
 * @requirement AIRE-236 - Slider input for hours (range: 5-20, step: 1)
 */
export const weeklyHoursNumberSchema = z
  .number()
  .int('Weekly hours must be a whole number')
  .min(WEEKLY_HOURS_MIN, `Weekly hours must be at least ${WEEKLY_HOURS_MIN}`)
  .max(WEEKLY_HOURS_MAX, `Weekly hours cannot exceed ${WEEKLY_HOURS_MAX}`);

/**
 * Skills to skip validation schema.
 *
 * @schema skillsToSkipSchema
 * @description Validates array of skill IDs to skip.
 */
export const skillsToSkipSchema = z
  .array(z.string().uuid('Invalid skill ID'))
  .default([]);

/**
 * Custom role text validation schema.
 * Required when 'other' role is selected.
 *
 * @schema customRoleTextSchema
 * @description Validates the custom role text input.
 */
export const customRoleTextSchema = z
  .string()
  .min(2, 'Custom role must be at least 2 characters')
  .max(100, 'Custom role must be at most 100 characters')
  .optional();

/**
 * Onboarding step 1 validation schema.
 * Includes custom role text validation when 'other' is selected.
 *
 * @schema onboardingStep1Schema
 * @description Validates step 1 (current role) submission.
 */
export const onboardingStep1Schema = z
  .object({
    currentRole: currentRoleSchema,
    customRoleText: customRoleTextSchema,
  })
  .refine(
    (data) => {
      // If 'other' is selected, customRoleText must be provided
      if (data.currentRole === 'other') {
        return data.customRoleText && data.customRoleText.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Please specify your role when selecting "Other"',
      path: ['customRoleText'],
    }
  );

/**
 * Onboarding step 2 validation schema.
 *
 * @schema onboardingStep2Schema
 * @description Validates step 2 (target role) submission.
 */
export const onboardingStep2Schema = z.object({
  targetRole: targetRoleSchema,
});

/**
 * Onboarding step 3 validation schema.
 *
 * @schema onboardingStep3Schema
 * @description Validates step 3 (weekly hours) submission.
 */
export const onboardingStep3Schema = z.object({
  weeklyHours: weeklyHoursNumberSchema,
});

/**
 * Onboarding step 4 validation schema.
 *
 * @schema onboardingStep4Schema
 * @description Validates step 4 (skills assessment) submission.
 */
export const onboardingStep4Schema = z.object({
  skillsToSkip: skillsToSkipSchema,
});

/**
 * Complete onboarding validation schema.
 *
 * @schema completeOnboardingSchema
 * @description Validates complete onboarding submission.
 */
export const completeOnboardingSchema = z.object({
  currentRole: currentRoleSchema,
  targetRole: targetRoleSchema,
  weeklyHours: weeklyHoursNumberSchema,
  skillsToSkip: skillsToSkipSchema,
});

/**
 * Update preferences validation schema.
 * Used for re-onboarding / editing preferences after initial onboarding.
 *
 * @schema updatePreferencesSchema
 * @description Validates the complete preferences update request.
 * Includes all onboarding fields plus custom role validation.
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 * - All fields required for preference update
 * - Custom role text required when 'other' is selected
 */
export const updatePreferencesSchema = z
  .object({
    currentRole: currentRoleSchema,
    customRoleText: customRoleTextSchema,
    targetRole: targetRoleSchema,
    weeklyHours: weeklyHoursNumberSchema,
    skillsToSkip: skillsToSkipSchema,
  })
  .refine(
    (data) => {
      // If 'other' is selected, customRoleText must be provided
      if (data.currentRole === 'other') {
        return data.customRoleText && data.customRoleText.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Please specify your role when selecting "Other"',
      path: ['customRoleText'],
    }
  );

// Type exports inferred from schemas
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4Input = z.infer<typeof onboardingStep4Schema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
