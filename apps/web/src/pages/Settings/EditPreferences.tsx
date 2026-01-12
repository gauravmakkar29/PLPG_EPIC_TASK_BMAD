/**
 * @fileoverview Edit Preferences page for re-onboarding.
 * Allows users to modify their onboarding preferences and regenerate their roadmap.
 *
 * @module @plpg/web/pages/Settings/EditPreferences
 *
 * @description
 * This page provides the re-onboarding flow for existing users:
 * - Pre-fills form with current preferences
 * - Shows warning about roadmap regeneration
 * - Displays confirmation dialog before saving
 * - Updates preferences and triggers roadmap regeneration
 *
 * Route: /settings/preferences
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 * - Edit Preferences accessible from Settings
 * - Pre-filled with current selections
 * - Same flow as initial onboarding
 * - Warning: Changing preferences will regenerate your roadmap
 * - Confirmation before overwriting
 * - New roadmap generated; old progress retained where applicable
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from '../../contexts/OnboardingContext';
import { WarningBanner, ConfirmationDialog } from '../../components/common';
import { Step1CurrentRole } from '../../components/onboarding/Step1CurrentRole';
import { Step2TargetRole } from '../../components/onboarding/Step2TargetRole';
import { Step3WeeklyTime } from '../../components/onboarding/Step3WeeklyTime';
import { Step4ExistingSkills } from '../../components/onboarding/Step4ExistingSkills';
import { Step5Summary } from '../../components/onboarding/Step5Summary';
import { ProgressIndicator } from '../../components/onboarding/ProgressIndicator';
import {
  getOnboardingStatus,
  updatePreferences,
} from '../../services/onboarding.service';

import type { JSX } from 'react';
import type { OnboardingData } from '../../contexts/OnboardingContext';
import type { CurrentRole, TargetRole } from '@plpg/shared';

/**
 * Loading screen component displayed while fetching preferences.
 *
 * @returns {JSX.Element} Loading screen
 */
function LoadingScreen(): JSX.Element {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-secondary-50"
      role="status"
      aria-label="Loading preferences"
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
          Loading your preferences...
        </p>
      </div>
    </div>
  );
}

/**
 * Error screen component displayed when preferences cannot be loaded.
 *
 * @param {{ message: string; onRetry: () => void }} props - Component props
 * @returns {JSX.Element} Error screen
 */
function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center max-w-md px-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-secondary-900">
          Unable to Load Preferences
        </h2>
        <p className="mt-2 text-secondary-600">{message}</p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Try Again
          </button>
          <Link
            to="/settings"
            className="px-4 py-2 bg-white text-secondary-700 rounded-md border border-secondary-300 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Back to Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Edit preferences content component.
 * Renders the step-by-step preference editing flow.
 *
 * @returns {JSX.Element} Edit preferences content
 */
function EditPreferencesContent(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    currentStep,
    totalSteps,
    data,
    initializeWithData,
    isEditMode,
    goToStep,
  } = useOnboarding();

  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Fetches current preferences and initializes the form.
   */
  const loadPreferences = useCallback(async () => {
    setIsLoadingPreferences(true);
    setLoadError(null);

    try {
      const status = await getOnboardingStatus();

      if (!status.isComplete || !status.response) {
        // User hasn't completed onboarding, redirect to onboarding
        navigate('/onboarding', { replace: true });
        return;
      }

      // Initialize context with existing data
      const existingData: OnboardingData = {
        currentRole: status.response.currentRole as CurrentRole,
        targetRole: status.response.targetRole as TargetRole,
        weeklyHours: status.response.weeklyHours,
        skillsToSkip: status.response.skillsToSkip || [],
      };

      initializeWithData(existingData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load preferences';
      setLoadError(message);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, [initializeWithData, navigate]);

  /**
   * Check authentication and load preferences on mount.
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/sign-in', {
        state: { from: '/settings/preferences' },
        replace: true,
      });
      return;
    }

    void loadPreferences();
  }, [authLoading, isAuthenticated, navigate, loadPreferences]);

  /**
   * Handles the save button click.
   * Shows confirmation dialog before saving.
   */
  const handleSaveClick = useCallback(() => {
    setShowConfirmDialog(true);
    setSaveError(null);
  }, []);

  /**
   * Handles the confirmation to save preferences.
   */
  const handleConfirmSave = useCallback(async () => {
    if (!data.currentRole || !data.targetRole || !data.weeklyHours) {
      setSaveError('Please complete all required fields');
      setShowConfirmDialog(false);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updatePreferences({
        currentRole: data.currentRole,
        targetRole: data.targetRole,
        weeklyHours: data.weeklyHours,
        skillsToSkip: data.skillsToSkip,
      });

      // Success! Navigate back to settings with success message
      navigate('/settings', {
        state: { message: 'Your preferences have been updated successfully.' },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save preferences';
      setSaveError(message);
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
    }
  }, [data, navigate]);

  /**
   * Handles canceling the confirmation dialog.
   */
  const handleCancelConfirm = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  /**
   * Handles canceling the edit and returning to settings.
   */
  const handleCancel = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  // Show loading while checking auth or loading preferences
  if (authLoading || isLoadingPreferences) {
    return <LoadingScreen />;
  }

  // Show error if preferences failed to load
  if (loadError) {
    return <ErrorScreen message={loadError} onRetry={loadPreferences} />;
  }

  // Ensure we're in edit mode before rendering the form
  if (!isEditMode) {
    return <LoadingScreen />;
  }

  /**
   * Renders the current step component.
   */
  const renderStep = (): JSX.Element => {
    switch (currentStep) {
      case 1:
        return <Step1CurrentRole />;
      case 2:
        return <Step2TargetRole />;
      case 3:
        return <Step3WeeklyTime />;
      case 4:
        return <Step4ExistingSkills />;
      case 5:
        return <Step5Summary />;
      default:
        return <Step1CurrentRole />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm" role="banner">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/settings"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center mb-2"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Settings
              </Link>
              <h1 className="text-2xl font-bold text-secondary-900">
                Edit Preferences
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8" role="main">
        {/* Warning Banner */}
        <WarningBanner
          variant="warning"
          title="Important Notice"
          className="mb-6"
          testId="edit-preferences-warning"
        >
          <p>
            Changing your preferences will regenerate your learning roadmap.
            Your existing progress will be preserved for modules that remain in
            your new roadmap.
          </p>
        </WarningBanner>

        {/* Error message */}
        {saveError && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
            role="alert"
          >
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            onStepClick={goToStep}
          />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {renderStep()}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Cancel
          </button>

          {currentStep === totalSteps && (
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="save-preferences-button"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Confirm Changes"
        variant="warning"
        confirmLabel="Update Preferences"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSave}
        onCancel={handleCancelConfirm}
        isLoading={isSaving}
        testId="confirm-preferences-dialog"
      >
        <p className="mb-2">
          Are you sure you want to update your preferences?
        </p>
        <p className="text-secondary-500">
          This will regenerate your learning roadmap. Your existing progress
          will be preserved for modules that remain in your new roadmap.
        </p>
      </ConfirmationDialog>
    </div>
  );
}

/**
 * Edit Preferences page component.
 * Wraps the content with OnboardingProvider.
 *
 * @returns {JSX.Element} Edit Preferences page
 *
 * @example
 * ```tsx
 * <Route path="/settings/preferences" element={<EditPreferencesPage />} />
 * ```
 */
export function EditPreferencesPage(): JSX.Element {
  return (
    <OnboardingProvider>
      <EditPreferencesContent />
    </OnboardingProvider>
  );
}

export default EditPreferencesPage;
