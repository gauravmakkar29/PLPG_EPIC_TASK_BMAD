/**
 * @fileoverview User service for PLPG API.
 * Handles user profile management operations.
 *
 * @module @plpg/api/services/user
 * @description Business logic for user profile operations.
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotFoundError } from '@plpg/shared';
import type { UpdateProfileInput } from '@plpg/shared/validation';
import type { UserProfile } from '@plpg/shared';

/**
 * Updates a user's profile information.
 *
 * @function updateUserProfile
 * @async
 * @param {string} userId - User's unique identifier
 * @param {UpdateProfileInput} input - Profile data to update
 * @returns {Promise<UserProfile>} Updated user profile
 * @throws {NotFoundError} When user is not found
 *
 * @example
 * const profile = await updateUserProfile('user-123', { name: 'New Name' });
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  logger.debug({ userId, input }, 'Updating user profile');

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new NotFoundError('User');
  }

  // Build update data - only include fields that are provided
  const updateData: { name?: string; avatarUrl?: string | null } = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.avatarUrl !== undefined) {
    updateData.avatarUrl = input.avatarUrl;
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  logger.info({ userId }, 'User profile updated successfully');

  // Return safe user profile (without sensitive data)
  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    avatarUrl: updatedUser.avatarUrl,
    emailVerified: updatedUser.emailVerified,
  };
}

/**
 * Gets a user's profile by ID.
 *
 * @function getUserProfile
 * @async
 * @param {string} userId - User's unique identifier
 * @returns {Promise<UserProfile>} User profile
 * @throws {NotFoundError} When user is not found
 *
 * @example
 * const profile = await getUserProfile('user-123');
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
  };
}
