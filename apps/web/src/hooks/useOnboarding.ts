/**
 * @fileoverview Custom hook for managing onboarding state and API interactions.
 * Provides centralized state management for the multi-step onboarding flow.
 *
 * @module @plpg/web/hooks/useOnboarding
 *
 * @description
 * This hook handles:
 * - Fetching existing onboarding data on mount
 * - Saving step data to the backend
 * - Managing navigation between steps
 * - Error handling and loading states
 * - Auto-save functionality with debouncing
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - Selection saved immediately (no data loss on navigation)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OnboardingStep1Data, OnboardingStatus } from '@plpg/shared';
import { useAuth } from '../contexts/AuthContext';

/**
 * API base URL for onboarding endpoints.
 *
 * @constant API_BASE_URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * Debounce delay for auto-save in milliseconds.
 *
 * @constant DEBOUNCE_DELAY
 */
const DEBOUNCE_DELAY = 500;

/**
 * Return type for the useOnboarding hook.
 *
 * @interface UseOnboardingReturn
 * @property {OnboardingStep1Data | null} step1Data - Current step 1 data
 * @property {number} currentStep - Current step number (1-5)
 * @property {boolean} isLoading - Whether initial data is loading
 * @property {boolean} isSaving - Whether data is being saved
 * @property {string | null} error - Error message if any
 * @property {function} saveStep1 - Save step 1 data
 * @property {function} goToNextStep - Navigate to next step
 * @property {function} goToPreviousStep - Navigate to previous step
 * @property {function} resetError - Clear error state
 */
interface UseOnboardingReturn {
  step1Data: OnboardingStep1Data | null;
  currentStep: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveStep1: (data: OnboardingStep1Data) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetError: () => void;
}

/**
 * Custom hook for managing onboarding state and interactions.
 *
 * Provides state management and API integration for the onboarding flow.
 * Handles fetching existing data, saving progress, and navigation.
 *
 * @returns {UseOnboardingReturn} Onboarding state and methods
 *
 * @example
 * ```tsx
 * const {
 *   step1Data,
 *   currentStep,
 *   isLoading,
 *   isSaving,
 *   error,
 *   saveStep1,
 *   goToNextStep
 * } = useOnboarding();
 *
 * // Save step 1 data
 * saveStep1({ currentRole: 'backend_developer' });
 *
 * // Navigate to next step
 * goToNextStep();
 * ```
 */
export function useOnboarding(): UseOnboardingReturn {
  const { token } = useAuth();

  // State for onboarding data
  const [step1Data, setStep1Data] = useState<OnboardingStep1Data | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for debouncing
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<OnboardingStep1Data | null>(null);

  /**
   * Fetches existing onboarding data from the API.
   * Called on hook mount.
   *
   * @async
   */
  const fetchOnboardingStatus = useCallback(async (): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/onboarding`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: OnboardingStatus = await response.json();

        // Set existing data if available
        if (data.response) {
          setStep1Data({
            currentRole: data.response.currentRole as OnboardingStep1Data['currentRole'],
            customRoleText: data.response.customRoleText ?? undefined,
          });
          setCurrentStep(data.currentStep);
        }
      } else if (response.status === 404) {
        // No existing onboarding - start fresh
        setStep1Data(null);
        setCurrentStep(1);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to load onboarding data');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Error fetching onboarding status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Saves step 1 data to the backend.
   * Implements debouncing to prevent excessive API calls.
   *
   * @param {OnboardingStep1Data} data - Step 1 form data
   * @async
   */
  const saveStep1Internal = useCallback(
    async (data: OnboardingStep1Data): Promise<void> => {
      if (!token) {
        setError('Authentication required');
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/onboarding/step/1`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          setStep1Data(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || 'Failed to save selection');
        }
      } catch (err) {
        setError('Unable to save. Please try again.');
        console.error('Error saving step 1:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [token]
  );

  /**
   * Public method to save step 1 data with debouncing.
   * Updates local state immediately and debounces API call.
   *
   * @param {OnboardingStep1Data} data - Step 1 form data
   */
  const saveStep1 = useCallback(
    (data: OnboardingStep1Data): void => {
      // Update local state immediately for responsive UI
      setStep1Data(data);

      // Store pending data for debounced save
      pendingDataRef.current = data;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new debounced save
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          saveStep1Internal(pendingDataRef.current);
          pendingDataRef.current = null;
        }
      }, DEBOUNCE_DELAY);
    },
    [saveStep1Internal]
  );

  /**
   * Navigates to the next step in the onboarding flow.
   * Validates current step data before advancing.
   */
  const goToNextStep = useCallback((): void => {
    // Flush any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      if (pendingDataRef.current) {
        saveStep1Internal(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }

    // Validate current step before advancing
    if (currentStep === 1 && !step1Data?.currentRole) {
      setError('Please select your current role before proceeding');
      return;
    }

    if (currentStep === 1 && step1Data?.currentRole === 'other') {
      if (!step1Data.customRoleText || step1Data.customRoleText.trim().length < 2) {
        setError('Please specify your role when selecting "Other"');
        return;
      }
    }

    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  }, [currentStep, step1Data, saveStep1Internal]);

  /**
   * Navigates to the previous step in the onboarding flow.
   */
  const goToPreviousStep = useCallback((): void => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  /**
   * Clears the error state.
   */
  const resetError = useCallback((): void => {
    setError(null);
  }, []);

  // Fetch onboarding status on mount
  useEffect(() => {
    fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    step1Data,
    currentStep,
    isLoading,
    isSaving,
    error,
    saveStep1,
    goToNextStep,
    goToPreviousStep,
    resetError,
  };
}

export default useOnboarding;
