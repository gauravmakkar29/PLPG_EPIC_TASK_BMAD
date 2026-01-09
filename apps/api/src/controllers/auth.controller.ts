/**
 * @fileoverview Authentication controller module.
 * Handles HTTP requests for authentication endpoints.
 *
 * @module @plpg/api/controllers/auth
 * @description Request handlers for user authentication flows.
 */

import type { Request, Response, NextFunction } from 'express';
import type { RegisterInput } from '@plpg/shared/validation';
import { registerUser } from '../services';
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
