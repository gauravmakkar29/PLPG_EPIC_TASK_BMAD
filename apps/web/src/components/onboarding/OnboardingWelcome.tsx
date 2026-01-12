/**
 * @fileoverview Onboarding Welcome component - entry point for the onboarding flow.
 * Displays welcome message and overview of the onboarding process.
 *
 * @module @plpg/web/components/onboarding/OnboardingWelcome
 *
 * @description
 * This component serves as the entry point to the onboarding flow, providing:
 * - Welcome message with personalized greeting
 * - Overview of what the onboarding process involves
 * - Visual representation of the 4 steps
 * - "Get Started" CTA button to begin the flow
 *
 * Design Principles:
 * - Clear visual hierarchy
 * - Accessible (keyboard navigation, screen reader support)
 * - Responsive layout
 * - Consistent with PLPG design system
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { trackEvent, AnalyticsEvent } from '../../lib/analytics';

import type { JSX } from 'react';

/**
 * Props for the OnboardingWelcome component.
 *
 * @interface OnboardingWelcomeProps
 * @property {() => void} [onStart] - Optional callback when user starts onboarding
 */
export interface OnboardingWelcomeProps {
  onStart?: () => void;
}

/**
 * Step information for the visual overview.
 */
interface StepInfo {
  number: number;
  title: string;
  description: string;
  icon: string;
}

/**
 * Steps displayed in the onboarding overview.
 * @constant {StepInfo[]}
 */
const ONBOARDING_STEPS: StepInfo[] = [
  {
    number: 1,
    title: 'Current Role',
    description: 'Tell us about your current position and experience level',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    number: 2,
    title: 'Target Role',
    description: 'Choose your desired ML/AI career path',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    number: 3,
    title: 'Time Commitment',
    description: 'Set your weekly learning hours',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    number: 4,
    title: 'Skills Assessment',
    description: 'Skip topics you already know',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
];

/**
 * Onboarding Welcome component.
 * Displays the entry screen for the onboarding flow with overview and CTA.
 *
 * @param {OnboardingWelcomeProps} props - Component props
 * @returns {JSX.Element} Welcome screen component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <OnboardingWelcome />
 *
 * // With callback
 * <OnboardingWelcome onStart={() => console.log('Started!')} />
 * ```
 */
export function OnboardingWelcome({
  onStart,
}: OnboardingWelcomeProps): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { goToStep, resetOnboarding } = useOnboarding();

  /**
   * Handles the "Get Started" button click.
   * Resets any previous progress and navigates to step 1.
   */
  const handleStart = useCallback((): void => {
    // Track analytics event
    trackEvent(AnalyticsEvent.ONBOARDING_STARTED, {
      userId: user?.id,
    });

    // Reset any partial progress to start fresh
    resetOnboarding();

    // Navigate to step 1
    goToStep(1);

    // Call optional callback
    if (onStart) {
      onStart();
    }

    // Navigate to the onboarding flow
    navigate('/onboarding/step/1');
  }, [user?.id, resetOnboarding, goToStep, onStart, navigate]);

  // Get user's first name for personalized greeting
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-primary-600">PLPG</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl w-full">
          {/* Welcome section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-secondary-900 mb-4">
              Welcome, {firstName}!
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Let's create your personalized learning path to become an ML/AI
              professional. This will only take a few minutes.
            </p>
          </div>

          {/* Steps overview */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-lg font-semibold text-secondary-900 mb-6 text-center">
              What to expect
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ONBOARDING_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  {/* Step number badge */}
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-primary-600"
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
                        d={step.icon}
                      />
                    </svg>
                  </div>

                  {/* Step info */}
                  <span className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
                    Step {step.number}
                  </span>
                  <h4 className="text-base font-semibold text-secondary-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-sm text-secondary-500">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits section */}
          <div className="bg-white/50 rounded-xl p-6 mb-8">
            <h3 className="text-base font-semibold text-secondary-900 mb-4 text-center">
              After onboarding, you'll get:
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-secondary-600">
              <li className="flex items-center justify-center sm:justify-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Personalized learning roadmap
              </li>
              <li className="flex items-center justify-center sm:justify-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Curated resources for each skill
              </li>
              <li className="flex items-center justify-center sm:justify-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Progress tracking dashboard
              </li>
            </ul>
          </div>

          {/* CTA section */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-xl shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              aria-label="Start onboarding process"
            >
              Get Started
              <svg
                className="ml-2 w-5 h-5"
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <p className="mt-4 text-sm text-secondary-500">
              Takes approximately 2-3 minutes to complete
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-secondary-400">
          Your progress is saved automatically
        </p>
      </footer>
    </div>
  );
}

export default OnboardingWelcome;
