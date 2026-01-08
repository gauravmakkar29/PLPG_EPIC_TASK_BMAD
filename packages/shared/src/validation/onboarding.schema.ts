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
 */
export const currentRoleValues = [
  'backend_developer',
  'frontend_developer',
  'fullstack_developer',
  'data_analyst',
  'devops_engineer',
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
 * Weekly hours options.
 * Valid values for weekly time commitment.
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
 * Weekly hours validation schema.
 *
 * @schema weeklyHoursSchema
 * @description Validates weekly hours selection.
 */
export const weeklyHoursSchema = z.enum(
  weeklyHoursValues.map(String) as [string, ...string[]],
  {
    errorMap: () => ({ message: 'Please select a valid weekly hours option' }),
  }
).transform((val) => parseInt(val, 10) as 5 | 10 | 15 | 20);

/**
 * Alternative weekly hours schema accepting numbers directly.
 */
export const weeklyHoursNumberSchema = z
  .number()
  .refine((val): val is 5 | 10 | 15 | 20 => (weeklyHoursValues as readonly number[]).includes(val), {
    message: 'Weekly hours must be 5, 10, 15, or 20',
  });

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
 * Onboarding step 1 validation schema.
 *
 * @schema onboardingStep1Schema
 * @description Validates step 1 (current role) submission.
 */
export const onboardingStep1Schema = z.object({
  currentRole: currentRoleSchema,
});

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

// Type exports inferred from schemas
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4Input = z.infer<typeof onboardingStep4Schema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
