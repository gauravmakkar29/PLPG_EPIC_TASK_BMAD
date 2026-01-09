/**
 * @fileoverview Custom hook for session data with React Query.
 * Provides the current user's session information.
 *
 * @module @plpg/web/hooks/useSession
 */

import { useQuery } from '@tanstack/react-query';
import { getSession, type Session } from '../services/user.service';

/**
 * Query key for session data.
 */
export const SESSION_QUERY_KEY = ['session'] as const;

/**
 * Return type for the useSession hook.
 *
 * @interface UseSessionReturn
 * @property {Session | undefined} data - Session data if available
 * @property {boolean} isLoading - Whether the session is being loaded
 * @property {boolean} isError - Whether there was an error loading session
 * @property {Error | null} error - Error object if an error occurred
 * @property {Function} refetch - Function to manually refetch session
 */
export interface UseSessionReturn {
  data: Session | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching and caching user session data.
 * Uses React Query for caching and automatic refetching.
 *
 * @returns {UseSessionReturn} Session data and state
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { data: session, isLoading } = useSession();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return <div>Welcome, {session?.name}</div>;
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
