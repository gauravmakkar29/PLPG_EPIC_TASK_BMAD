/**
 * @fileoverview Authentication middleware for PLPG API.
 * Provides JWT verification and authorization middleware functions.
 *
 * @module @plpg/api/middleware/auth
 * @description Middleware for handling authentication and authorization.
 *
 * @example
 * // Protect a route requiring authentication
 * router.get('/profile', requireAuth, profileController);
 *
 * // Protect a route requiring Pro subscription
 * router.get('/analytics', requireAuth, requirePro, analyticsController);
 *
 * // Protect a route with phase-specific access
 * router.get('/content/:phase', requireAuth, requirePhaseAccess(1), contentController);
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import {
  AuthenticationError,
  ForbiddenError,
  type AuthTokenPayload,
  PHASE_ORDER,
} from '@plpg/shared';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import type {
  AuthenticatedUser,
  AuthenticatedUserSubscription,
} from '../types';

/**
 * JWT secret for token verification.
 * Must be set in environment variables for production.
 *
 * @constant JWT_SECRET
 * @private
 */
const JWT_SECRET =
  process.env['JWT_SECRET'] || 'development-secret-change-in-production';

/**
 * Extracts Bearer token from Authorization header.
 *
 * @function extractBearerToken
 * @private
 * @param {string | undefined} authHeader - Authorization header value
 * @returns {string | null} Extracted token or null if not present/invalid
 *
 * @example
 * extractBearerToken('Bearer eyJhbGciOiJIUzI1NiIs...') // 'eyJhbGciOiJIUzI1NiIs...'
 * extractBearerToken('InvalidHeader') // null
 * extractBearerToken(undefined) // null
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Verifies JWT token and returns payload.
 *
 * @function verifyToken
 * @private
 * @param {string} token - JWT token to verify
 * @returns {AuthTokenPayload | null} Decoded payload or null if invalid
 *
 * @example
 * const payload = verifyToken('eyJhbGciOiJIUzI1NiIs...');
 * // { userId: '123', email: 'user@example.com', role: 'free', iat: ..., exp: ... }
 */
function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Fetches user with subscription from database.
 *
 * @function fetchUserWithSubscription
 * @private
 * @async
 * @param {string} userId - User's unique identifier
 * @returns {Promise<AuthenticatedUser | null>} User with subscription or null if not found
 *
 * @example
 * const user = await fetchUserWithSubscription('uuid-123');
 * // { id: 'uuid-123', email: 'user@example.com', role: 'free', ... }
 */
async function fetchUserWithSubscription(
  userId: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    return null;
  }

  const subscription: AuthenticatedUserSubscription | null = user.subscription
    ? {
        plan: user.subscription.plan as AuthenticatedUserSubscription['plan'],
        status: user.subscription.status,
        expiresAt: user.subscription.expiresAt,
      }
    : null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    subscription,
  };
}

/**
 * Determines the effective subscription status for authorization.
 * Maps database subscription data to authorization-friendly status.
 *
 * @function getEffectiveSubscriptionStatus
 * @private
 * @param {AuthenticatedUser} user - Authenticated user object
 * @returns {'free' | 'pro'} Effective subscription status
 *
 * @description
 * - Users with active Pro subscription get 'pro' status
 * - Users with admin role get 'pro' status
 * - All other users get 'free' status
 */
function getEffectiveSubscriptionStatus(
  user: AuthenticatedUser
): 'free' | 'pro' {
  // Admins always have pro access
  if (user.role === 'admin') {
    return 'pro';
  }

  // Check subscription
  if (user.subscription) {
    const { plan, status, expiresAt } = user.subscription;

    // Active pro subscription
    if (plan === 'pro' && status === 'active') {
      // Check if not expired
      if (!expiresAt || new Date(expiresAt) > new Date()) {
        return 'pro';
      }
    }
  }

  // Default to free
  return 'free';
}

/**
 * JWT authentication middleware (optional auth).
 * Parses and verifies JWT token from Authorization header.
 * Attaches user object to request if valid token is present.
 * Continues without user if no token or invalid token (optional auth).
 *
 * @function jwtMiddleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 *
 * @description
 * This middleware performs optional authentication:
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT signature and expiration
 * - Fetches user from database
 * - Attaches user to req.user
 * - Continues to next middleware regardless of auth status
 *
 * Use this before routes that can work with or without authentication.
 * For required authentication, use requireAuth after this middleware.
 *
 * @example
 * // Optional auth - route works with or without user
 * router.get('/public', jwtMiddleware, publicController);
 *
 * // Required auth - combine with requireAuth
 * router.get('/protected', jwtMiddleware, requireAuth, protectedController);
 */
export async function jwtMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      // No token present - continue without user (optional auth)
      next();
      return;
    }

    const payload = verifyToken(token);

    if (!payload) {
      // Invalid token - continue without user
      logger.debug('Invalid JWT token received');
      next();
      return;
    }

    // Fetch user with subscription from database
    const user = await fetchUserWithSubscription(payload.userId);

    if (!user) {
      // User not found - continue without user
      logger.debug(
        { userId: payload.userId },
        'User from JWT not found in database'
      );
      next();
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error({ error }, 'Error in JWT middleware');
    next();
  }
}

/**
 * Requires authentication middleware.
 * Ensures a valid authenticated user exists on the request.
 * Returns 401 Unauthorized if no user is present.
 *
 * @function requireAuth
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 *
 * @throws {AuthenticationError} When req.user is not present
 *
 * @description
 * This middleware should be used after jwtMiddleware.
 * It enforces that a valid user must be authenticated.
 *
 * @example
 * router.get('/profile', jwtMiddleware, requireAuth, profileController);
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new AuthenticationError('Authentication required'));
    return;
  }
  next();
}

/**
 * Requires Pro subscription middleware.
 * Ensures the authenticated user has an active Pro subscription or admin role.
 * Returns 403 Forbidden if user doesn't have Pro access.
 *
 * @function requirePro
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 *
 * @throws {ForbiddenError} When user doesn't have Pro subscription
 *
 * @description
 * This middleware should be used after requireAuth.
 * It enforces Pro subscription access.
 *
 * Access is granted if:
 * - User has admin role
 * - User has active pro subscription that hasn't expired
 *
 * @example
 * router.get('/analytics', jwtMiddleware, requireAuth, requirePro, analyticsController);
 */
export function requirePro(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user) {
    next(new AuthenticationError('Authentication required'));
    return;
  }

  const status = getEffectiveSubscriptionStatus(user);

  if (status !== 'pro') {
    next(new ForbiddenError('Pro subscription required for this feature'));
    return;
  }

  next();
}

/**
 * Creates middleware that requires access to a specific learning phase.
 * Phase 1 (Foundation) is accessible to all authenticated users.
 * Phase 2+ (Core ML, Deep Learning) requires Pro subscription.
 *
 * @function requirePhaseAccess
 * @param {number} phaseNumber - The phase number (1-indexed) to check access for
 * @returns {RequestHandler} Express middleware function
 *
 * @throws {ForbiddenError} When user doesn't have access to the specified phase
 *
 * @description
 * Phase access rules:
 * - Phase 1 (Foundation): Accessible to all authenticated users (free + pro)
 * - Phase 2 (Core ML): Requires Pro subscription
 * - Phase 3 (Deep Learning): Requires Pro subscription
 *
 * Phase mapping:
 * - 1: 'foundation'
 * - 2: 'core_ml'
 * - 3: 'deep_learning'
 *
 * @example
 * // Allow all authenticated users
 * router.get('/phase/1/content', jwtMiddleware, requireAuth, requirePhaseAccess(1), controller);
 *
 * // Require Pro subscription
 * router.get('/phase/2/content', jwtMiddleware, requireAuth, requirePhaseAccess(2), controller);
 */
export function requirePhaseAccess(phaseNumber: number): RequestHandler {
  /**
   * Phase access middleware implementation.
   *
   * @function phaseAccessMiddleware
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {void}
   */
  return function phaseAccessMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    const user = req.user;

    if (!user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    // Validate phase number
    if (phaseNumber < 1 || phaseNumber > PHASE_ORDER.length) {
      next(new ForbiddenError(`Invalid phase number: ${phaseNumber}`));
      return;
    }

    // Phase 1 (Foundation) is accessible to all authenticated users
    if (phaseNumber === 1) {
      next();
      return;
    }

    // Phase 2+ requires Pro subscription
    const status = getEffectiveSubscriptionStatus(user);

    if (status !== 'pro') {
      const phaseName = PHASE_ORDER[phaseNumber - 1];
      next(
        new ForbiddenError(
          `Pro subscription required to access ${phaseName} phase content`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Creates middleware that requires access to a specific phase by name.
 * Alternative to requirePhaseAccess that accepts phase name instead of number.
 *
 * @function requirePhaseAccessByName
 * @param {string} phaseName - The phase name ('foundation', 'core_ml', 'deep_learning')
 * @returns {RequestHandler} Express middleware function
 *
 * @throws {ForbiddenError} When phase name is invalid or user lacks access
 *
 * @description
 * Convenience function for when you have the phase name instead of number.
 * Follows the same access rules as requirePhaseAccess.
 *
 * @example
 * router.get('/phases/:name/content', requirePhaseAccessByName('core_ml'), controller);
 */
export function requirePhaseAccessByName(phaseName: string): RequestHandler {
  const phaseIndex = PHASE_ORDER.indexOf(
    phaseName as (typeof PHASE_ORDER)[number]
  );

  if (phaseIndex === -1) {
    // Return middleware that always fails for invalid phase
    return function invalidPhaseMiddleware(
      _req: Request,
      _res: Response,
      next: NextFunction
    ): void {
      next(new ForbiddenError(`Invalid phase name: ${phaseName}`));
    };
  }

  return requirePhaseAccess(phaseIndex + 1);
}
