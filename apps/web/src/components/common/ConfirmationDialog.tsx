/**
 * @fileoverview Confirmation Dialog component for user confirmations.
 * A reusable modal dialog that prompts users to confirm or cancel an action.
 *
 * @module @plpg/web/components/common/ConfirmationDialog
 *
 * @description
 * This component provides a modal dialog for confirming destructive or
 * important actions. It follows accessibility best practices and supports
 * customizable styling and content.
 *
 * Features:
 * - Accessible modal with ARIA attributes
 * - Keyboard navigation (Escape to close)
 * - Focus trap within modal
 * - Customizable title, message, and button labels
 * - Multiple variants for different action types
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Confirmation before overwriting preferences
 */

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

import type { JSX, ReactNode } from 'react';

/**
 * Variant types for the confirmation dialog.
 * Determines the styling of the confirm button.
 *
 * @typedef {'default' | 'danger' | 'warning'} ConfirmationDialogVariant
 */
export type ConfirmationDialogVariant = 'default' | 'danger' | 'warning';

/**
 * Props for the ConfirmationDialog component.
 *
 * @interface ConfirmationDialogProps
 * @property {boolean} isOpen - Whether the dialog is visible
 * @property {string} title - Dialog title text
 * @property {ReactNode} children - Dialog content/message
 * @property {Function} onConfirm - Callback when user confirms
 * @property {Function} onCancel - Callback when user cancels
 * @property {string} [confirmLabel] - Label for confirm button
 * @property {string} [cancelLabel] - Label for cancel button
 * @property {ConfirmationDialogVariant} [variant] - Visual variant
 * @property {boolean} [isLoading] - Whether to show loading state on confirm
 * @property {string} [testId] - Test ID for the dialog
 */
export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationDialogVariant;
  isLoading?: boolean;
  testId?: string;
}

/**
 * Variant styles for the confirm button.
 *
 * @constant {Record<ConfirmationDialogVariant, string>}
 */
const confirmButtonStyles: Record<ConfirmationDialogVariant, string> = {
  default:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  warning:
    'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
};

/**
 * Variant icon components for the dialog header.
 *
 * @param {ConfirmationDialogVariant} variant - The dialog variant
 * @returns {JSX.Element} Icon SVG element
 */
function VariantIcon({
  variant,
}: {
  variant: ConfirmationDialogVariant;
}): JSX.Element {
  if (variant === 'danger') {
    return (
      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
        <svg
          className="h-6 w-6 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
      <svg
        className="h-6 w-6 text-primary-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

/**
 * ConfirmationDialog component.
 * Displays a modal dialog for confirming important actions.
 *
 * @param {ConfirmationDialogProps} props - Component props
 * @returns {JSX.Element | null} Dialog component or null when closed
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <ConfirmationDialog
 *   isOpen={isOpen}
 *   title="Confirm Changes"
 *   variant="warning"
 *   confirmLabel="Update Preferences"
 *   onConfirm={handleConfirm}
 *   onCancel={() => setIsOpen(false)}
 * >
 *   <p>Changing your preferences will regenerate your roadmap.</p>
 * </ConfirmationDialog>
 * ```
 */
export function ConfirmationDialog({
  isOpen,
  title,
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  testId = 'confirmation-dialog',
}: ConfirmationDialogProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Handles keyboard events for the dialog.
   * Closes on Escape key press.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel();
      }
    },
    [onCancel, isLoading]
  );

  /**
   * Handles click on the backdrop to close the dialog.
   */
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !isLoading) {
        onCancel();
      }
    },
    [onCancel, isLoading]
  );

  /**
   * Handles the confirm action.
   * Supports both sync and async onConfirm handlers.
   */
  const handleConfirm = useCallback(async () => {
    await onConfirm();
  }, [onConfirm]);

  /**
   * Set up event listeners and focus management.
   */
  useEffect(() => {
    if (isOpen) {
      // Add escape key listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus the confirm button when dialog opens
      confirmButtonRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const dialogContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${testId}-title`}
      data-testid={testId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-secondary-900 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />

      {/* Dialog positioning */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Dialog panel */}
        <div
          ref={dialogRef}
          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Icon */}
              <VariantIcon variant={variant} />

              {/* Content */}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3
                  id={`${testId}-title`}
                  className="text-lg font-semibold leading-6 text-secondary-900"
                >
                  {title}
                </h3>
                <div className="mt-2 text-sm text-secondary-600">{children}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-secondary-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {/* Confirm button */}
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonStyles[variant]}`}
              data-testid={`${testId}-confirm-button`}
            >
              {isLoading ? (
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
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>

            {/* Cancel button */}
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-secondary-900 shadow-sm ring-1 ring-inset ring-secondary-300 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`${testId}-cancel-button`}
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render dialog at document root
  return createPortal(dialogContent, document.body);
}

export default ConfirmationDialog;
