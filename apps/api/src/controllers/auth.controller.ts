/**
 * @fileoverview Authentication controller module.
 * Handles HTTP requests for authentication endpoints.
 *
 * @module @plpg/api/controllers/auth
 * @description Request handlers for user authentication flows.
 */

import type { Request, Response, NextFunction } from 'express';
import type { RegisterInput } from '@plpg/shared/validation';
import { AuthenticationError } from '@plpg/shared';
import { registerUser, getCurrentSession } from '../services';
import { logger } from '../lib/logger';

/**
 * Request body type for registration endpoint.
 *
 * @typedef {Request<unknown, unknown, RegisterInput>} RegisterRequest
 */
type RegisterRequest = Request<unknown, unknown, RegisterInput>;

/**
 * Handles user registration requests.
 *
 * Creates a new user account with hashed password, sets up trial period,
 * and returns JWT tokens for immediate authentication.
 *
 * @function register
 * @param {RegisterRequest} req - Express request with registration data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>}
 *
 * @route POST /api/v1/auth/register
 *
 * @requestBody
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "name": "John Doe"
 * }
 *
 * @response 201 - Created
 * {
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "avatarUrl": null,
 *     "role": "free",
 *     "isVerified": false,
 *     "createdAt": "2026-01-09T00:00:00.000Z"
 *   },
 *   "accessToken": "jwt.access.token",
 *   "refreshToken": "jwt.refresh.token"
 * }
 *
 * @response 400 - Validation Error
 * @response 409 - Conflict (email already exists)
 *
 * @example
 * // Express route usage
 * router.post('/register', validate({ body: registerSchema }), register);
 */
export async function register(
  req: RegisterRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.debug({ email: req.body.email }, 'Processing registration request');

    const result = await registerUser(req.body);

    logger.info(
      { userId: result.user.id, email: result.user.email },
      'User registered successfully'
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Gets the current authenticated user's session information.
 *
 * Returns user data including subscription status and trial information.
 * Requires authentication via JWT token.
 *
 * @function getMe
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>}
 *
 * @route GET /api/v1/auth/me
 *
 * @header Authorization - Bearer token (required)
 *
 * @response 200 - Success
 * {
 *   "userId": "uuid",
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "subscriptionStatus": "active",
 *   "trialEndsAt": "2026-01-23T00:00:00.000Z",
 *   "isVerified": false,
 *   "role": "free"
 * }
 *
 * @response 401 - Unauthorized (no token or invalid token)
 *
 * @example
 * // Express route usage
 * router.get('/me', jwtMiddleware, requireAuth, getMe);
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User should be set by jwtMiddleware + requireAuth
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    logger.debug({ userId: req.user.id }, 'Getting current session');

    const session = getCurrentSession(req.user);

    logger.debug({ userId: session.userId }, 'Session retrieved successfully');

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
}
