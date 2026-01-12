/**
 * @fileoverview Sign Out Button component for user logout functionality.
 * Provides a reusable button that handles the complete sign out flow including
 * clearing local state, TanStack Query cache, Zustand stores, and analytics tracking.
 *
 * @module @plpg/web/components/auth/SignOutButton
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/auth.service';
import { trackEvent, AnalyticsEvent, clearUser } from '../../lib/analytics';
import { useUIStore } from '../../stores/uiStore';

import type { JSX, ButtonHTMLAttributes } from 'react';

/**
 * Props for the SignOutButton component.
 *
 * @interface SignOutButtonProps
 * @extends {Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>}
 */
export interface SignOutButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /**
   * Custom text to display on the button.
   * @default "Sign Out"
   */
  label?: string;

  /**
   * Variant style for the button.
   * @default "default"
   */
  variant?: 'default' | 'danger' | 'ghost' | 'link';

  /**
   * Size of the button.
   * @default "medium"
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Callback function called after successful sign out.
   */
  onSignOut?: () => void;

  /**
   * Path to redirect to after sign out.
   * @default "/"
   */
  redirectTo?: string;

  /**
   * Whether to show a loading state during sign out.
   * @default true
   */
  showLoadingState?: boolean;

  /**
   * Whether to show a confirmation dialog before signing out.
   * @default false
   */
  requireConfirmation?: boolean;
}

/**
 * Variant style mappings for the button.
 */
const variantStyles: Record<string, string> = {
  default:
    'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:
    'bg-transparent text-secondary-600 hover:bg-secondary-100 focus:ring-secondary-500',
  link: 'bg-transparent text-primary-600 hover:text-primary-700 underline focus:ring-primary-500 p-0',
};

/**
 * Size style mappings for the button.
 */
const sizeStyles: Record<string, string> = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg',
};

/**
 * Sign Out Button component.
 * Handles the complete sign out flow with proper cleanup of all application state.
 *
 * Features:
 * - Clears AuthContext state
 * - Clears API tokens from localStorage
 * - Clears TanStack Query cache
 * - Clears Zustand UI store notifications
 * - Tracks logout analytics event
 * - Redirects to specified page (default: landing page)
 *
 * @param {SignOutButtonProps} props - Component props
 * @returns {JSX.Element} Sign out button component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SignOutButton />
 *
 * // With custom label and redirect
 * <SignOutButton label="Log Out" redirectTo="/sign-in" />
 *
 * // Danger variant with confirmation
 * <SignOutButton variant="danger" requireConfirmation />
 *
 * // With callback
 * <SignOutButton onSignOut={() => console.log('Signed out!')} />
 * ```
 */
export function SignOutButton({
  label = 'Sign Out',
  variant = 'default',
  size = 'medium',
  onSignOut,
  redirectTo = '/',
  showLoadingState = true,
  requireConfirmation = false,
  className = '',
  disabled,
  ...restProps
}: SignOutButtonProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, user } = useAuth();
  const { clearNotifications, setSidebarOpen } = useUIStore();

  /**
   * Performs the complete sign out operation.
   * Calls the backend to invalidate server-side session, clears all local state,
   * caches, and redirects the user.
   */
  const performSignOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Track analytics event before clearing user
      trackEvent(AnalyticsEvent.LOGOUT_COMPLETED, {
        userId: user?.id,
        method: 'button_click',
      });

      // Clear analytics user identification
      clearUser();

      // Call backend to invalidate refresh token server-side, then clear local tokens
      // This is critical for security on shared devices
      await logoutUser();

      // Clear AuthContext state (removes plpg_auth_token and plpg_auth_user)
      logout();

      // Clear TanStack Query cache
      queryClient.clear();

      // Clear Zustand UI store state
      clearNotifications();
      setSidebarOpen(false);

      // Call optional callback
      if (onSignOut) {
        onSignOut();
      }

      // Redirect to specified page
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Error during sign out:', error);

      // Even if there's an error, attempt to navigate away
      // This ensures the user isn't stuck in an inconsistent state
      navigate(redirectTo, { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.id,
    logout,
    queryClient,
    clearNotifications,
    setSidebarOpen,
    onSignOut,
    navigate,
    redirectTo,
  ]);

  /**
   * Handles button click with optional confirmation dialog.
   */
  const handleClick = useCallback((): void => {
    if (requireConfirmation) {
      const confirmed = window.confirm(
        'Are you sure you want to sign out? You will need to sign in again to access your account.'
      );
      if (!confirmed) {
        return;
      }
    }

    void performSignOut();
  }, [requireConfirmation, performSignOut]);

  // Determine button styles
  const buttonStyles = [
    'inline-flex items-center justify-center',
    'font-medium rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantStyles[variant] || variantStyles['default'],
    variant !== 'link' ? sizeStyles[size] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isDisabled = disabled || (showLoadingState && isLoading);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonStyles}
      aria-label={isLoading ? 'Signing out...' : label}
      aria-busy={isLoading}
      {...restProps}
    >
      {showLoadingState && isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
          Signing out...
        </>
      ) : (
        <>
          {variant !== 'link' && (
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          )}
          {label}
        </>
      )}
    </button>
  );
}

export default SignOutButton;
