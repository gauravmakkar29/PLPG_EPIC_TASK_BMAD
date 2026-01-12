/**
 * @fileoverview Main Onboarding page component.
 * Entry point for the onboarding flow that renders the welcome screen or step views.
 *
 * @module @plpg/web/pages/Onboarding
 *
 * @description
 * This page serves as the main entry for the onboarding flow:
 * - Wraps content with OnboardingProvider for state management
 * - Checks authentication status (redirects if not authenticated)
 * - Checks if user has already completed onboarding (redirects to dashboard)
 * - Renders the OnboardingWelcome component for new users
 *
 * Route: /onboarding
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { OnboardingProvider } from '../../contexts/OnboardingContext';
import { OnboardingWelcome } from '../../components/onboarding/OnboardingWelcome';

import type { JSX } from 'react';

/**
 * Loading screen component displayed while checking onboarding status.
 *
 * @returns {JSX.Element} Loading screen
 */
function OnboardingLoadingScreen(): JSX.Element {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50"
      role="status"
      aria-label="Checking onboarding status"
    >
      <div className="flex flex-col items-center">
        <svg
          className="animate-spin h-12 w-12 text-primary-600"
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
        <p className="mt-4 text-secondary-600 font-medium">
          Preparing your onboarding experience...
        </p>
      </div>
    </div>
  );
}

/**
 * Onboarding page content component.
 * Handles authentication and onboarding status checks.
 *
 * @returns {JSX.Element} Onboarding content
 */
function OnboardingContent(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  /**
   * Check authentication and onboarding status on mount.
   */
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Redirect to sign-in if not authenticated
    if (!isAuthenticated) {
      navigate('/sign-in', {
        state: { from: '/onboarding' },
        replace: true
      });
      return;
    }

    // Check if user has already completed onboarding
    const checkOnboardingStatus = async (): Promise<void> => {
      try {
        // TODO: Call API to check onboarding status
        // const status = await getOnboardingStatus();
        // if (status.isComplete) {
        //   setHasCompletedOnboarding(true);
        //   navigate('/dashboard', { replace: true });
        //   return;
        // }

        // For now, assume user needs onboarding
        setHasCompletedOnboarding(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    void checkOnboardingStatus();
  }, [authLoading, isAuthenticated, navigate]);

  // Show loading while checking auth status
  if (authLoading || isCheckingStatus) {
    return <OnboardingLoadingScreen />;
  }

  // User has completed onboarding - this shouldn't render as we redirect
  if (hasCompletedOnboarding) {
    return <OnboardingLoadingScreen />;
  }

  // Render the welcome screen
  return <OnboardingWelcome />;
}

/**
 * Main Onboarding page component.
 * Wraps the onboarding content with the OnboardingProvider.
 *
 * @returns {JSX.Element} Onboarding page
 *
 * @example
 * ```tsx
 * // In App.tsx routes
 * <Route path="/onboarding" element={<Onboarding />} />
 * ```
 */
export function Onboarding(): JSX.Element {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}

export default Onboarding;
