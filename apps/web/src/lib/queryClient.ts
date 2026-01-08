/**
 * @fileoverview TanStack Query client configuration.
 * Configures default options for caching and refetching.
 *
 * @module @plpg/web/lib/queryClient
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance.
 * Configured with sensible defaults for PLPG application.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});
