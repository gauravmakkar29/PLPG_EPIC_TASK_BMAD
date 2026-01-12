/**
 * @fileoverview Warning Banner component for displaying important notices.
 * A reusable banner component for showing warning messages to users.
 *
 * @module @plpg/web/components/common/WarningBanner
 *
 * @description
 * This component provides a prominent warning banner that can be used to
 * alert users about important information or consequences of their actions.
 *
 * Features:
 * - Multiple severity variants (warning, info, error)
 * - Optional dismiss functionality
 * - Accessible with proper ARIA attributes
 * - Customizable icon and content
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Warning message before regeneration
 */

import { useState, useCallback } from 'react';

import type { JSX, ReactNode } from 'react';

/**
 * Variant types for the warning banner.
 * Determines the styling and icon of the banner.
 *
 * @typedef {'warning' | 'info' | 'error'} WarningBannerVariant
 */
export type WarningBannerVariant = 'warning' | 'info' | 'error';

/**
 * Props for the WarningBanner component.
 *
 * @interface WarningBannerProps
 * @property {ReactNode} children - Banner content/message
 * @property {string} [title] - Optional title for the banner
 * @property {WarningBannerVariant} [variant] - Visual variant
 * @property {boolean} [dismissible] - Whether the banner can be dismissed
 * @property {Function} [onDismiss] - Callback when banner is dismissed
 * @property {string} [testId] - Test ID for the banner
 * @property {string} [className] - Additional CSS classes
 */
export interface WarningBannerProps {
  children: ReactNode;
  title?: string;
  variant?: WarningBannerVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  testId?: string;
  className?: string;
}

/**
 * Variant styles for the banner container.
 *
 * @constant {Record<WarningBannerVariant, string>}
 */
const containerStyles: Record<WarningBannerVariant, string> = {
  warning: 'bg-yellow-50 border-yellow-400',
  info: 'bg-blue-50 border-blue-400',
  error: 'bg-red-50 border-red-400',
};

/**
 * Variant styles for the icon container.
 *
 * @constant {Record<WarningBannerVariant, string>}
 */
const iconContainerStyles: Record<WarningBannerVariant, string> = {
  warning: 'text-yellow-400',
  info: 'text-blue-400',
  error: 'text-red-400',
};

/**
 * Variant styles for the title text.
 *
 * @constant {Record<WarningBannerVariant, string>}
 */
const titleStyles: Record<WarningBannerVariant, string> = {
  warning: 'text-yellow-800',
  info: 'text-blue-800',
  error: 'text-red-800',
};

/**
 * Variant styles for the content text.
 *
 * @constant {Record<WarningBannerVariant, string>}
 */
const contentStyles: Record<WarningBannerVariant, string> = {
  warning: 'text-yellow-700',
  info: 'text-blue-700',
  error: 'text-red-700',
};

/**
 * Variant styles for the dismiss button.
 *
 * @constant {Record<WarningBannerVariant, string>}
 */
const dismissButtonStyles: Record<WarningBannerVariant, string> = {
  warning:
    'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600',
  info: 'bg-blue-50 text-blue-500 hover:bg-blue-100 focus:ring-blue-600',
  error: 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600',
};

/**
 * Icon component for warning variant.
 *
 * @returns {JSX.Element} Warning icon SVG
 */
function WarningIcon(): JSX.Element {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Icon component for info variant.
 *
 * @returns {JSX.Element} Info icon SVG
 */
function InfoIcon(): JSX.Element {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Icon component for error variant.
 *
 * @returns {JSX.Element} Error icon SVG
 */
function ErrorIcon(): JSX.Element {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Gets the appropriate icon for the variant.
 *
 * @param {WarningBannerVariant} variant - The banner variant
 * @returns {JSX.Element} Icon component
 */
function getVariantIcon(variant: WarningBannerVariant): JSX.Element {
  switch (variant) {
    case 'error':
      return <ErrorIcon />;
    case 'info':
      return <InfoIcon />;
    case 'warning':
    default:
      return <WarningIcon />;
  }
}

/**
 * Gets the ARIA role for the variant.
 *
 * @param {WarningBannerVariant} variant - The banner variant
 * @returns {string} ARIA role
 */
function getAriaRole(variant: WarningBannerVariant): string {
  return variant === 'error' ? 'alert' : 'status';
}

/**
 * WarningBanner component.
 * Displays a prominent banner with important information for the user.
 *
 * @param {WarningBannerProps} props - Component props
 * @returns {JSX.Element | null} Banner component or null when dismissed
 *
 * @example
 * ```tsx
 * <WarningBanner
 *   variant="warning"
 *   title="Important Notice"
 * >
 *   Changing your preferences will regenerate your learning roadmap.
 *   Your existing progress will be preserved where applicable.
 * </WarningBanner>
 * ```
 */
export function WarningBanner({
  children,
  title,
  variant = 'warning',
  dismissible = false,
  onDismiss,
  testId = 'warning-banner',
  className = '',
}: WarningBannerProps): JSX.Element | null {
  const [isDismissed, setIsDismissed] = useState(false);

  /**
   * Handles the dismiss action.
   */
  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={`border-l-4 p-4 ${containerStyles[variant]} ${className}`}
      role={getAriaRole(variant)}
      aria-live="polite"
      data-testid={testId}
    >
      <div className="flex">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconContainerStyles[variant]}`}>
          {getVariantIcon(variant)}
        </div>

        {/* Content */}
        <div className="ml-3 flex-1">
          {title && (
            <h3
              className={`text-sm font-medium ${titleStyles[variant]}`}
              data-testid={`${testId}-title`}
            >
              {title}
            </h3>
          )}
          <div
            className={`${title ? 'mt-2' : ''} text-sm ${contentStyles[variant]}`}
            data-testid={`${testId}-content`}
          >
            {children}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${dismissButtonStyles[variant]}`}
                aria-label="Dismiss"
                data-testid={`${testId}-dismiss-button`}
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WarningBanner;
