/**
 * @fileoverview Step 3 Weekly Time Budget Component for onboarding flow.
 * Allows users to specify weekly learning hours via slider input.
 *
 * @module @plpg/web/components/onboarding/Step3WeeklyTime
 * @description Third step of onboarding - weekly time commitment selection.
 *
 * @requirements
 * - AIRE-236: Story 2.4 - Step 3 Weekly Time Budget
 * - Slider input for hours (range: 5-20 hours)
 * - Default value: 10 hours
 * - Step increment: 1 hour
 * - Dynamic display showing estimated completion
 * - Visual indicator for recommended range (10-15 hours)
 * - Tooltip explaining "This affects your completion timeline"
 *
 * @designPrinciples
 * - SRP: Component handles only weekly time selection logic
 * - OCP: Extensible via configuration constants without code changes
 * - LSP: Follows consistent interface with other onboarding steps
 * - ISP: Focused props interface without unnecessary dependencies
 * - DIP: Depends on shared constants abstraction, not concrete values
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import {
  WEEKLY_HOURS_MIN,
  WEEKLY_HOURS_MAX,
  WEEKLY_HOURS_DEFAULT,
  WEEKLY_HOURS_STEP,
  WEEKLY_HOURS_RECOMMENDED_MIN,
  WEEKLY_HOURS_RECOMMENDED_MAX,
  TARGET_ROLE_METADATA,
} from '@plpg/shared';
import type { OnboardingStep3Data, WeeklyHoursOption } from '@plpg/shared';

/**
 * Props interface for Step3WeeklyTime component.
 * Follows Interface Segregation Principle with focused, minimal props.
 *
 * @interface Step3WeeklyTimeProps
 * @property {OnboardingStep3Data | null} initialData - Initial hours data if returning to step
 * @property {function} onSelectionChange - Callback when slider value changes (for auto-save)
 * @property {function} onNext - Callback when Next button is clicked
 * @property {function} onBack - Callback when Back button is clicked
 * @property {boolean} isLoading - Whether save operation is in progress
 * @property {boolean} isSaving - Whether auto-save is in progress
 * @property {number} totalEstimatedHours - Total hours needed for selected learning path
 */
export interface Step3WeeklyTimeProps {
  initialData: OnboardingStep3Data | null;
  onSelectionChange: (data: OnboardingStep3Data) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  totalEstimatedHours?: number;
}

/**
 * Calculates estimated completion weeks based on weekly hours and total hours.
 * Single Responsibility: Only handles completion time calculation logic.
 *
 * @param {number} weeklyHours - Hours per week user commits to learning
 * @param {number} totalHours - Total estimated hours for the learning path
 * @returns {number} Estimated weeks to completion (rounded up)
 */
export function calculateCompletionWeeks(
  weeklyHours: number,
  totalHours: number
): number {
  if (weeklyHours <= 0 || totalHours <= 0) return 0;
  return Math.ceil(totalHours / weeklyHours);
}

/**
 * Formats weeks into a human-readable duration string.
 * Single Responsibility: Only handles duration formatting logic.
 *
 * @param {number} weeks - Number of weeks
 * @returns {string} Formatted duration string (e.g., "~6 months" or "~30 weeks")
 */
export function formatDuration(weeks: number): string {
  if (weeks <= 0) return '—';
  if (weeks >= 8) {
    const months = Math.round(weeks / 4);
    return `~${months} month${months !== 1 ? 's' : ''}`;
  }
  return `~${weeks} week${weeks !== 1 ? 's' : ''}`;
}

/**
 * Determines if the given hours value is within the recommended range.
 * Single Responsibility: Only handles range checking logic.
 *
 * @param {number} hours - Hours per week
 * @returns {boolean} True if within recommended range (10-15 hours)
 */
export function isInRecommendedRange(hours: number): boolean {
  return hours >= WEEKLY_HOURS_RECOMMENDED_MIN && hours <= WEEKLY_HOURS_RECOMMENDED_MAX;
}

/**
 * Calculates the percentage position for the recommended range indicator.
 * Single Responsibility: Only handles percentage calculation for range visualization.
 *
 * @param {number} value - The value to calculate percentage for
 * @param {number} min - Minimum slider value
 * @param {number} max - Maximum slider value
 * @returns {number} Percentage position (0-100)
 */
export function calculateSliderPercentage(
  value: number,
  min: number = WEEKLY_HOURS_MIN,
  max: number = WEEKLY_HOURS_MAX
): number {
  return ((value - min) / (max - min)) * 100;
}

/**
 * Step 3 Weekly Time Budget Component.
 *
 * Renders a slider-based time commitment UI with the following features:
 * - Range slider for selecting weekly hours (5-20)
 * - Default value of 10 hours
 * - Step increment of 1 hour
 * - Dynamic completion estimate display
 * - Visual indicator for recommended range (10-15 hours)
 * - Informational tooltip about timeline impact
 * - Back and Next navigation buttons
 *
 * @param {Step3WeeklyTimeProps} props - Component props
 * @returns {JSX.Element} Rendered Step 3 component
 *
 * @example
 * ```tsx
 * <Step3WeeklyTime
 *   initialData={{ weeklyHours: 10 }}
 *   onSelectionChange={(data) => saveToApi(data)}
 *   onNext={() => goToStep4()}
 *   onBack={() => goToStep2()}
 *   isLoading={false}
 *   isSaving={false}
 *   totalEstimatedHours={300}
 * />
 * ```
 */
export function Step3WeeklyTime({
  initialData,
  onSelectionChange,
  onNext,
  onBack,
  isLoading = false,
  isSaving = false,
  totalEstimatedHours = TARGET_ROLE_METADATA.ml_engineer.estimatedHours,
}: Step3WeeklyTimeProps): JSX.Element {
  // State for selected weekly hours
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHoursOption>(
    initialData?.weeklyHours ?? WEEKLY_HOURS_DEFAULT
  );

  // State for tooltip visibility
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  /**
   * Memoized completion estimate based on current selection.
   * Dependency Inversion: Uses abstracted calculation function.
   *
   * @returns {number} Estimated weeks to completion
   */
  const completionWeeks = useMemo((): number => {
    return calculateCompletionWeeks(weeklyHours, totalEstimatedHours);
  }, [weeklyHours, totalEstimatedHours]);

  /**
   * Memoized formatted duration string.
   *
   * @returns {string} Formatted duration display
   */
  const formattedDuration = useMemo((): string => {
    return formatDuration(completionWeeks);
  }, [completionWeeks]);

  /**
   * Memoized check if current value is in recommended range.
   *
   * @returns {boolean} Whether current value is recommended
   */
  const isRecommended = useMemo((): boolean => {
    return isInRecommendedRange(weeklyHours);
  }, [weeklyHours]);

  /**
   * Calculates slider fill percentage for styling.
   *
   * @returns {number} Percentage for slider fill
   */
  const sliderFillPercentage = useMemo((): number => {
    return calculateSliderPercentage(weeklyHours);
  }, [weeklyHours]);

  /**
   * Recommended range positions for visual indicator.
   */
  const recommendedRangeStart = useMemo((): number => {
    return calculateSliderPercentage(WEEKLY_HOURS_RECOMMENDED_MIN);
  }, []);

  const recommendedRangeEnd = useMemo((): number => {
    return calculateSliderPercentage(WEEKLY_HOURS_RECOMMENDED_MAX);
  }, []);

  /**
   * Handles slider value change.
   * Triggers auto-save callback on valid change.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Slider change event
   */
  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const newValue = parseInt(event.target.value, 10);

      if (isNaN(newValue) || newValue < WEEKLY_HOURS_MIN || newValue > WEEKLY_HOURS_MAX) {
        return;
      }

      setWeeklyHours(newValue);

      // Build the data object for auto-save
      const data: OnboardingStep3Data = {
        weeklyHours: newValue,
      };

      // Trigger auto-save callback
      onSelectionChange(data);
    },
    [onSelectionChange]
  );

  /**
   * Handles Next button click.
   * Proceeds to next step.
   */
  const handleNextClick = useCallback((): void => {
    onNext();
  }, [onNext]);

  /**
   * Handles Back button click.
   * Navigates to previous step without validation.
   */
  const handleBackClick = useCallback((): void => {
    onBack();
  }, [onBack]);

  /**
   * Shows tooltip on mouse enter.
   */
  const handleTooltipShow = useCallback((): void => {
    setShowTooltip(true);
  }, []);

  /**
   * Hides tooltip on mouse leave.
   */
  const handleTooltipHide = useCallback((): void => {
    setShowTooltip(false);
  }, []);

  // Sync initial data on mount or when initialData changes
  useEffect(() => {
    if (initialData?.weeklyHours !== undefined) {
      setWeeklyHours(initialData.weeklyHours);
    }
  }, [initialData]);

  return (
    <div className="step-3-weekly-time" data-testid="step-3-weekly-time">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">How much time can you dedicate?</h2>
        <p className="step-description">
          Set your weekly learning commitment. This helps us calculate a realistic timeline for your journey.
        </p>
      </div>

      {/* Slider Container */}
      <div className="slider-container" data-testid="slider-container">
        {/* Current Value Display */}
        <div className="value-display" data-testid="value-display">
          <span className="value-number">{weeklyHours}</span>
          <span className="value-unit">hours/week</span>
        </div>

        {/* Slider with Recommended Range Indicator */}
        <div className="slider-wrapper">
          {/* Recommended Range Background */}
          <div
            className="recommended-range"
            data-testid="recommended-range"
            style={{
              left: `${recommendedRangeStart}%`,
              width: `${recommendedRangeEnd - recommendedRangeStart}%`,
            }}
            aria-hidden="true"
          />

          {/* Range Slider */}
          <input
            type="range"
            id="weekly-hours-slider"
            min={WEEKLY_HOURS_MIN}
            max={WEEKLY_HOURS_MAX}
            step={WEEKLY_HOURS_STEP}
            value={weeklyHours}
            onChange={handleSliderChange}
            disabled={isLoading}
            className="slider"
            data-testid="weekly-hours-slider"
            aria-label="Weekly hours commitment"
            aria-valuemin={WEEKLY_HOURS_MIN}
            aria-valuemax={WEEKLY_HOURS_MAX}
            aria-valuenow={weeklyHours}
            aria-valuetext={`${weeklyHours} hours per week`}
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sliderFillPercentage}%, #e5e7eb ${sliderFillPercentage}%, #e5e7eb 100%)`,
            }}
          />

          {/* Slider Labels */}
          <div className="slider-labels" aria-hidden="true">
            <span className="slider-label slider-label--min">{WEEKLY_HOURS_MIN}h</span>
            <span className="slider-label slider-label--max">{WEEKLY_HOURS_MAX}h</span>
          </div>
        </div>

        {/* Recommended Range Indicator Text */}
        <div
          className={`recommended-indicator ${isRecommended ? 'recommended-indicator--active' : ''}`}
          data-testid="recommended-indicator"
        >
          <svg
            className="recommended-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>
            {isRecommended
              ? 'Great choice! This is within the recommended range.'
              : `Recommended: ${WEEKLY_HOURS_RECOMMENDED_MIN}-${WEEKLY_HOURS_RECOMMENDED_MAX} hours/week`}
          </span>
        </div>
      </div>

      {/* Completion Estimate Panel */}
      <div
        className="estimate-panel"
        data-testid="estimate-panel"
        aria-live="polite"
      >
        <div className="estimate-content">
          <div className="estimate-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="estimate-text">
            <span className="estimate-label">Estimated completion:</span>
            <span className="estimate-value" data-testid="completion-estimate">
              {formattedDuration}
            </span>
          </div>
        </div>
        <p className="estimate-detail" data-testid="estimate-detail">
          At {weeklyHours} hours/week, you&apos;ll complete in approximately {completionWeeks} weeks
        </p>
      </div>

      {/* Tooltip Info */}
      <div
        className="tooltip-trigger"
        onMouseEnter={handleTooltipShow}
        onMouseLeave={handleTooltipHide}
        onFocus={handleTooltipShow}
        onBlur={handleTooltipHide}
        tabIndex={0}
        role="button"
        aria-describedby="timeline-tooltip"
        data-testid="tooltip-trigger"
      >
        <svg
          className="info-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>How does this affect my timeline?</span>

        {/* Tooltip Content */}
        {showTooltip && (
          <div
            id="timeline-tooltip"
            className="tooltip"
            role="tooltip"
            data-testid="timeline-tooltip"
          >
            <p>This affects your completion timeline</p>
            <p className="tooltip-detail">
              Your weekly commitment determines how quickly you&apos;ll progress through the curriculum.
              You can always adjust this later in your settings.
            </p>
          </div>
        )}
      </div>

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
          disabled={isLoading}
          data-testid="next-button"
        >
          {isLoading ? 'Loading...' : 'Next'}
        </button>
      </div>

      {/* Scoped Styles */}
      <style>{`
        .step-3-weekly-time {
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

        .slider-container {
          margin-bottom: 24px;
        }

        .value-display {
          text-align: center;
          margin-bottom: 24px;
        }

        .value-number {
          font-size: 3.5rem;
          font-weight: 700;
          color: #3b82f6;
          line-height: 1;
        }

        .value-unit {
          display: block;
          font-size: 1rem;
          color: #6b7280;
          margin-top: 4px;
        }

        .slider-wrapper {
          position: relative;
          padding: 20px 0;
        }

        .recommended-range {
          position: absolute;
          top: 50%;
          height: 8px;
          background: rgba(34, 197, 94, 0.2);
          border-radius: 4px;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 0;
        }

        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
          position: relative;
          z-index: 1;
          background: transparent;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        }

        .slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
        }

        .slider:focus::-moz-range-thumb {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
        }

        .slider:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .slider:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }

        .slider:disabled::-moz-range-thumb {
          cursor: not-allowed;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .slider-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .recommended-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          font-size: 0.875rem;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .recommended-indicator--active {
          color: #22c55e;
        }

        .recommended-icon {
          width: 16px;
          height: 16px;
        }

        .recommended-indicator--active .recommended-icon {
          fill: #22c55e;
          stroke: #22c55e;
        }

        .estimate-panel {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .estimate-content {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .estimate-icon {
          width: 40px;
          height: 40px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .estimate-icon svg {
          width: 20px;
          height: 20px;
          color: #ffffff;
        }

        .estimate-text {
          display: flex;
          flex-direction: column;
        }

        .estimate-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .estimate-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e40af;
        }

        .estimate-detail {
          font-size: 0.875rem;
          color: #374151;
          margin: 0;
          padding-left: 52px;
        }

        .tooltip-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.875rem;
          color: #6b7280;
          cursor: help;
          position: relative;
          margin-bottom: 24px;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .tooltip-trigger:hover,
        .tooltip-trigger:focus {
          background: #f3f4f6;
          outline: none;
        }

        .info-icon {
          width: 16px;
          height: 16px;
        }

        .tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: #ffffff;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          width: 280px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          z-index: 100;
          animation: tooltipFadeIn 0.15s ease;
        }

        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 8px solid transparent;
          border-top-color: #1f2937;
        }

        .tooltip p {
          margin: 0;
        }

        .tooltip p:first-child {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .tooltip-detail {
          font-size: 0.8125rem;
          color: #d1d5db;
          line-height: 1.4;
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
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
          .step-3-weekly-time {
            padding: 16px;
          }

          .step-title {
            font-size: 1.5rem;
          }

          .value-number {
            font-size: 2.5rem;
          }

          .estimate-panel {
            padding: 16px;
          }

          .estimate-detail {
            padding-left: 0;
            margin-top: 8px;
          }

          .tooltip {
            width: 240px;
            left: 0;
            transform: translateX(0);
          }

          .tooltip::after {
            left: 24px;
            transform: translateX(0);
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

export default Step3WeeklyTime;
