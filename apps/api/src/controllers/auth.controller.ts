/**
 * @fileoverview Authentication controller.
 * Handles user authentication, registration, and token management.
 * Implements security best practices including rate limiting awareness,
 * generic error messages, and secure session management.
 *
 * @module @plpg/api/controllers/auth
 */

import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { loginSchema, registerSchema } from '@plpg/shared/validation';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiry,
} from '../lib/jwt';

/**
 * Login request body structure.
 *
 * @interface LoginRequest
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {boolean} [rememberMe] - Whether to extend session duration
 */
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register request body structure.
 *
 * @interface RegisterRequest
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {string} name - User's display name
 */
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Refresh token request body structure.
 *
 * @interface RefreshTokenRequest
 * @property {string} refreshToken - JWT refresh token
 */
interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Authenticates a user with email and password.
 * Returns access and refresh tokens on success.
 *
 * Security Features:
 * - Password comparison using bcrypt
 * - Generic error messages to prevent user enumeration
 * - Rate limiting enforced by middleware
 * - Support for extended sessions via remember me
 *
 * @route POST /api/v1/auth/login
 * @access Public
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 *
 * @throws {400} Invalid request body
 * @throws {401} Invalid credentials or account locked
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: 'Invalid request body',
        errors: validation.error.errors,
      });
      return;
    }

    const { email, password, rememberMe } = req.body as LoginRequest;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Generic error message for security (prevents user enumeration)
    const genericError = 'Invalid email or password';

    if (!user) {
      logger.warn({ email }, 'Login attempt with non-existent email');
      res.status(401).json({ message: genericError });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(
        { userId: user.id, email },
        'Login attempt with invalid password'
      );
      res.status(401).json({ message: genericError });
      return;
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload, rememberMe);
    const refreshToken = generateRefreshToken(payload, rememberMe);

    // Calculate expiration time
    const refreshExpiry = getTokenExpiry('refresh', rememberMe);
    const expiresAt = new Date(Date.now() + refreshExpiry * 1000);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Clean up expired refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Determine redirect path based on onboarding status
    const onboarding = await prisma.onboardingResponse.findUnique({
      where: { userId: user.id },
    });

    const redirectPath = !onboarding?.completedAt
      ? '/onboarding'
      : '/dashboard';

    logger.info(
      { userId: user.id, email: user.email },
      'User logged in successfully'
    );

    // Return tokens and user data
    res.status(200).json({
      accessToken,
      refreshToken,
      expiresIn: getTokenExpiry('access', rememberMe),
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
      },
      redirectPath,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Registers a new user account.
 * Creates user, generates tokens, and returns authentication data.
 *
 * Security Features:
 * - Password hashing using bcrypt (10 rounds)
 * - Duplicate email detection
 * - Input validation via Zod schemas
 *
 * @route POST /api/v1/auth/register
 * @access Public
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 *
 * @throws {400} Invalid request body or email already exists
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: 'Invalid request body',
        errors: validation.error.errors,
      });
      return;
    }

    const { email, password, name } = req.body as RegisterRequest;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(400).json({
        message: 'Email address is already registered',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role: 'free',
        emailVerified: false,
      },
    });

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Calculate expiration time
    const refreshExpiry = getTokenExpiry('refresh');
    const expiresAt = new Date(Date.now() + refreshExpiry * 1000);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    logger.info(
      { userId: user.id, email: user.email },
      'User registered successfully'
    );

    // Return tokens and user data
    res.status(201).json({
      accessToken,
      refreshToken,
      expiresIn: getTokenExpiry('access'),
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
      },
      emailVerificationRequired: !user.emailVerified,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refreshes access token using a valid refresh token.
 * Generates new access token and optionally new refresh token.
 *
 * @route POST /api/v1/auth/refresh
 * @access Public
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 *
 * @throws {400} Invalid request body
 * @throws {401} Invalid or expired refresh token
 */
export async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (_error) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Generate new access token
    const newPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Update refresh token in database
    const refreshExpiry = getTokenExpiry('refresh');
    const expiresAt = new Date(Date.now() + refreshExpiry * 1000);

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt,
      },
    });

    logger.info({ userId: user.id }, 'Access token refreshed');

    // Return new tokens
    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: getTokenExpiry('access'),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logs out the current user.
 * Invalidates refresh token by removing it from the database.
 *
 * @route POST /api/v1/auth/logout
 * @access Private (requires valid access token)
 *
 * @param {Request} req - Express request object (with user from auth middleware)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    logger.info('User logged out successfully');

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}
