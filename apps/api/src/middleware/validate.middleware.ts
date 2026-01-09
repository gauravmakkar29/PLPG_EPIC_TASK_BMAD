/**
 * @fileoverview Request validation middleware using Zod schemas.
 * Validates request body, query, and params against Zod schemas.
 *
 * @module @plpg/api/middleware/validate
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validation target specifying which part of the request to validate.
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation schema configuration.
 */
export interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Format Zod validation errors into a user-friendly structure.
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'value';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Creates a validation middleware for the specified schemas.
 *
 * @param config - Validation configuration with schemas for body, query, and/or params
 * @returns Express middleware function
 *
 * @example
 * router.post('/users', validate({ body: createUserSchema }), createUser);
 * router.get('/users/:id', validate({ params: userIdSchema }), getUser);
 */
export function validate(config: ValidationConfig) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors: Record<string, Record<string, string[]>> = {};

    // Validate body
    if (config.body) {
      const result = config.body.safeParse(req.body);
      if (!result.success) {
        errors.body = formatZodErrors(result.error);
      } else {
        req.body = result.data;
      }
    }

    // Validate query
    if (config.query) {
      const result = config.query.safeParse(req.query);
      if (!result.success) {
        errors.query = formatZodErrors(result.error);
      } else {
        req.query = result.data;
      }
    }

    // Validate params
    if (config.params) {
      const result = config.params.safeParse(req.params);
      if (!result.success) {
        errors.params = formatZodErrors(result.error);
      } else {
        req.params = result.data;
      }
    }

    // If there are validation errors, return 400
    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details: errors,
      });
      return;
    }

    next();
  };
}
