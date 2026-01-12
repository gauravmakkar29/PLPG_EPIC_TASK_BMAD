/**
 * @fileoverview Step 5 Summary Component for onboarding completion.
 * Displays a summary of all user selections and generates the learning path.
 *
 * @module @plpg/web/components/onboarding/Step5Summary
 * @description Final step of onboarding - summary review and path generation.
 *
 * @requirements
 * - AIRE-238: Story 2.6 - Onboarding Completion
 * - Summary screen showing all selections
 * - Edit links to return to specific steps
 * - Generate My Path primary CTA button
 * - Loading state during generation (<3s target)
 * - Success redirects to Path Preview (E4)
 *
 * @designPrinciples
 * - SRP: Component handles only summary display and path generation trigger
 * - OCP: Extensible via SUMMARY_SECTIONS configuration without code changes
 * - LSP: Follows consistent interface with other onboarding steps
 * - ISP: Focused props interface without unnecessary dependencies
 * - DIP: Depends on shared constants abstraction, not concrete values
 */

import { useState, useCallback, useMemo } from 'react';
import type { JSX, ReactNode } from 'react';
import {
  CURRENT_ROLE_NAMES,
  TARGET_ROLE_NAMES,
  TARGET_ROLE_METADATA,
  getPrerequisiteSkillById,
  PREREQUISITE_SKILLS,
} from '@plpg/shared';
import type {
  CurrentRole,
  TargetRole,
  OnboardingStep1Data,
  OnboardingStep2Data,
  OnboardingStep3Data,
  OnboardingStep4Data,
} from '@plpg/shared';
import { calculateCompletionWeeks, formatDuration } from './Step3WeeklyTime';

/**
 * Complete onboarding data for summary display.
 * Aggregates all step data for final review.
 *
 * @interface OnboardingSummaryData
 */
export interface OnboardingSummaryData {
  step1: OnboardingStep1Data | null;
  step2: OnboardingStep2Data | null;
  step3: OnboardingStep3Data | null;
  step4: OnboardingStep4Data | null;
}

/**
 * Props interface for Step5Summary component.
 * Follows Interface Segregation Principle with focused, minimal props.
 *
 * @interface Step5SummaryProps
 * @property {OnboardingSummaryData} summaryData - Aggregated data from all previous steps
 * @property {function} onEditStep - Callback to navigate back to a specific step
 * @property {function} onGeneratePath - Callback when Generate My Path is clicked
 * @property {function} onBack - Callback when Back button is clicked
 * @property {boolean} isGenerating - Whether path generation is in progress
 * @property {string | null} error - Error message if generation failed
 */
export interface Step5SummaryProps {
  summaryData: OnboardingSummaryData;
  onEditStep: (step: number) => void;
  onGeneratePath: () => Promise<void>;
  onBack: () => void;
  isGenerating?: boolean;
  error?: string | null;
}

/**
 * Summary section configuration interface.
 * Defines structure for extensible summary sections.
 *
 * @interface SummarySectionConfig
 */
interface SummarySectionConfig {
  id: string;
  label: string;
  step: number;
  icon: ReactNode;
}

/**
 * Summary section configurations.
 * Open for extension - add new sections here without modifying render logic.
 *
 * @constant SUMMARY_SECTIONS
 */
const SUMMARY_SECTIONS: ReadonlyArray<SummarySectionConfig> = [
  {
    id: 'currentRole',
    label: 'Current Role',
    step: 1,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'targetRole',
    label: 'Target Role',
    step: 2,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'weeklyHours',
    label: 'Weekly Commitment',
    step: 3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'skillsToSkip',
    label: 'Skills to Skip',
    step: 4,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
] as const;

/**
 * Gets display name for current role.
 * Single Responsibility: Only handles current role display name resolution.
 *
 * @param {OnboardingStep1Data | null} step1Data - Step 1 data containing role
 * @returns {string} Display name for the current role
 */
export function getCurrentRoleDisplayName(
  step1Data: OnboardingStep1Data | null
): string {
  if (!step1Data?.currentRole) return 'Not selected';
  if (step1Data.currentRole === 'other' && step1Data.customRoleText) {
    return step1Data.customRoleText;
  }
  return CURRENT_ROLE_NAMES[step1Data.currentRole] || 'Not selected';
}

/**
 * Gets display name for target role.
 * Single Responsibility: Only handles target role display name resolution.
 *
 * @param {OnboardingStep2Data | null} step2Data - Step 2 data containing target role
 * @returns {string} Display name for the target role
 */
export function getTargetRoleDisplayName(
  step2Data: OnboardingStep2Data | null
): string {
  if (!step2Data?.targetRole) return 'Not selected';
  return TARGET_ROLE_NAMES[step2Data.targetRole] || 'Not selected';
}

/**
 * Gets display text for weekly hours commitment.
 * Single Responsibility: Only handles weekly hours formatting.
 *
 * @param {OnboardingStep3Data | null} step3Data - Step 3 data containing weekly hours
 * @returns {string} Formatted weekly hours string
 */
export function getWeeklyHoursDisplayText(
  step3Data: OnboardingStep3Data | null
): string {
  if (!step3Data?.weeklyHours) return 'Not selected';
  return `${step3Data.weeklyHours} hours/week`;
}

/**
 * Gets display text for skills to skip.
 * Single Responsibility: Only handles skills to skip formatting.
 *
 * @param {OnboardingStep4Data | null} step4Data - Step 4 data containing skills to skip
 * @returns {string} Formatted skills count or list
 */
export function getSkillsToSkipDisplayText(
  step4Data: OnboardingStep4Data | null
): string {
  if (!step4Data?.skillsToSkip || step4Data.skillsToSkip.length === 0) {
    return 'None selected (all content included)';
  }
  const count = step4Data.skillsToSkip.length;
  const total = PREREQUISITE_SKILLS.length;
  return `${count} of ${total} skills`;
}

/**
 * Gets the list of skill names being skipped.
 * Single Responsibility: Only handles skill name resolution.
 *
 * @param {OnboardingStep4Data | null} step4Data - Step 4 data containing skills to skip
 * @returns {string[]} Array of skill names being skipped
 */
export function getSkillNamesToSkip(
  step4Data: OnboardingStep4Data | null
): string[] {
  if (!step4Data?.skillsToSkip) return [];
  return step4Data.skillsToSkip
    .map((id) => {
      const skill = getPrerequisiteSkillById(id);
      return skill?.name || '';
    })
    .filter(Boolean);
}

/**
 * Calculates estimated completion display text.
 * Single Responsibility: Only handles completion estimate calculation.
 *
 * @param {OnboardingStep2Data | null} step2Data - Step 2 data for total hours lookup
 * @param {OnboardingStep3Data | null} step3Data - Step 3 data for weekly hours
 * @param {OnboardingStep4Data | null} step4Data - Step 4 data for time saved calculation
 * @returns {string} Formatted estimated completion string
 */
export function getEstimatedCompletionText(
  step2Data: OnboardingStep2Data | null,
  step3Data: OnboardingStep3Data | null,
  step4Data: OnboardingStep4Data | null
): string {
  if (!step2Data?.targetRole || !step3Data?.weeklyHours) {
    return 'Unable to calculate';
  }

  const metadata = TARGET_ROLE_METADATA[step2Data.targetRole];
  if (!metadata) return 'Unable to calculate';

  // Calculate time saved from skipped skills (approximate 10 hours per skill)
  const skillsSkipped = step4Data?.skillsToSkip?.length || 0;
  const timeSaved = skillsSkipped * 10;
  const adjustedTotalHours = Math.max(metadata.estimatedHours - timeSaved, 50);

  const weeks = calculateCompletionWeeks(step3Data.weeklyHours, adjustedTotalHours);
  return formatDuration(weeks);
}

/**
 * Validates if all required data is present for path generation.
 * Single Responsibility: Only handles validation logic.
 *
 * @param {OnboardingSummaryData} data - Summary data to validate
 * @returns {{ isValid: boolean; missingSteps: number[] }} Validation result
 */
export function validateSummaryData(
  data: OnboardingSummaryData
): { isValid: boolean; missingSteps: number[] } {
  const missingSteps: number[] = [];

  if (!data.step1?.currentRole) {
    missingSteps.push(1);
  }
  if (!data.step2?.targetRole) {
    missingSteps.push(2);
  }
  if (!data.step3?.weeklyHours) {
    missingSteps.push(3);
  }
  // Step 4 is optional - skillsToSkip can be empty

  return {
    isValid: missingSteps.length === 0,
    missingSteps,
  };
}

/**
 * Step 5 Summary Component.
 *
 * Renders the onboarding completion summary with the following features:
 * - Summary of all user selections from steps 1-4
 * - Edit links to navigate back to specific steps
 * - Estimated completion time display
 * - "Generate My Path" primary CTA button
 * - Loading state during path generation
 * - Error display if generation fails
 * - Back button for navigation
 *
 * @param {Step5SummaryProps} props - Component props
 * @returns {JSX.Element} Rendered Step 5 component
 *
 * @example
 * ```tsx
 * <Step5Summary
 *   summaryData={{
 *     step1: { currentRole: 'backend_developer' },
 *     step2: { targetRole: 'ml_engineer' },
 *     step3: { weeklyHours: 10 },
 *     step4: { skillsToSkip: [] }
 *   }}
 *   onEditStep={(step) => goToStep(step)}
 *   onGeneratePath={async () => await generateRoadmap()}
 *   onBack={() => goToStep4()}
 *   isGenerating={false}
 *   error={null}
 * />
 * ```
 */
export function Step5Summary({
  summaryData,
  onEditStep,
  onGeneratePath,
  onBack,
  isGenerating = false,
  error = null,
}: Step5SummaryProps): JSX.Element {
  // Local state for tracking generation attempt
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  /**
   * Memoized validation result.
   */
  const validation = useMemo(
    () => validateSummaryData(summaryData),
    [summaryData]
  );

  /**
   * Memoized estimated completion text.
   */
  const estimatedCompletion = useMemo(
    () =>
      getEstimatedCompletionText(
        summaryData.step2,
        summaryData.step3,
        summaryData.step4
      ),
    [summaryData.step2, summaryData.step3, summaryData.step4]
  );

  /**
   * Memoized skill names to skip.
   */
  const skillNamesToSkip = useMemo(
    () => getSkillNamesToSkip(summaryData.step4),
    [summaryData.step4]
  );

  /**
   * Handles edit link click.
   * Navigates to the specified step for editing.
   *
   * @param {number} step - Step number to navigate to
   */
  const handleEditClick = useCallback(
    (step: number): void => {
      onEditStep(step);
    },
    [onEditStep]
  );

  /**
   * Handles Generate My Path button click.
   * Triggers path generation if validation passes.
   */
  const handleGenerateClick = useCallback(async (): Promise<void> => {
    setHasAttemptedGeneration(true);

    if (!validation.isValid) {
      return;
    }

    await onGeneratePath();
  }, [validation.isValid, onGeneratePath]);

  /**
   * Handles Back button click.
   */
  const handleBackClick = useCallback((): void => {
    onBack();
  }, [onBack]);

  /**
   * Gets the value display for a summary section.
   *
   * @param {string} sectionId - Section identifier
   * @returns {string} Display value for the section
   */
  const getSectionValue = (sectionId: string): string => {
    switch (sectionId) {
      case 'currentRole':
        return getCurrentRoleDisplayName(summaryData.step1);
      case 'targetRole':
        return getTargetRoleDisplayName(summaryData.step2);
      case 'weeklyHours':
        return getWeeklyHoursDisplayText(summaryData.step3);
      case 'skillsToSkip':
        return getSkillsToSkipDisplayText(summaryData.step4);
      default:
        return 'Unknown';
    }
  };

  /**
   * Checks if a section has missing data.
   *
   * @param {number} step - Step number to check
   * @returns {boolean} True if step has missing required data
   */
  const isSectionMissing = (step: number): boolean => {
    return validation.missingSteps.includes(step);
  };

  return (
    <div className="step-5-summary" data-testid="step-5-summary">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">Review Your Selections</h2>
        <p className="step-description">
          Please review your choices before we generate your personalized learning path.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards" data-testid="summary-cards">
        {SUMMARY_SECTIONS.map((section) => (
          <div
            key={section.id}
            className={`summary-card ${isSectionMissing(section.step) ? 'summary-card--error' : ''}`}
            data-testid={`summary-card-${section.id}`}
          >
            <div className="summary-card__header">
              <div className="summary-card__icon">{section.icon}</div>
              <span className="summary-card__label">{section.label}</span>
              <button
                type="button"
                className="summary-card__edit-btn"
                onClick={() => handleEditClick(section.step)}
                data-testid={`edit-step-${section.step}`}
                aria-label={`Edit ${section.label}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>
            <div className="summary-card__value">
              {getSectionValue(section.id)}
              {isSectionMissing(section.step) && (
                <span className="summary-card__missing">Required</span>
              )}
            </div>
            {/* Show skill names for skills to skip section */}
            {section.id === 'skillsToSkip' && skillNamesToSkip.length > 0 && (
              <div className="summary-card__details" data-testid="skills-details">
                <ul className="skills-list">
                  {skillNamesToSkip.map((name) => (
                    <li key={name} className="skills-list__item">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estimated Completion */}
      <div className="estimated-completion" data-testid="estimated-completion">
        <div className="estimated-completion__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="estimated-completion__content">
          <span className="estimated-completion__label">Estimated Completion</span>
          <span className="estimated-completion__value">{estimatedCompletion}</span>
        </div>
      </div>

      {/* Validation Error */}
      {hasAttemptedGeneration && !validation.isValid && (
        <div className="validation-error" role="alert" data-testid="validation-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            Please complete the following steps before generating your path:{' '}
            {validation.missingSteps.map((step) => `Step ${step}`).join(', ')}
          </span>
        </div>
      )}

      {/* API Error */}
      {error && (
        <div className="api-error" role="alert" data-testid="api-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="step-footer">
        <button
          type="button"
          className="btn btn--secondary btn--back"
          onClick={handleBackClick}
          disabled={isGenerating}
          data-testid="back-button"
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn--primary btn--generate"
          onClick={handleGenerateClick}
          disabled={isGenerating || (!validation.isValid && hasAttemptedGeneration)}
          data-testid="generate-path-button"
        >
          {isGenerating ? (
            <>
              <span className="btn__spinner" aria-hidden="true" />
              Generating...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Generate My Path
            </>
          )}
        </button>
      </div>

      {/* Scoped Styles */}
      <style>{`
        .step-5-summary {
          max-width: 720px;
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
          max-width: 480px;
          margin: 0 auto;
        }

        .summary-cards {
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px 20px;
          transition: all 0.2s ease;
        }

        .summary-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .summary-card--error {
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .summary-card__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .summary-card__icon {
          width: 24px;
          height: 24px;
          color: #6b7280;
        }

        .summary-card__icon svg {
          width: 100%;
          height: 100%;
        }

        .summary-card__label {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-card__edit-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .summary-card__edit-btn:hover {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .summary-card__edit-btn svg {
          width: 14px;
          height: 14px;
        }

        .summary-card__value {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a2e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .summary-card__missing {
          font-size: 0.75rem;
          font-weight: 500;
          color: #dc2626;
          background: #fee2e2;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .summary-card__details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .skills-list__item {
          font-size: 0.8125rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 16px;
        }

        .estimated-completion {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .estimated-completion__icon {
          width: 40px;
          height: 40px;
          background: #3b82f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }

        .estimated-completion__icon svg {
          width: 24px;
          height: 24px;
        }

        .estimated-completion__content {
          display: flex;
          flex-direction: column;
        }

        .estimated-completion__label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .estimated-completion__value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a2e;
        }

        .validation-error,
        .api-error {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.875rem;
        }

        .validation-error {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          color: #92400e;
        }

        .api-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .validation-error svg,
        .api-error svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .step-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn svg {
          width: 20px;
          height: 20px;
        }

        .btn--primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn--primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          transform: translateY(-1px);
        }

        .btn--primary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }

        .btn--primary:disabled {
          background: #9ca3af;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
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

        .btn__spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .btn--generate {
          min-width: 200px;
        }

        @media (max-width: 640px) {
          .step-5-summary {
            padding: 16px;
          }

          .step-title {
            font-size: 1.5rem;
          }

          .summary-card {
            padding: 14px 16px;
          }

          .summary-card__header {
            flex-wrap: wrap;
          }

          .summary-card__label {
            font-size: 0.75rem;
          }

          .summary-card__value {
            font-size: 1rem;
          }

          .estimated-completion {
            padding: 16px;
          }

          .estimated-completion__value {
            font-size: 1.25rem;
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

export default Step5Summary;
