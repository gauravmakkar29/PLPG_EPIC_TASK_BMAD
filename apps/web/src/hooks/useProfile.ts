/**
 * @fileoverview Custom hook for profile management with React Query.
 * Provides mutation functions for updating user profile.
 *
 * @module @plpg/web/hooks/useProfile
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserProfile } from '../services/user.service';
import type { UpdateProfileInput } from '@plpg/shared/validation';
import type { UserProfile } from '@plpg/shared';

/**
 * Return type for the useProfile hook.
 *
 * @interface UseProfileReturn
 * @property {Function} updateProfile - Function to update user profile
 * @property {boolean} isUpdating - Whether a profile update is in progress
 * @property {Error | null} updateError - Error from the last update attempt
 * @property {boolean} isSuccess - Whether the last update was successful
 * @property {Function} reset - Reset the mutation state
 */
export interface UseProfileReturn {
  updateProfile: (data: UpdateProfileInput) => Promise<UserProfile>;
  isUpdating: boolean;
  updateError: Error | null;
  isSuccess: boolean;
  reset: () => void;
}

/**
 * Query key for session data.
 */
export const SESSION_QUERY_KEY = ['session'] as const;

/**
 * Custom hook for managing user profile updates.
 * Uses React Query for optimistic updates and cache invalidation.
 *
 * @returns {UseProfileReturn} Profile management functions and state
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { updateProfile, isUpdating, updateError } = useProfile();
 *
 *   const handleSubmit = async (name: string) => {
 *     try {
 *       await updateProfile({ name });
 *       alert('Profile updated!');
 *     } catch (error) {
 *       console.error('Update failed:', error);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button disabled={isUpdating}>Save</button>
 *       {updateError && <span>{updateError.message}</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useProfile(): UseProfileReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      // Invalidate session query to refetch updated data
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });

  return {
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
