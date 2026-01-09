/**
 * @fileoverview Rate limiting middleware for API protection.
 * Prevents abuse by limiting requests per IP address.
 *
 * @module @plpg/api/middleware/rateLimiter
 */

import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter configuration.
 * Limits each IP to 100 requests per 15-minute window.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/v1/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints.
 * Limits each IP to 5 requests per 15-minute window.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
