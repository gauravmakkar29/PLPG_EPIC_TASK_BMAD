/**
 * @fileoverview Zod validation schemas for progress tracking.
 * Defines validation for progress-related requests.
 *
 * @module @plpg/shared/validation/progress.schema
 * @description Progress tracking validation schemas.
 */

import { z } from 'zod';

/**
 * Module ID validation schema.
 *
 * @schema moduleIdSchema
 * @description Validates module ID parameter.
 */
export const moduleIdSchema = z.string().uuid('Invalid module ID');

/**
 * Time spent validation schema.
 *
 * @schema timeSpentSchema
 * @description Validates time spent in minutes.
 */
export const timeSpentSchema = z
  .number()
  .int('Time must be a whole number')
  .min(0, 'Time cannot be negative')
  .max(60 * 24, 'Time cannot exceed 24 hours');

/**
 * Start module request validation schema.
 *
 * @schema startModuleSchema
 * @description Validates start module request.
 */
export const startModuleSchema = z.object({
  moduleId: moduleIdSchema,
});

/**
 * Complete module request validation schema.
 *
 * @schema completeModuleSchema
 * @description Validates complete module request.
 */
export const completeModuleSchema = z.object({
  moduleId: moduleIdSchema,
  timeSpentMinutes: timeSpentSchema.optional(),
});

/**
 * Update progress request validation schema.
 *
 * @schema updateProgressSchema
 * @description Validates progress update request.
 */
export const updateProgressSchema = z.object({
  timeSpentMinutes: timeSpentSchema.optional(),
});

/**
 * Feedback rating validation schema.
 *
 * @schema ratingSchema
 * @description Validates feedback rating (1-5).
 */
export const ratingSchema = z
  .number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be at least 1')
  .max(5, 'Rating must be at most 5');

/**
 * Create feedback request validation schema.
 *
 * @schema createFeedbackSchema
 * @description Validates feedback submission request.
 */
export const createFeedbackSchema = z.object({
  moduleId: moduleIdSchema,
  rating: ratingSchema,
  comment: z
    .string()
    .max(1000, 'Comment must be at most 1000 characters')
    .optional(),
});

/**
 * Check-in type validation schema.
 *
 * @schema checkInTypeSchema
 * @description Validates check-in type.
 */
export const checkInTypeSchema = z.enum(['daily', 'weekly', 'milestone'], {
  errorMap: () => ({ message: 'Invalid check-in type' }),
});

/**
 * Create check-in request validation schema.
 *
 * @schema createCheckInSchema
 * @description Validates check-in request.
 */
export const createCheckInSchema = z.object({
  type: checkInTypeSchema.optional().default('daily'),
  metadata: z
    .object({
      moduleId: z.string().uuid().optional(),
      milestoneType: z.string().optional(),
      notes: z.string().max(500).optional(),
    })
    .optional(),
});

/**
 * Recalculate roadmap request validation schema.
 *
 * @schema recalculateRoadmapSchema
 * @description Validates roadmap recalculation request.
 */
export const recalculateRoadmapSchema = z.object({
  weeklyHours: z
    .number()
    .int()
    .min(1, 'Weekly hours must be at least 1')
    .max(40, 'Weekly hours cannot exceed 40')
    .optional(),
  adjustForProgress: z.boolean().optional().default(true),
});

// Type exports inferred from schemas
export type StartModuleInput = z.infer<typeof startModuleSchema>;
export type CompleteModuleInput = z.infer<typeof completeModuleSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
export type RecalculateRoadmapInput = z.infer<typeof recalculateRoadmapSchema>;
