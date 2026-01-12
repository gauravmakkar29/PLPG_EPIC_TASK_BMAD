/**
 * @fileoverview Step 1 Current Role Selection Component for onboarding flow.
 * Allows users to select their current role from predefined options.
 *
 * @module @plpg/web/components/onboarding/Step1CurrentRole
 * @description First step of onboarding - current role selection with 'Other' option.
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - Dropdown/select with predefined roles
 * - Single selection required
 * - Next button enabled only after selection
 * - Selection saved immediately (no data loss on navigation)
 * - Visual feedback on selection
 * - "Other" option shows text input
 */

import { useState, useCallback, useEffect } from 'react';
import type { JSX, ChangeEvent } from 'react';
import { CURRENT_ROLE_OPTIONS, CURRENT_ROLE_NAMES } from '@plpg/shared';
import type { CurrentRole, OnboardingStep1Data } from '@plpg/shared';

/**
 * Props for the Step1CurrentRole component.
 *
 * @interface Step1CurrentRoleProps
 * @property {OnboardingStep1Data | null} initialData - Initial selection data if returning to step
 * @property {function} onSelectionChange - Callback when selection changes (for auto-save)
 * @property {function} onNext - Callback when Next button is clicked
 * @property {boolean} isLoading - Whether save operation is in progress
 * @property {boolean} isSaving - Whether auto-save is in progress
 */
interface Step1CurrentRoleProps {
  initialData: OnboardingStep1Data | null;
  onSelectionChange: (data: OnboardingStep1Data) => void;
  onNext: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

/**
 * Role card option interface for rendering.
 *
 * @interface RoleOption
 * @property {CurrentRole} value - The role value
 * @property {string} label - Display label
 * @property {string} description - Role description
 */
interface RoleOption {
  value: CurrentRole;
  label: string;
  description: string;
}

/**
 * Step 1 Current Role Selection Component.
 *
 * Renders a card-based role selection UI with the following features:
 * - Visual selection cards for each predefined role
 * - Conditional text input when "Other" is selected
 * - Visual feedback on selection (highlighted border, checkmark)
 * - Next button disabled until valid selection is made
 * - Auto-save on selection change
 *
 * @param {Step1CurrentRoleProps} props - Component props
 * @returns {JSX.Element} Rendered Step 1 component
 *
 * @example
 * ```tsx
 * <Step1CurrentRole
 *   initialData={{ currentRole: 'backend_developer' }}
 *   onSelectionChange={(data) => saveToApi(data)}
 *   onNext={() => goToStep2()}
 *   isLoading={false}
 *   isSaving={false}
 * />
 * ```
 */
export function Step1CurrentRole({
  initialData,
  onSelectionChange,
  onNext,
  isLoading = false,
  isSaving = false,
}: Step1CurrentRoleProps): JSX.Element {
  // State for selected role
  const [selectedRole, setSelectedRole] = useState<CurrentRole | null>(
    initialData?.currentRole ?? null
  );

  // State for custom role text (when "Other" is selected)
  const [customRoleText, setCustomRoleText] = useState<string>(
    initialData?.customRoleText ?? ''
  );

  // State for validation error
  const [customRoleError, setCustomRoleError] = useState<string | null>(null);

  /**
   * Validates if the current selection is complete and valid.
   *
   * @returns {boolean} True if selection is valid
   */
  const isSelectionValid = useCallback((): boolean => {
    if (!selectedRole) return false;
    if (selectedRole === 'other') {
      return customRoleText.trim().length >= 2;
    }
    return true;
  }, [selectedRole, customRoleText]);

  /**
   * Handles role card selection.
   * Updates state and triggers auto-save callback.
   *
   * @param {CurrentRole} role - The selected role value
   */
  const handleRoleSelect = useCallback(
    (role: CurrentRole): void => {
      setSelectedRole(role);
      setCustomRoleError(null);

      // Build the data object
      const data: OnboardingStep1Data = {
        currentRole: role,
        customRoleText: role === 'other' ? customRoleText : undefined,
      };

      // Trigger auto-save callback
      onSelectionChange(data);
    },
    [customRoleText, onSelectionChange]
  );

  /**
   * Handles custom role text input change.
   * Validates input and triggers auto-save when "Other" is selected.
   *
   * @param {ChangeEvent<HTMLInputElement>} event - Input change event
   */
  const handleCustomRoleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const value = event.target.value;
      setCustomRoleText(value);

      // Validate minimum length
      if (value.trim().length > 0 && value.trim().length < 2) {
        setCustomRoleError('Please enter at least 2 characters');
      } else {
        setCustomRoleError(null);
      }

      // Trigger auto-save if Other is selected
      if (selectedRole === 'other') {
        const data: OnboardingStep1Data = {
          currentRole: 'other',
          customRoleText: value,
        };
        onSelectionChange(data);
      }
    },
    [selectedRole, onSelectionChange]
  );

  /**
   * Handles Next button click.
   * Validates selection before proceeding.
   */
  const handleNextClick = useCallback((): void => {
    if (selectedRole === 'other' && customRoleText.trim().length < 2) {
      setCustomRoleError('Please specify your role when selecting "Other"');
      return;
    }
    onNext();
  }, [selectedRole, customRoleText, onNext]);

  // Sync initial data on mount
  useEffect(() => {
    if (initialData) {
      setSelectedRole(initialData.currentRole);
      setCustomRoleText(initialData.customRoleText ?? '');
    }
  }, [initialData]);

  return (
    <div className="step-1-current-role" data-testid="step-1-current-role">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">What&apos;s your current role?</h2>
        <p className="step-description">
          Select the role that best describes your current position. This helps
          us personalize your learning path.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div
        className="role-cards-container"
        role="radiogroup"
        aria-label="Select your current role"
      >
        {CURRENT_ROLE_OPTIONS.map((option: RoleOption) => (
          <button
            key={option.value}
            type="button"
            className={`role-card ${selectedRole === option.value ? 'role-card--selected' : ''}`}
            onClick={() => handleRoleSelect(option.value)}
            aria-checked={selectedRole === option.value}
            role="radio"
            data-testid={`role-card-${option.value}`}
            disabled={isLoading}
          >
            {/* Selection Indicator */}
            <div className="role-card__indicator">
              {selectedRole === option.value && (
                <svg
                  className="role-card__checkmark"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            {/* Role Content */}
            <div className="role-card__content">
              <span className="role-card__label">{option.label}</span>
              <span className="role-card__description">{option.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Role Text Input (shown when "Other" is selected) */}
      {selectedRole === 'other' && (
        <div
          className="custom-role-input-container"
          data-testid="custom-role-input-container"
        >
          <label htmlFor="custom-role-input" className="custom-role-label">
            Please specify your role:
          </label>
          <input
            id="custom-role-input"
            type="text"
            className={`custom-role-input ${customRoleError ? 'custom-role-input--error' : ''}`}
            value={customRoleText}
            onChange={handleCustomRoleChange}
            placeholder="e.g., Software Architect, Project Manager"
            maxLength={100}
            disabled={isLoading}
            aria-invalid={!!customRoleError}
            aria-describedby={customRoleError ? 'custom-role-error' : undefined}
            data-testid="custom-role-input"
          />
          {customRoleError && (
            <span
              id="custom-role-error"
              className="custom-role-error"
              role="alert"
              data-testid="custom-role-error"
            >
              {customRoleError}
            </span>
          )}
        </div>
      )}

      {/* Saving Indicator */}
      {isSaving && (
        <div className="saving-indicator" aria-live="polite">
          <span className="saving-spinner" aria-hidden="true" />
          <span>Saving...</span>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="step-footer">
        <button
          type="button"
          className="btn btn--primary btn--next"
          onClick={handleNextClick}
          disabled={!isSelectionValid() || isLoading}
          data-testid="next-button"
        >
          {isLoading ? 'Loading...' : 'Next'}
        </button>
      </div>

      {/* Inline Styles */}
      <style>{`
        .step-1-current-role {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
        }

        .step-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .step-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 8px;
        }

        .step-description {
          font-size: 1rem;
          color: #6b7280;
          max-width: 400px;
          margin: 0 auto;
        }

        .role-cards-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .role-card {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .role-card:hover:not(:disabled) {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .role-card:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .role-card--selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .role-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .role-card__indicator {
          width: 24px;
          height: 24px;
          min-width: 24px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          margin-right: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .role-card--selected .role-card__indicator {
          border-color: #3b82f6;
          background: #3b82f6;
        }

        .role-card__checkmark {
          width: 14px;
          height: 14px;
          color: #ffffff;
        }

        .role-card__content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .role-card__label {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a2e;
        }

        .role-card__description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .custom-role-input-container {
          margin-bottom: 24px;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-role-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .custom-role-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .custom-role-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .custom-role-input--error {
          border-color: #ef4444;
        }

        .custom-role-input--error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        .custom-role-error {
          display: block;
          font-size: 0.75rem;
          color: #ef4444;
          margin-top: 4px;
        }

        .saving-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 16px;
        }

        .saving-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .step-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn--primary {
          background: #3b82f6;
          color: #ffffff;
        }

        .btn--primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn--primary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }

        .btn--primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .step-1-current-role {
            padding: 16px;
          }

          .step-title {
            font-size: 1.5rem;
          }

          .role-card {
            padding: 12px;
          }

          .role-card__indicator {
            width: 20px;
            height: 20px;
            min-width: 20px;
            margin-right: 12px;
          }

          .role-card__checkmark {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Step1CurrentRole;
