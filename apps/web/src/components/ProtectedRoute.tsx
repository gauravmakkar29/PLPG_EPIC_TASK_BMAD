/**
 * @fileoverview Protected route wrapper component for authentication-gated routes.
 * Ensures only authenticated users can access protected content.
 *
 * @module @plpg/web/components/ProtectedRoute
 * @description Route guard component that redirects unauthenticated users to sign-in
 * and optionally enforces onboarding completion before allowing access to protected routes.
 *
 * @example
 * // Basic usage - protect route from unauthenticated access
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // With onboarding requirement
 * <Route
 *   path="/settings"
 *   element={
 *     <ProtectedRoute requireOnboarding>
 *       <Settings />
 *     </ProtectedRoute>
 *   }
 * />
 */

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

import type { ReactNode, JSX } from 'react';

/**
 * Props for the ProtectedRoute component.
 *
 * @interface ProtectedRouteProps
 * @property {ReactNode} children - The protected content to render when authenticated
 * @property {boolean} [requireOnboarding=false] - If true, redirects to /onboarding if user hasn't completed onboarding
 */
export interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

/**
 * Location state interface for preserving redirect information.
 * Used to store the intended destination when redirecting to sign-in.
 *
 * @interface LocationState
 * @property {string} [from] - The pathname user was attempting to access
 */
interface LocationState {
  from?: string;
}

/**
 * Protected route component that guards routes based on authentication status.
 *
 * This component acts as a route guard, implementing the following logic:
 * 1. While authentication is loading, displays a loading spinner
 * 2. If user is not authenticated, redirects to /sign-in with location state
 * 3. If requireOnboarding is true and user hasn't completed onboarding, redirects to /onboarding
 * 4. If all checks pass, renders the protected children
 *
 * The component preserves the original destination in location state, enabling
 * post-login redirect back to the intended page.
 *
 * @param {ProtectedRouteProps} props - Component props
 * @param {ReactNode} props.children - Protected content to render when authenticated
 * @param {boolean} [props.requireOnboarding=false] - Whether to enforce onboarding completion
 * @returns {JSX.Element} Either a loading spinner, redirect, or the protected children
 *
 * @throws Does not throw - handles all authentication states gracefully
 *
 * @example
 * // Protect a dashboard route
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/sign-in" element={<SignIn />} />
 *       <Route
 *         path="/dashboard"
 *         element={
 *           <ProtectedRoute>
 *             <Dashboard />
 *           </ProtectedRoute>
 *         }
 *       />
 *     </Routes>
 *   );
 * }
 *
 * @example
 * // Protect route with onboarding requirement
 * <Route
 *   path="/settings"
 *   element={
 *     <ProtectedRoute requireOnboarding>
 *       <Settings />
 *     </ProtectedRoute>
 *   }
 * />
 */
export function ProtectedRoute({
  children,
  requireOnboarding = false,
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication status
  // This prevents flash of redirect/unauthenticated content
  if (isLoading) {
    return (
      <div
        aria-label="Loading authentication status"
        className="flex h-screen items-center justify-center"
        role="status"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Redirect unauthenticated users to sign-in
  // Preserve current location in state for post-login redirect
  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname } as LocationState}
        to="/sign-in"
      />
    );
  }

  // TODO: Implement onboarding check when user profile is available
  // For now, this is a placeholder for Epic 2 implementation
  // Future implementation:
  // - Check user.hasCompletedOnboarding property from AuthContext
  // - Redirect to /onboarding if requireOnboarding && !user.hasCompletedOnboarding
  // - Preserve location state for post-onboarding redirect
  if (requireOnboarding) {
    // Placeholder for onboarding redirect logic
    // Will be implemented when user profile includes onboarding status
    // Example:
    // const { user } = useAuth();
    // if (!user?.hasCompletedOnboarding) {
    //   return <Navigate to="/onboarding" state={{ from: location.pathname }} replace />;
    // }
  }

  // All checks passed - user is authenticated and meets requirements
  // Render the protected content
  return <>{children}</>;
}
