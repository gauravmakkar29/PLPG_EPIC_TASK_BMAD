/**
 * @fileoverview Authentication controller for PLPG API.
 * Handles login, logout, and token refresh endpoints.
 *
 * @module @plpg/api/controllers/auth
 * @description HTTP handlers for authentication endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import { loginUser, registerUser } from '../services/auth.service';
import { AuthenticationError, loginSchema } from '@plpg/shared';
import { logger } from '../lib/logger';
import type { RegisterInput } from '@plpg/shared/validation';

/**
 * Login endpoint handler.
 * Authenticates user with email and password.
 *
 * @route POST /api/v1/auth/login
 * @param req - Express request with login credentials
 * @param res - Express response
 * @param next - Express next function
 *
 * @description
 * Request body:
 * - email: string - User's email address
 * - password: string - User's password
 *
 * Response (200 OK):
 * - user: AuthUser - User profile data
 * - accessToken: string - JWT access token
 * - refreshToken: string - JWT refresh token
 * - subscriptionStatus: 'free' | 'trial' | 'pro'
 *
 * Error responses:
 * - 400 Bad Request: Invalid request body
 * - 401 Unauthorized: Invalid credentials
 * - 429 Too Many Requests: Rate limit exceeded
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.errors[0]?.message || 'Invalid request data';
      next(new AuthenticationError(errorMessage));
      return;
    }

    const { email, password } = parseResult.data;

    // Attempt login
    const result = await loginUser(email, password);

    if (!result) {
      // Generic error message to prevent user enumeration
      logger.debug({ email }, 'Failed login attempt');
      next(new AuthenticationError('Invalid email or password'));
      return;
    }

    // Return successful login response
    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      subscriptionStatus: result.subscriptionStatus,
    });
  } catch (error) {
    logger.error({ error }, 'Error in login controller');
    next(error);
  }
}

/**
 * @fileoverview Authentication controller module.
 * Handles HTTP requests for authentication endpoints.
 *
 * @module @plpg/api/controllers/auth
 * @description Request handlers for user authentication flows.
 */

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
