/**
 * @fileoverview Error type definitions for PLPG.
 * Defines custom error classes for consistent error handling.
 *
 * @module @plpg/shared/types/errors
 * @description Error types for standardized error responses.
 */

/**
 * Error code enumeration.
 * Standardized error codes for API responses.
 *
 * @constant ErrorCode
 * @description Application error codes.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'SERVICE_UNAVAILABLE';

/**
 * Base application error.
 *
 * @class AppError
 * @extends Error
 * @description Base error class for all application errors.
 */
export class AppError extends Error {
  /**
   * Creates an AppError instance.
   *
   * @param {ErrorCode} code - Error code for client handling
   * @param {string} message - Human-readable error message
   * @param {number} status - HTTP status code
   * @param {Record<string, unknown>} [details] - Additional error details
   */
  constructor(
    public code: ErrorCode,
    public override message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error for invalid input.
 *
 * @class ValidationError
 * @extends AppError
 * @description Thrown when request validation fails.
 */
export class ValidationError extends AppError {
  /**
   * Creates a ValidationError instance.
   *
   * @param {Record<string, unknown>} details - Validation error details
   * @param {string} [message] - Optional custom message
   */
  constructor(details: Record<string, unknown>, message = 'Invalid request data') {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error for unauthenticated requests.
 *
 * @class AuthenticationError
 * @extends AppError
 * @description Thrown when authentication is required but missing/invalid.
 */
export class AuthenticationError extends AppError {
  /**
   * Creates an AuthenticationError instance.
   *
   * @param {string} [message] - Optional custom message
   */
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Forbidden error for unauthorized access.
 *
 * @class ForbiddenError
 * @extends AppError
 * @description Thrown when user lacks permission for an action.
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a ForbiddenError instance.
   *
   * @param {string} [message] - Optional custom message
   */
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error for missing resources.
 *
 * @class NotFoundError
 * @extends AppError
 * @description Thrown when a requested resource doesn't exist.
 */
export class NotFoundError extends AppError {
  /**
   * Creates a NotFoundError instance.
   *
   * @param {string} resource - Name of the missing resource
   */
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error for duplicate resources.
 *
 * @class ConflictError
 * @extends AppError
 * @description Thrown when a resource already exists.
 */
export class ConflictError extends AppError {
  /**
   * Creates a ConflictError instance.
   *
   * @param {string} message - Conflict description
   */
  constructor(message: string) {
    super('CONFLICT', message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error for throttled requests.
 *
 * @class RateLimitError
 * @extends AppError
 * @description Thrown when request rate limit is exceeded.
 */
export class RateLimitError extends AppError {
  /**
   * Creates a RateLimitError instance.
   *
   * @param {number} [retryAfter] - Seconds until rate limit resets
   */
  constructor(retryAfter?: number) {
    super('RATE_LIMITED', 'Too many requests', 429, retryAfter ? { retryAfter } : undefined);
    this.name = 'RateLimitError';
  }
}

/**
 * API error response structure.
 *
 * @interface ApiErrorResponse
 * @description Standardized error response format.
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
}
