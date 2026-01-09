/**
 * @fileoverview User entity type definitions for PLPG.
 * Defines the core user model and related authentication types.
 *
 * @module @plpg/shared/types/user
 * @description User domain types used across frontend and backend.
 */

/**
 * Core user entity representing a registered PLPG user.
 *
 * @interface User
 * @description Represents a user account with authentication and subscription metadata.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} email - User's email address (unique)
 * @property {string | null} name - Display name (optional)
 * @property {string | null} avatarUrl - Profile picture URL (optional)
 * @property {string | null} passwordHash - Bcrypt hashed password
 * @property {boolean} emailVerified - Whether email has been verified
 * @property {Date} trialStartDate - When the trial period began
 * @property {Date} trialEndDate - When the trial period ends
 * @property {string | null} stripeCustomerId - Stripe customer ID for billing
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  passwordHash: string | null;
  emailVerified: boolean;
  trialStartDate: Date;
  trialEndDate: Date;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public user profile without sensitive information.
 * Used for API responses and frontend display.
 *
 * @interface UserProfile
 * @description Safe user representation for client-side usage.
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

/**
 * User session information stored in JWT.
 *
 * @interface UserSession
 * @description JWT payload structure for authenticated sessions.
 */
export interface UserSession {
  userId: string;
  email: string;
  name: string | null;
  subscriptionStatus: 'free' | 'trial' | 'pro';
  trialEndsAt: string | null;
}

/**
 * User creation input data.
 *
 * @interface CreateUserInput
 * @description Data required to create a new user account.
 */
export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

/**
 * User update input data.
 *
 * @interface UpdateUserInput
 * @description Partial data for updating user profile.
 */
export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string | null;
}
