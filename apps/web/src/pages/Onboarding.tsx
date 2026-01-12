/**
 * @fileoverview Onboarding page component for PLPG.
 * Manages the multi-step onboarding flow for new users.
 *
 * @module @plpg/web/pages/Onboarding
 *
 * @description
 * This component orchestrates the onboarding flow including:
 * - Multi-step wizard navigation
 * - Progress indicator
 * - Auto-save on selection changes
 * - Data persistence across steps
 * - Redirect to dashboard on completion
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - AIRE-238: Story 2.6 - Onboarding Completion
 * - Selection saved immediately (no data loss on navigation)
 * - Next button enabled only after selection
 * - Summary screen showing all selections
 * - Generate My Path button triggers roadmap generation
 * - Success redirects to Path Preview
 *
 * @example
 * ```tsx
 * <Route path="/onboarding" element={<Onboarding />} />
 * ```
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../hooks/useOnboarding';
import { Step1CurrentRole, Step5Summary } from '../components/onboarding';
import type { OnboardingSummaryData } from '../components/onboarding';
import type {
  OnboardingStep1Data,
  OnboardingStep2Data,
  OnboardingStep3Data,
  OnboardingStep4Data,
} from '@plpg/shared';

/**
 * API base URL for onboarding endpoints.
 *
 * @constant API_BASE_URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * Total number of steps in the onboarding flow.
 *
 * @constant TOTAL_STEPS
 */
const TOTAL_STEPS = 5;

/**
 * Step titles for progress indicator.
 *
 * @constant STEP_TITLES
 */
const STEP_TITLES: Record<number, string> = {
  1: 'Current Role',
  2: 'Target Role',
  3: 'Weekly Hours',
  4: 'Skills Assessment',
  5: 'Summary',
};

/**
 * Progress Indicator Component.
 *
 * Renders a visual progress bar showing the current step in the onboarding flow.
 *
 * @param {object} props - Component props
 * @param {number} props.currentStep - Current step number (1-based)
 * @param {number} props.totalSteps - Total number of steps
 * @returns {JSX.Element} Progress indicator component
 */
function ProgressIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}): JSX.Element {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="progress-indicator" data-testid="progress-indicator">
      <div className="progress-steps">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              className={`progress-step ${isCompleted ? 'progress-step--completed' : ''} ${isCurrent ? 'progress-step--current' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="progress-step__number">
                {isCompleted ? (
                  <svg
                    className="progress-step__check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <div className="progress-step__label">
                {STEP_TITLES[stepNumber]}
              </div>
            </div>
          );
        })}
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Step ${currentStep} of ${totalSteps}`}
        />
      </div>
    </div>
  );
}

/**
 * Onboarding page component.
 *
 * Renders a multi-step wizard for collecting user preferences:
 * - Step 1: Current Role Selection
 * - Step 2: Target Role Selection (placeholder)
 * - Step 3: Weekly Hours Commitment (placeholder)
 * - Step 4: Skills Assessment (placeholder)
 * - Step 5: Summary & Confirmation
 *
 * Features:
 * - Auto-save on selection changes
 * - Progress indicator
 * - Navigation between steps
 * - Edit functionality from summary
 * - Authentication check (redirect to sign-in if not authenticated)
 *
 * @returns {JSX.Element} Onboarding page component
 *
 * @component
 */
export function Onboarding(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();

  // Onboarding state management
  const {
    step1Data,
    currentStep,
    isLoading,
    isSaving,
    error,
    saveStep1,
    goToNextStep,
    goToPreviousStep,
  } = useOnboarding();

  // Local state for current step display
  const [displayStep, setDisplayStep] = useState(currentStep);

  // Local state for step data (steps 2-4 are placeholders, using mock data)
  const [step2Data, setStep2Data] = useState<OnboardingStep2Data | null>({
    targetRole: 'ml_engineer',
  });
  const [step3Data, setStep3Data] = useState<OnboardingStep3Data | null>({
    weeklyHours: 10,
  });
  const [step4Data, setStep4Data] = useState<OnboardingStep4Data | null>({
    skillsToSkip: [],
  });

  // State for path generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/sign-in', { state: { from: '/onboarding' } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Sync display step with hook state
  useEffect(() => {
    setDisplayStep(currentStep);
  }, [currentStep]);

  /**
   * Memoized summary data for Step 5.
   */
  const summaryData = useMemo<OnboardingSummaryData>(
    () => ({
      step1: step1Data,
      step2: step2Data,
      step3: step3Data,
      step4: step4Data,
    }),
    [step1Data, step2Data, step3Data, step4Data]
  );

  /**
   * Handles step 1 selection change.
   * Auto-saves the selection to the backend.
   *
   * @param {OnboardingStep1Data} data - Step 1 form data
   */
  const handleStep1Change = useCallback(
    (data: OnboardingStep1Data): void => {
      saveStep1(data);
    },
    [saveStep1]
  );

  /**
   * Handles navigation to next step.
   */
  const handleNext = useCallback((): void => {
    goToNextStep();
  }, [goToNextStep]);

  /**
   * Handles navigation to previous step.
   */
  const handleBack = useCallback((): void => {
    goToPreviousStep();
  }, [goToPreviousStep]);

  /**
   * Handles navigation to a specific step (for edit functionality).
   *
   * @param {number} step - Step number to navigate to
   */
  const handleGoToStep = useCallback((step: number): void => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setDisplayStep(step);
    }
  }, []);

  /**
   * Handles Generate My Path button click.
   * Calls the completion API and redirects on success.
   */
  const handleGeneratePath = useCallback(async (): Promise<void> => {
    if (!token) {
      setGenerateError('Authentication required. Please sign in again.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Success - redirect to dashboard/path preview
        navigate('/dashboard', { replace: true });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setGenerateError(
          errorData.message || 'Failed to generate your learning path. Please try again.'
        );
      }
    } catch (err) {
      console.error('Error generating path:', err);
      setGenerateError('Unable to connect to server. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [token, navigate]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="onboarding-loading" data-testid="onboarding-loading">
        <div className="onboarding-loading__spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Render current step
  const renderStep = (): JSX.Element => {
    switch (displayStep) {
      case 1:
        return (
          <Step1CurrentRole
            initialData={step1Data}
            onSelectionChange={handleStep1Change}
            onNext={handleNext}
            isLoading={isLoading}
            isSaving={isSaving}
          />
        );
      case 2:
        // Placeholder for Step 2 - Target Role (to be implemented in future stories)
        return (
          <div className="step-placeholder" data-testid="step-2-placeholder">
            <h2>Step 2: Target Role</h2>
            <p>Coming soon...</p>
            <div className="step-navigation">
              <button onClick={handleBack} className="btn btn--secondary">
                Back
              </button>
              <button onClick={handleNext} className="btn btn--primary">
                Next
              </button>
            </div>
          </div>
        );
      case 3:
        // Placeholder for Step 3 - Weekly Hours
        return (
          <div className="step-placeholder" data-testid="step-3-placeholder">
            <h2>Step 3: Weekly Hours</h2>
            <p>Coming soon...</p>
            <div className="step-navigation">
              <button onClick={handleBack} className="btn btn--secondary">
                Back
              </button>
              <button onClick={handleNext} className="btn btn--primary">
                Next
              </button>
            </div>
          </div>
        );
      case 4:
        // Placeholder for Step 4 - Skills Assessment
        return (
          <div className="step-placeholder" data-testid="step-4-placeholder">
            <h2>Step 4: Skills Assessment</h2>
            <p>Coming soon...</p>
            <div className="step-navigation">
              <button onClick={handleBack} className="btn btn--secondary">
                Back
              </button>
              <button onClick={handleNext} className="btn btn--primary">
                Next
              </button>
            </div>
          </div>
        );
      case 5:
        // Step 5 - Summary & Confirmation
        return (
          <Step5Summary
            summaryData={summaryData}
            onEditStep={handleGoToStep}
            onGeneratePath={handleGeneratePath}
            onBack={handleBack}
            isGenerating={isGenerating}
            error={generateError}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="onboarding-page" data-testid="onboarding-page">
      {/* Header */}
      <header className="onboarding-header">
        <div className="onboarding-header__logo">
          <span className="logo-text">PLPG</span>
        </div>
        <div className="onboarding-header__title">
          <h1>Let&apos;s personalize your learning journey</h1>
        </div>
      </header>

      {/* Progress Indicator */}
      <ProgressIndicator currentStep={displayStep} totalSteps={TOTAL_STEPS} />

      {/* Error Display */}
      {error && (
        <div className="onboarding-error" role="alert" data-testid="onboarding-error">
          <span className="onboarding-error__icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <main className="onboarding-content">{renderStep()}</main>

      {/* Inline Styles */}
      <style>{`
        .onboarding-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 24px;
        }

        .onboarding-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .onboarding-header__logo {
          margin-bottom: 16px;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
          letter-spacing: 0.1em;
        }

        .onboarding-header__title h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0;
        }

        .progress-indicator {
          max-width: 800px;
          margin: 0 auto 32px;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .progress-step__number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }

        .progress-step--current .progress-step__number {
          background: #3b82f6;
          color: #ffffff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        .progress-step--completed .progress-step__number {
          background: #10b981;
          color: #ffffff;
        }

        .progress-step__check {
          width: 16px;
          height: 16px;
        }

        .progress-step__label {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        .progress-step--current .progress-step__label {
          color: #3b82f6;
          font-weight: 600;
        }

        .progress-step--completed .progress-step__label {
          color: #10b981;
        }

        .progress-bar {
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar__fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
          transition: width 0.3s ease;
        }

        .onboarding-content {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .onboarding-error {
          max-width: 800px;
          margin: 0 auto 16px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .onboarding-error__icon {
          width: 20px;
          height: 20px;
          background: #dc2626;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .onboarding-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .onboarding-loading__spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .step-placeholder {
          text-align: center;
          padding: 48px 24px;
        }

        .step-placeholder h2 {
          font-size: 1.5rem;
          color: #1a1a2e;
          margin-bottom: 8px;
        }

        .step-placeholder p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .step-navigation {
          display: flex;
          justify-content: center;
          gap: 16px;
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

        .btn--primary:hover {
          background: #2563eb;
        }

        .btn--secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn--secondary:hover {
          background: #e5e7eb;
        }

        @media (max-width: 640px) {
          .onboarding-page {
            padding: 16px;
          }

          .onboarding-header__title h1 {
            font-size: 1.25rem;
          }

          .progress-step__label {
            display: none;
          }

          .onboarding-content {
            padding: 16px;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Onboarding;
