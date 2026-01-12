/**
 * @fileoverview Express type augmentations for PLPG API.
 * Extends Express types to include authenticated user on request object.
 *
 * @module @plpg/api/types/express
 * @description Type definitions for Express request augmentation.
 */

import type { UserRole, SubscriptionPlan, SubscriptionStatus } from '@plpg/shared';

/**
 * Subscription information attached to authenticated user.
 *
 * @interface AuthenticatedUserSubscription
 * @description Subscription details for authorization checks.
 *
 * @property {SubscriptionPlan} plan - User's subscription plan (free/pro)
 * @property {SubscriptionStatus} status - Current subscription status
 * @property {Date | null} expiresAt - When the subscription expires
 */
export interface AuthenticatedUserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: Date | null;
}

/**
 * Authenticated user object attached to Express request.
 *
 * @interface AuthenticatedUser
 * @description User information available on req.user after JWT verification.
 *
 * @property {string} id - User's unique identifier (UUID)
 * @property {string} email - User's email address
 * @property {UserRole} role - User's access role (free/pro/admin)
 * @property {string | null} name - User's display name
 * @property {boolean} emailVerified - Whether user's email is verified
 * @property {AuthenticatedUserSubscription | null} subscription - User's subscription info
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  emailVerified: boolean;
  subscription: AuthenticatedUserSubscription | null;
}

/**
 * Express namespace augmentation.
 * Adds user property to Express Request interface.
 */
declare global {
  namespace Express {
    /**
     * Augmented Request interface with authenticated user.
     *
     * @interface Request
     * @description Express Request with optional user property.
     *
     * @property {AuthenticatedUser} [user] - Authenticated user (set by jwtMiddleware)
     */
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
/**
 * @fileoverview Express type augmentations for PLPG API.
 * Extends Express types to include authenticated user on request object.
 *
 * @module @plpg/api/types/express
 * @description Type definitions for Express request augmentation.
 */

import type { UserRole, SubscriptionPlan, SubscriptionStatus } from '@plpg/shared';

/**
 * Subscription information attached to authenticated user.
 *
 * @interface AuthenticatedUserSubscription
 * @description Subscription details for authorization checks.
 *
 * @property {SubscriptionPlan} plan - User's subscription plan (free/pro)
 * @property {SubscriptionStatus} status - Current subscription status
 * @property {Date | null} expiresAt - When the subscription expires
 */
export interface AuthenticatedUserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: Date | null;
}

/**
 * Authenticated user object attached to Express request.
 *
 * @interface AuthenticatedUser
 * @description User information available on req.user after JWT verification.
 *
 * @property {string} id - User's unique identifier (UUID)
 * @property {string} email - User's email address
 * @property {UserRole} role - User's access role (free/pro/admin)
 * @property {string | null} name - User's display name
 * @property {string | null} avatarUrl - User's profile picture URL
 * @property {boolean} emailVerified - Whether user's email is verified
 * @property {Date} createdAt - When the user account was created
 * @property {AuthenticatedUserSubscription | null} subscription - User's subscription info
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: Date;
  subscription: AuthenticatedUserSubscription | null;
}

/**
 * Express namespace augmentation.
 * Adds user property to Express Request interface.
 */
declare global {
  namespace Express {
    /**
     * Augmented Request interface with authenticated user.
     *
     * @interface Request
     * @description Express Request with optional user property.
     *
     * @property {AuthenticatedUser} [user] - Authenticated user (set by jwtMiddleware)
     */
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
