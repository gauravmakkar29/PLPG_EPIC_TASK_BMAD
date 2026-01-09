/**
 * @fileoverview Authentication service module.
 * Handles user registration, password hashing, and token management.
 *
 * @module @plpg/api/services/auth
 * @description Core authentication business logic for PLPG.
 */

import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { RegisterInput } from '@plpg/shared/validation';
import type { AuthResponse, AuthUser, SubscriptionStatus } from '@plpg/shared';
import { ConflictError, NotFoundError } from '@plpg/shared';
import type { AuthenticatedUser } from '../types';
import { getPrisma } from '../lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_EXPIRY_MS,
  getBcryptRounds,
  getTrialDurationDays,
} from '../lib';
import { logger } from '../lib/logger';

/**
 * Bcrypt cost factor for password hashing.
 * Set to 12 as per security requirements.
 *
 * @constant BCRYPT_COST_FACTOR
 */
export const BCRYPT_COST_FACTOR = 12;

/**
 * Analytics event types for authentication flows.
 *
 * @constant AUTH_EVENTS
 */
export const AUTH_EVENTS = {
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT_COMPLETED: 'logout_completed',
} as const;

/**
 * Registration result containing user data and tokens.
 *
 * @interface RegisterResult
 * @property {AuthUser} user - Sanitized user object (no password)
 * @property {string} accessToken - JWT access token
 * @property {string} refreshToken - JWT refresh token
 */
export interface RegisterResult extends AuthResponse {}

/**
 * Hashes a password using bcrypt with the configured cost factor.
 *
 * @function hashPassword
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Bcrypt hashed password
 *
 * @example
 * const hash = await hashPassword('MySecurePassword123!');
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = getBcryptRounds();
  return bcrypt.hash(password, rounds);
}

/**
 * Compares a plain text password with a bcrypt hash.
 *
 * @function comparePassword
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Bcrypt hash to compare against
 * @returns {Promise<boolean>} True if password matches hash
 *
 * @example
 * const isValid = await comparePassword('MyPassword123!', storedHash);
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Calculates trial end date based on configuration.
 *
 * @function calculateTrialEndDate
 * @param {Date} startDate - Trial start date
 * @returns {Date} Trial end date
 *
 * @example
 * const trialEnd = calculateTrialEndDate(new Date());
 */
export function calculateTrialEndDate(startDate: Date): Date {
  const durationDays = getTrialDurationDays();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

/**
 * Transforms a database user to a sanitized AuthUser object.
 * Removes sensitive fields like passwordHash.
 *
 * @function toAuthUser
 * @param {object} user - Database user object
 * @returns {AuthUser} Sanitized user object for API responses
 */
export function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'free' | 'pro' | 'admin';
  emailVerified: boolean;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

/**
 * Tracks an authentication analytics event.
 * Currently logs to application logger; can be extended for analytics services.
 *
 * @function trackAuthEvent
 * @param {string} event - Event name to track
 * @param {object} data - Event metadata
 *
 * @example
 * trackAuthEvent('signup_completed', { userId: 'uuid-123' });
 */
export function trackAuthEvent(
  event: string,
  data: Record<string, unknown>
): void {
  logger.info({ event, ...data }, `Auth event: ${event}`);
}

/**
 * Registers a new user in the system.
 *
 * This function performs the following operations:
 * 1. Checks for existing email (uniqueness validation)
 * 2. Hashes password with bcrypt (cost factor 12)
 * 3. Creates user record with trial dates
 * 4. Creates subscription record for trial period
 * 5. Generates refresh token record
 * 6. Generates JWT access and refresh tokens
 * 7. Tracks signup_completed analytics event
 *
 * @function registerUser
 * @param {RegisterInput} input - Registration data containing email, password, and name
 * @returns {Promise<RegisterResult>} User data and authentication tokens
 * @throws {ConflictError} If email is already registered (409)
 *
 * @example
 * const result = await registerUser({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   name: 'John Doe'
 * });
 * // Returns: { user, accessToken, refreshToken }
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const prisma = getPrisma();

  // Check for existing user with the same email
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ConflictError('A user with this email already exists');
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await hashPassword(input.password);

  // Calculate trial dates
  const trialStartDate = new Date();
  const trialEndDate = calculateTrialEndDate(trialStartDate);

  // Generate unique token ID for refresh token tracking
  const tokenId = crypto.randomUUID();

  // Create user, subscription, and refresh token in a transaction
  const { user, refreshTokenRecord } = await prisma.$transaction(async (tx) => {
    // Create user
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: 'free',
        emailVerified: false,
      },
    });

    // Create subscription with trial period
    await tx.subscription.create({
      data: {
        userId: newUser.id,
        plan: 'free',
        status: 'active',
        expiresAt: trialEndDate,
      },
    });

    // Create refresh token record
    const newRefreshToken = await tx.refreshToken.create({
      data: {
        token: tokenId,
        userId: newUser.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return { user: newUser, refreshTokenRecord: newRefreshToken };
  });

  // Generate JWT tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    tokenId: refreshTokenRecord.token,
  });

  // Track signup analytics event
  trackAuthEvent(AUTH_EVENTS.SIGNUP_COMPLETED, {
    userId: user.id,
    trialStartDate: trialStartDate.toISOString(),
    trialEndDate: trialEndDate.toISOString(),
  });

  // Return sanitized user and tokens
  return {
    user: toAuthUser(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Session response containing user data and subscription status.
 *
 * @interface SessionResponse
 * @description Response format for GET /auth/me endpoint.
 *
 * @property {string} userId - User's unique identifier
 * @property {string} email - User's email address
 * @property {string | null} name - User's display name
 * @property {SubscriptionStatus} subscriptionStatus - Current subscription status
 * @property {Date | null} trialEndsAt - Trial end date (null if not on trial)
 * @property {boolean} isVerified - Email verification status
 * @property {string} role - User's role (free/pro/admin)
 */
export interface SessionResponse {
  userId: string;
  email: string;
  name: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  isVerified: boolean;
  role: 'free' | 'pro' | 'admin';
}

/**
 * Determines subscription status based on user's subscription data.
 *
 * @function getSubscriptionStatus
 * @param {AuthenticatedUser} user - Authenticated user with subscription
 * @returns {SubscriptionStatus} Current subscription status
 *
 * @description
 * Returns the subscription status:
 * - 'active': Has valid active subscription
 * - 'expired': Subscription has expired
 * - 'cancelled': Subscription was cancelled
 * - 'active': Default for free users without subscription record
 */
export function getSubscriptionStatus(user: AuthenticatedUser): SubscriptionStatus {
  if (!user.subscription) {
    return 'active'; // Default for free users
  }
  return user.subscription.status;
}

/**
 * Gets trial end date from user's subscription.
 *
 * @function getTrialEndsAt
 * @param {AuthenticatedUser} user - Authenticated user with subscription
 * @returns {Date | null} Trial end date or null if not on trial/no subscription
 *
 * @description
 * Returns the trial end date for users on a free plan with an expiration date.
 * Returns null for:
 * - Users without subscription
 * - Pro users (they don't have a trial)
 * - Users whose trial has already ended
 */
export function getTrialEndsAt(user: AuthenticatedUser): Date | null {
  if (!user.subscription) {
    return null;
  }

  // Only free plan users have trial end dates
  if (user.subscription.plan !== 'free') {
    return null;
  }

  return user.subscription.expiresAt;
}

/**
 * Gets the current user session information.
 *
 * @function getCurrentSession
 * @param {AuthenticatedUser} user - Authenticated user from request
 * @returns {SessionResponse} Current session data
 *
 * @description
 * Transforms the authenticated user into a session response containing:
 * - User identification (userId, email, name)
 * - Subscription status
 * - Trial information
 * - Email verification status
 *
 * @example
 * const session = getCurrentSession(req.user);
 * // Returns: { userId, email, name, subscriptionStatus, trialEndsAt, isVerified, role }
 */
export function getCurrentSession(user: AuthenticatedUser): SessionResponse {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    subscriptionStatus: getSubscriptionStatus(user),
    trialEndsAt: getTrialEndsAt(user),
    isVerified: user.emailVerified,
    role: user.role,
  };
}

/**
 * Fetches a user by ID with subscription data.
 *
 * @function getUserById
 * @async
 * @param {string} userId - User's unique identifier
 * @returns {Promise<AuthenticatedUser>} User with subscription data
 * @throws {NotFoundError} If user is not found
 *
 * @example
 * const user = await getUserById('uuid-123');
 */
export async function getUserById(userId: string): Promise<AuthenticatedUser> {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    emailVerified: user.emailVerified,
    subscription: user.subscription
      ? {
          plan: user.subscription.plan as 'free' | 'pro',
          status: user.subscription.status,
          expiresAt: user.subscription.expiresAt,
        }
      : null,
  };
}
