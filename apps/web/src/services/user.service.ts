/**
 * @fileoverview User service for API interactions.
 * Provides type-safe methods for user profile management.
 *
 * @module @plpg/web/services/user.service
 */

import { api, getErrorMessage } from '../lib/api';
import type { UpdateProfileInput } from '@plpg/shared/validation';
import type { UserProfile } from '@plpg/shared';

/**
 * Session response from the API.
 *
 * @interface Session
 * @property {string} userId - User's unique identifier
 * @property {string} email - User's email address
 * @property {string | null} name - User's display name
 * @property {string | null} avatarUrl - User's profile picture URL
 * @property {'active' | 'inactive'} subscriptionStatus - Current subscription status
 * @property {string | null} trialEndsAt - ISO date string of trial end date
 * @property {boolean} isVerified - Whether user's email is verified
 * @property {'free' | 'pro' | 'admin'} role - User's role
 * @property {string} createdAt - ISO date string of account creation
 */
export interface Session {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  subscriptionStatus: 'active' | 'inactive';
  trialEndsAt: string | null;
  isVerified: boolean;
  role: 'free' | 'pro' | 'admin';
  createdAt: string;
}

/**
 * Gets the current user's session information.
 *
 * @returns {Promise<Session>} Current user session
 * @throws {Error} Network error or authentication error
 *
 * @example
 * const session = await getSession();
 * console.log(session.name);
 */
export async function getSession(): Promise<Session> {
  try {
    const response = await api.get<Session>('/auth/me');
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Updates the current user's profile.
 *
 * @param {UpdateProfileInput} data - Profile data to update
 * @returns {Promise<UserProfile>} Updated user profile
 * @throws {Error} Validation error or network error
 *
 * @example
 * const profile = await updateUserProfile({ name: 'New Name' });
 */
export async function updateUserProfile(
  data: UpdateProfileInput
): Promise<UserProfile> {
  try {
    const response = await api.patch<UserProfile>('/users/profile', data);
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Gets the current user's profile.
 *
 * @returns {Promise<UserProfile>} User profile
 * @throws {Error} Network error or authentication error
 *
 * @example
 * const profile = await getUserProfile();
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const response = await api.get<UserProfile>('/users/profile');
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}
