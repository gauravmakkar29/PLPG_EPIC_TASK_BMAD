/**
 * @fileoverview Authentication controller for PLPG API.
 * Handles login, logout, registration, and session endpoints.
 *
 * @module @plpg/api/controllers/auth
 * @description HTTP handlers for authentication endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import type { RegisterInput } from '@plpg/shared/validation';
import { AuthenticationError, loginSchema } from '@plpg/shared';
import { loginUser, registerUser, getCurrentSession } from '../services/auth.service';
import { logger } from '../lib/logger';

/**
 * Request body type for registration endpoint.
 */
type RegisterRequest = Request<unknown, unknown, RegisterInput>;

/**
 * Login endpoint handler.
 * Authenticates user with email and password.
 *
 * @route POST /api/v1/auth/login
 * @param req - Express request with login credentials
 * @param res - Express response
 * @param next - Express next function
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
