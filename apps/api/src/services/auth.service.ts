/**
 * @fileoverview Authentication service for PLPG API.
 * Handles user login, registration, password verification, and JWT token generation.
 *
 * @module @plpg/api/services/auth
 * @description Core authentication business logic.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma, getPrisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import type {
  AuthResponse,
  AuthUser,
  AuthTokenPayload,
  RefreshTokenPayload,
  UserRole,
  SubscriptionStatus,
} from '@plpg/shared';
import type { RegisterInput } from '@plpg/shared/validation';
import { ConflictError, NotFoundError } from '@plpg/shared';
import type { AuthenticatedUser } from '../types';

/**
 * JWT configuration constants.
 */
const JWT_SECRET =
  process.env['JWT_SECRET'] || 'development-secret-change-in-production';
const JWT_REFRESH_SECRET =
  process.env['JWT_REFRESH_SECRET'] || 'refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Bcrypt cost factor for password hashing.
 * Set to 12 as per security requirements.
 */
export const BCRYPT_COST_FACTOR = 12;

/**
 * Analytics event types for authentication flows.
 */
export const AUTH_EVENTS = {
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT_COMPLETED: 'logout_completed',
} as const;

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
 * Registration result containing user data and tokens.
 */
export type RegisterResult = AuthResponse;

/**
 * Session response containing user data and subscription status.
 */
export interface SessionResponse {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  isVerified: boolean;
  role: 'free' | 'pro' | 'admin';
  createdAt: string;
}

/**
 * Determines the subscription status for a user (for login).
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
 */
function generateAccessToken(
  userId: string,
  email: string,
  role: UserRole
): string {
  const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generates JWT refresh token and stores it in database.
 */
async function generateRefreshToken(userId: string): Promise<string> {
  const tokenId = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId,
    tokenId,
  };

  const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

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
 */
export function toAuthUser(user: {
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
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Compares a plain text password with a bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Verifies a password against a hash using bcrypt.
 * (Alias for comparePassword for backward compatibility)
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Calculates trial end date based on configuration.
 */
export function calculateTrialEndDate(startDate: Date): Date {
  const TRIAL_DURATION_DAYS = 14;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
  return endDate;
}

/**
 * Tracks an authentication analytics event.
 */
export function trackAuthEvent(
  event: string,
  data: Record<string, unknown>
): void {
  logger.info({ event, ...data }, `Auth event: ${event}`);
}

/**
 * Authenticates user with email and password.
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
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.role as UserRole
    );
    const refreshToken = await generateRefreshToken(user.id);

    // Determine subscription status
    const subscriptionStatus = determineSubscriptionStatus(user);

    logger.info(
      { userId: user.id, subscriptionStatus },
      'User logged in successfully'
    );

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
 * Registers a new user in the system.
 */
export async function registerUser(
  input: RegisterInput
): Promise<RegisterResult> {
  const db = getPrisma();

  // Check for existing user with the same email
  const existingUser = await db.user.findUnique({
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

  // Create user and subscription in a transaction
  const user = await db.$transaction(async (tx) => {
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

    return newUser;
  });

  // Generate JWT tokens
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    user.role as UserRole
  );
  const refreshToken = await generateRefreshToken(user.id);

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
 * Invalidates a refresh token by removing it from the database.
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
 */
export async function invalidateAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
  logger.info({ userId }, 'All refresh tokens invalidated for user');
}

/**
 * Determines subscription status based on user's subscription data.
 */
export function getSubscriptionStatus(user: AuthenticatedUser): SubscriptionStatus {
  if (!user.subscription) {
    return 'active'; // Default for free users
  }
  return user.subscription.status;
}

/**
 * Gets trial end date from user's subscription.
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
 */
export function getCurrentSession(user: AuthenticatedUser): SessionResponse {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    subscriptionStatus: getSubscriptionStatus(user),
    trialEndsAt: getTrialEndsAt(user),
    isVerified: user.emailVerified,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Fetches a user by ID with subscription data.
 */
export async function getUserById(userId: string): Promise<AuthenticatedUser> {
  const db = getPrisma();

  const user = await db.user.findUnique({
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
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    subscription: user.subscription
      ? {
          plan: user.subscription.plan as 'free' | 'pro',
          status: user.subscription.status,
          expiresAt: user.subscription.expiresAt,
        }
      : null,
  };
}
