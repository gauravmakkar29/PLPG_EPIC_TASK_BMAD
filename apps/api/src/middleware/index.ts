/**
 * @fileoverview Barrel export for all middleware.
 *
 * @module @plpg/api/middleware
 * @description Central export point for all API middleware functions.
 */

// Logging middleware
export { loggerMiddleware } from './logger.middleware';

// Rate limiting middleware
export { rateLimiter, authRateLimiter } from './rateLimiter.middleware';

// Validation middleware
export { validate } from './validate.middleware';
export type { ValidationConfig, ValidationTarget } from './validate.middleware';

// Error handling middleware
export { errorHandler } from './errorHandler.middleware';
export { notFoundHandler } from './notFound.middleware';

// Authentication and authorization middleware
export {
  jwtMiddleware,
  requireAuth,
  requirePro,
  requirePhaseAccess,
  requirePhaseAccessByName,
} from './auth.middleware';
