/**
 * @fileoverview Step 2 Target Role Selection Component for onboarding flow.
 * Allows users to select their target career role from predefined options.
 *
 * @module @plpg/web/components/onboarding/Step2TargetRole
 * @description Second step of onboarding - target role selection with role details.
 *
 * @requirements
 * - AIRE-235: Story 2.3 - Step 2 Target Role Selection
 * - Dropdown/select with target roles (MVP: ML Engineer only)
 * - Brief description of role shown on selection
 * - Coming soon indicator for future paths
 * - ML Engineer shows: estimated learning hours, typical outcomes
 * - Single selection required
 * - Next button enabled only after selection
 *
 * @designPrinciples
 * - SRP: Component handles only target role selection logic
 * - OCP: Extensible via TARGET_ROLE_OPTIONS configuration
 * - LSP: Follows consistent interface with other onboarding steps
 * - ISP: Focused props interface without unnecessary dependencies
 * - DIP: Depends on shared types abstraction, not concrete implementations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import { TARGET_ROLE_OPTIONS } from '@plpg/shared';
import type { TargetRole, OnboardingStep2Data } from '@plpg/shared';
import type { TargetRoleMetadata } from '@plpg/shared';

/**
 * Props interface for Step2TargetRole component.
 * Follows Interface Segregation Principle with focused, minimal props.
 *
 * @interface Step2TargetRoleProps
 * @property {OnboardingStep2Data | null} initialData - Initial selection data if returning to step
 * @property {function} onSelectionChange - Callback when selection changes (for auto-save)
 * @property {function} onNext - Callback when Next button is clicked
 * @property {function} onBack - Callback when Back button is clicked
 * @property {boolean} isLoading - Whether save operation is in progress
 * @property {boolean} isSaving - Whether auto-save is in progress
 */
export interface Step2TargetRoleProps {
  initialData: OnboardingStep2Data | null;
  onSelectionChange: (data: OnboardingStep2Data) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

/**
 * Target role card option interface for type-safe rendering.
 * Extends base role option with metadata for display.
 *
 * @interface TargetRoleOption
 * @property {TargetRole} value - The role value identifier
 * @property {string} label - Display label for the role
 * @property {string} description - Brief description of the role
 * @property {TargetRoleMetadata} metadata - Extended metadata including hours and outcomes
 */
interface TargetRoleOption {
  value: TargetRole;
  label: string;
  description: string;
  metadata: TargetRoleMetadata;
}

/**
 * Formats estimated hours into a readable string.
 * Single Responsibility: Only handles hour formatting logic.
 *
 * @param {number} hours - Total estimated hours
 * @returns {string} Formatted hours string (e.g., "~300 hours")
 */
function formatEstimatedHours(hours: number): string {
  return `~${hours} hours`;
}

/**
 * Step 2 Target Role Selection Component.
 *
 * Renders a card-based target role selection UI with the following features:
 * - Visual selection cards for each target role
 * - "Coming Soon" badge for unavailable roles (disabled state)
 * - Expanded details panel for selected available role
 * - Estimated learning hours and typical outcomes display
 * - Single selection required for progression
 * - Back and Next navigation buttons
 *
 * @param {Step2TargetRoleProps} props - Component props
 * @returns {JSX.Element} Rendered Step 2 component
 *
 * @example
 * ```tsx
 * <Step2TargetRole
 *   initialData={{ targetRole: 'ml_engineer' }}
 *   onSelectionChange={(data) => saveToApi(data)}
 *   onNext={() => goToStep3()}
 *   onBack={() => goToStep1()}
 *   isLoading={false}
 *   isSaving={false}
 * />
 * ```
 */
export function Step2TargetRole({
  initialData,
  onSelectionChange,
  onNext,
  onBack,
  isLoading = false,
  isSaving = false,
}: Step2TargetRoleProps): JSX.Element {
  // State for selected target role
  const [selectedRole, setSelectedRole] = useState<TargetRole | null>(
    initialData?.targetRole ?? null
  );

  /**
   * Memoized selected role metadata for display.
   * Dependency Inversion: Uses abstracted role options configuration.
   *
   * @returns {TargetRoleOption | null} Selected role option with metadata
   */
  const selectedRoleDetails = useMemo((): TargetRoleOption | null => {
    if (!selectedRole) return null;
    return (
      TARGET_ROLE_OPTIONS.find(
        (option) => option.value === selectedRole
      ) as TargetRoleOption || null
    );
  }, [selectedRole]);

  /**
   * Validates if the current selection is complete and valid.
   * Only available roles can satisfy validation.
   *
   * @returns {boolean} True if selection is valid and available
   */
  const isSelectionValid = useCallback((): boolean => {
    if (!selectedRole) return false;
    const roleOption = TARGET_ROLE_OPTIONS.find(
      (option) => option.value === selectedRole
    ) as TargetRoleOption | undefined;
    return roleOption?.metadata.isAvailable ?? false;
  }, [selectedRole]);

  /**
   * Handles target role card selection.
   * Only allows selection of available roles.
   * Triggers auto-save callback on valid selection.
   *
   * @param {TargetRoleOption} option - The selected role option
   */
  const handleRoleSelect = useCallback(
    (option: TargetRoleOption): void => {
      // Prevent selection of unavailable roles
      if (!option.metadata.isAvailable) return;

      setSelectedRole(option.value);

      // Build the data object for auto-save
      const data: OnboardingStep2Data = {
        targetRole: option.value,
      };

      // Trigger auto-save callback
      onSelectionChange(data);
    },
    [onSelectionChange]
  );

  /**
   * Handles Next button click.
   * Validates selection before proceeding to next step.
   */
  const handleNextClick = useCallback((): void => {
    if (!isSelectionValid()) return;
    onNext();
  }, [isSelectionValid, onNext]);

  /**
   * Handles Back button click.
   * Navigates to previous step without validation.
   */
  const handleBackClick = useCallback((): void => {
    onBack();
  }, [onBack]);

  // Sync initial data on mount or when initialData changes
  useEffect(() => {
    if (initialData?.targetRole) {
      setSelectedRole(initialData.targetRole);
    }
  }, [initialData]);

  return (
    <div className="step-2-target-role" data-testid="step-2-target-role">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">Where do you want to go?</h2>
        <p className="step-description">
          Select the career path you want to pursue. We&apos;ll create a
          personalized learning roadmap to get you there.
        </p>
      </div>

      {/* Target Role Selection Cards */}
      <div
        className="role-cards-container"
        role="radiogroup"
        aria-label="Select your target role"
      >
        {(TARGET_ROLE_OPTIONS as readonly TargetRoleOption[]).map((option) => (
          <button
            key={option.value}
            type="button"
            className={`target-role-card ${
              selectedRole === option.value ? 'target-role-card--selected' : ''
            } ${!option.metadata.isAvailable ? 'target-role-card--disabled' : ''}`}
            onClick={() => handleRoleSelect(option)}
            aria-checked={selectedRole === option.value}
            aria-disabled={!option.metadata.isAvailable}
            role="radio"
            data-testid={`target-role-card-${option.value}`}
            disabled={isLoading || !option.metadata.isAvailable}
          >
            {/* Coming Soon Badge */}
            {!option.metadata.isAvailable && (
              <span
                className="coming-soon-badge"
                data-testid={`coming-soon-badge-${option.value}`}
              >
                Coming Soon
              </span>
            )}

            {/* Selection Indicator */}
            <div className="target-role-card__indicator">
              {selectedRole === option.value && option.metadata.isAvailable && (
                <svg
                  className="target-role-card__checkmark"
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
            <div className="target-role-card__content">
              <span className="target-role-card__label">{option.label}</span>
              <span className="target-role-card__description">
                {option.description}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Role Details Panel */}
      {selectedRoleDetails && selectedRoleDetails.metadata.isAvailable && (
        <div
          className="role-details-panel"
          data-testid="role-details-panel"
          aria-live="polite"
        >
          <div className="role-details-header">
            <h3 className="role-details-title">{selectedRoleDetails.label}</h3>
            <span
              className="role-details-hours"
              data-testid="estimated-hours"
            >
              {formatEstimatedHours(selectedRoleDetails.metadata.estimatedHours)}
            </span>
          </div>

          <div className="role-details-outcomes">
            <h4 className="outcomes-title">What you&apos;ll be able to do:</h4>
            <ul
              className="outcomes-list"
              data-testid="typical-outcomes-list"
            >
              {selectedRoleDetails.metadata.typicalOutcomes.map(
                (outcome, index) => (
                  <li key={index} className="outcome-item">
                    <svg
                      className="outcome-checkmark"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{outcome}</span>
                  </li>
                )
              )}
            </ul>
          </div>
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
          className="btn btn--secondary btn--back"
          onClick={handleBackClick}
          disabled={isLoading}
          data-testid="back-button"
        >
          Back
        </button>
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

      {/* Scoped Styles */}
      <style>{`
        .step-2-target-role {
          max-width: 640px;
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
          max-width: 440px;
          margin: 0 auto;
        }

        .role-cards-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .target-role-card {
          position: relative;
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

        .target-role-card:hover:not(:disabled):not(.target-role-card--disabled) {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .target-role-card:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .target-role-card--selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .target-role-card--disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f9fafb;
        }

        .target-role-card:disabled {
          cursor: not-allowed;
        }

        .coming-soon-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          background: #f3f4f6;
          border-radius: 4px;
        }

        .target-role-card__indicator {
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

        .target-role-card--selected .target-role-card__indicator {
          border-color: #3b82f6;
          background: #3b82f6;
        }

        .target-role-card--disabled .target-role-card__indicator {
          border-color: #d1d5db;
          background: #e5e7eb;
        }

        .target-role-card__checkmark {
          width: 14px;
          height: 14px;
          color: #ffffff;
        }

        .target-role-card__content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          padding-right: 60px;
        }

        .target-role-card__label {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a2e;
        }

        .target-role-card--disabled .target-role-card__label {
          color: #9ca3af;
        }

        .target-role-card__description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .target-role-card--disabled .target-role-card__description {
          color: #9ca3af;
        }

        .role-details-panel {
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
          border-radius: 12px;
          border: 1px solid #bfdbfe;
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

        .role-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .role-details-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e40af;
          margin: 0;
        }

        .role-details-hours {
          font-size: 0.875rem;
          font-weight: 500;
          color: #3b82f6;
          background: #dbeafe;
          padding: 4px 12px;
          border-radius: 16px;
        }

        .role-details-outcomes {
          margin-top: 12px;
        }

        .outcomes-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin: 0 0 12px 0;
        }

        .outcomes-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .outcome-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.875rem;
          color: #374151;
        }

        .outcome-checkmark {
          width: 16px;
          height: 16px;
          min-width: 16px;
          color: #22c55e;
          margin-top: 2px;
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
          justify-content: space-between;
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

        .btn--secondary {
          background: #ffffff;
          color: #374151;
          border: 2px solid #e5e7eb;
        }

        .btn--secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .btn--secondary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.25);
        }

        .btn--secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .step-2-target-role {
            padding: 16px;
          }

          .step-title {
            font-size: 1.5rem;
          }

          .target-role-card {
            padding: 12px;
          }

          .target-role-card__content {
            padding-right: 50px;
          }

          .target-role-card__indicator {
            width: 20px;
            height: 20px;
            min-width: 20px;
            margin-right: 12px;
          }

          .target-role-card__checkmark {
            width: 12px;
            height: 12px;
          }

          .coming-soon-badge {
            font-size: 0.5625rem;
            padding: 3px 6px;
          }

          .role-details-panel {
            padding: 16px;
          }

          .role-details-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .step-footer {
            flex-direction: column-reverse;
            gap: 12px;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Step2TargetRole;
