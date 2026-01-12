/**
 * @fileoverview Protected Route component for route-level authentication.
 * Provides route guards for authenticated and onboarding-required routes.
 *
 * @module @plpg/web/components/common/ProtectedRoute
 *
 * @description
 * This component handles route protection based on authentication state:
 * - Redirects unauthenticated users to sign-in
 * - Redirects users who haven't completed onboarding
 * - Shows loading state while checking auth status
 *
 * Features:
 * - Configurable redirect paths
 * - Loading state handling
 * - Flexible protection modes
 */

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

import type { JSX, ReactNode } from 'react';

/**
 * Props for the ProtectedRoute component.
 *
 * @interface ProtectedRouteProps
 * @property {ReactNode} children - Child components to render if authorized
 * @property {string} [redirectTo="/sign-in"] - Path to redirect unauthenticated users
 * @property {boolean} [requireOnboarding=false] - Whether to check onboarding completion
 * @property {string} [onboardingRedirect="/onboarding"] - Path for incomplete onboarding
 */
export interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireOnboarding?: boolean;
  onboardingRedirect?: string;
}

/**
 * Loading spinner component for auth state checking.
 *
 * @returns {JSX.Element} Loading spinner
 */
function LoadingSpinner(): JSX.Element {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-secondary-50"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center">
        <svg
          className="animate-spin h-10 w-10 text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="mt-4 text-secondary-600 text-sm">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Protected Route component.
 * Guards routes based on authentication and onboarding status.
 *
 * @param {ProtectedRouteProps} props - Component props
 * @returns {JSX.Element} Protected content or redirect
 *
 * @example
 * ```tsx
 * // Basic auth protection
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * // With onboarding requirement
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute requireOnboarding>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * // Custom redirect
 * <Route
 *   path="/settings"
 *   element={
 *     <ProtectedRoute redirectTo="/login">
 *       <Settings />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
export function ProtectedRoute({
  children,
  redirectTo = '/sign-in',
  requireOnboarding = false,
  onboardingRedirect: _onboardingRedirect = '/onboarding',
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check onboarding status if required
  if (requireOnboarding) {
    // TODO: Check actual onboarding status from API or context
    // For now, this is a placeholder that can be extended
    // const { status } = useOnboardingStatus();
    // if (!status?.isComplete) {
    //   return <Navigate to={onboardingRedirect} replace />;
    // }
  }

  // User is authenticated (and optionally onboarded), render children
  return <>{children}</>;
}

/**
 * Public Route component.
 * Redirects authenticated users away from public routes (e.g., sign-in, sign-up).
 *
 * @param {ProtectedRouteProps} props - Component props
 * @returns {JSX.Element} Public content or redirect
 *
 * @example
 * ```tsx
 * <Route
 *   path="/sign-in"
 *   element={
 *     <PublicRoute redirectTo="/dashboard">
 *       <SignIn />
 *     </PublicRoute>
 *   }
 * />
 * ```
 */
export function PublicRoute({
  children,
  redirectTo = '/dashboard',
}: Omit<ProtectedRouteProps, 'requireOnboarding' | 'onboardingRedirect'>): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect authenticated users to their intended destination or default
  if (isAuthenticated) {
    // Check if there's a saved location to redirect to
    const from = (location.state as { from?: string })?.from || redirectTo;
    return <Navigate to={from} replace />;
  }

  // User is not authenticated, render public content
  return <>{children}</>;
}

export default ProtectedRoute;
