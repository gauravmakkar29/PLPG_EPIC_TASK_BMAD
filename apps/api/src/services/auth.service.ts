/**
 * @fileoverview Authentication service for PLPG API.
 * Handles user login, password verification, and JWT token generation.
 *
 * @module @plpg/api/services/auth
 * @description Core authentication business logic.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import type {
  AuthResponse,
  AuthUser,
  AuthTokenPayload,
  RefreshTokenPayload,
  UserRole,
} from '@plpg/shared';

/**
 * JWT configuration constants.
 */
const JWT_SECRET = process.env['JWT_SECRET'] || 'development-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Subscription status based on user data.
 */
export type SubscriptionStatusType = 'free' | 'trial' | 'pro';

/**
 * Login result containing auth tokens and user data.
 */
export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  subscriptionStatus: SubscriptionStatusType;
}

/**
 * Determines the subscription status for a user.
 *
 * @param user - User with subscription data
 * @returns Subscription status: 'pro', 'trial', or 'free'
 */
function determineSubscriptionStatus(user: {
  role: string;
  subscription: {
    plan: string;
    status: string;
    expiresAt: Date | null;
  } | null;
  createdAt: Date;
}): SubscriptionStatusType {
  // Admins get pro status
  if (user.role === 'admin') {
    return 'pro';
  }

  // Check active pro subscription
  if (user.subscription) {
    const { plan, status, expiresAt } = user.subscription;

    if (plan === 'pro' && status === 'active') {
      if (!expiresAt || new Date(expiresAt) > new Date()) {
        return 'pro';
      }
    }
  }

  // Check if user is in trial period (first 14 days)
  const trialPeriodDays = 14;
  const trialEndDate = new Date(user.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);

  if (new Date() < trialEndDate) {
    return 'trial';
  }

  return 'free';
}

/**
 * Generates JWT access token.
 *
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @param role - User's role
 * @returns Signed JWT access token
 */
function generateAccessToken(userId: string, email: string, role: UserRole): string {
  const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generates JWT refresh token and stores it in database.
 *
 * @param userId - User's unique identifier
 * @returns Signed JWT refresh token
 */
async function generateRefreshToken(userId: string): Promise<string> {
  const tokenId = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId,
    tokenId,
  };

  const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Transforms database user to AuthUser response format.
 *
 * @param user - Database user object
 * @returns AuthUser object safe for API response
 */
function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role as UserRole,
    isVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

/**
 * Authenticates user with email and password.
 *
 * @param email - User's email address
 * @param password - User's plaintext password
 * @returns Login result with tokens and user data, or null if authentication fails
 *
 * @description
 * This function:
 * 1. Looks up user by email
 * 2. Verifies password using bcrypt
 * 3. Generates access and refresh tokens
 * 4. Determines subscription status
 *
 * Returns null for invalid credentials (both wrong email and wrong password)
 * to prevent user enumeration attacks.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResult | null> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { subscription: true },
    });

    // User not found - return null (generic error)
    if (!user) {
      logger.debug({ email }, 'Login attempt with non-existent email');
      return null;
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      logger.debug({ userId: user.id }, 'Login attempt with invalid password');
      return null;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role as UserRole);
    const refreshToken = await generateRefreshToken(user.id);

    // Determine subscription status
    const subscriptionStatus = determineSubscriptionStatus(user);

    logger.info({ userId: user.id, subscriptionStatus }, 'User logged in successfully');

    return {
      user: toAuthUser(user),
      accessToken,
      refreshToken,
      subscriptionStatus,
    };
  } catch (error) {
    logger.error({ error, email }, 'Error during login');
    throw error;
  }
}

/**
 * Verifies a password against a hash using bcrypt.
 *
 * @param password - Plaintext password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hashes a password using bcrypt.
 *
 * @param password - Plaintext password to hash
 * @returns Bcrypt hash of the password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Invalidates a refresh token by removing it from the database.
 *
 * @param token - Refresh token to invalidate
 */
export async function invalidateRefreshToken(token: string): Promise<void> {
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
  } catch {
    // Token may not exist, which is fine
    logger.debug('Attempted to invalidate non-existent refresh token');
  }
}

/**
 * Invalidates all refresh tokens for a user (logout all sessions).
 *
 * @param userId - User's unique identifier
 */
export async function invalidateAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
  logger.info({ userId }, 'All refresh tokens invalidated for user');
}
