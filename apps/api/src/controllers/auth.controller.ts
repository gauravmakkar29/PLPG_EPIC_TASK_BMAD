/**
 * @fileoverview Authentication controller for PLPG API.
 * Handles login, logout, and token refresh endpoints.
 *
 * @module @plpg/api/controllers/auth
 * @description HTTP handlers for authentication endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import { loginUser } from '../services/auth.service';
import { AuthenticationError, loginSchema } from '@plpg/shared';
import { logger } from '../lib/logger';

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
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid request data';
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
