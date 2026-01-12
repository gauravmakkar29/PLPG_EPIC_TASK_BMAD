/**
 * @fileoverview Onboarding context provider for managing onboarding flow state.
 * Provides onboarding progress state and methods throughout the application via React Context.
 *
 * @module @plpg/web/contexts/OnboardingContext
 *
 * @description
 * This context manages the 4-step onboarding flow:
 * - Step 1: Current role selection
 * - Step 2: Target role selection
 * - Step 3: Weekly hours commitment
 * - Step 4: Skills assessment (optional skip)
 *
 * Features:
 * - Tracks current step and completion status
 * - Persists partial progress to localStorage
 * - Provides methods for step navigation
 * - Integrates with OnboardingStatus API
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import type { ReactNode, JSX } from 'react';
import type {
  CurrentRole,
  TargetRole,
  WeeklyHoursOption,
  OnboardingStatus,
} from '@plpg/shared';

/**
 * Total number of steps in the onboarding flow.
 * @constant {number}
 */
export const TOTAL_ONBOARDING_STEPS = 4;

/**
 * Onboarding flow data structure.
 * Stores all user selections throughout the onboarding process.
 *
 * @interface OnboardingData
 * @property {CurrentRole | null} currentRole - User's current job role
 * @property {TargetRole | null} targetRole - User's target career role
 * @property {WeeklyHoursOption | null} weeklyHours - Weekly time commitment
 * @property {string[]} skillsToSkip - Skill IDs to exclude from roadmap
 */
export interface OnboardingData {
  currentRole: CurrentRole | null;
  targetRole: TargetRole | null;
  weeklyHours: WeeklyHoursOption | null;
  skillsToSkip: string[];
}

/**
 * Onboarding context value interface.
 * Defines the shape of data and methods available through the onboarding context.
 *
 * @interface OnboardingContextValue
 * @property {number} currentStep - Current step in the onboarding flow (1-4)
 * @property {number} totalSteps - Total number of steps
 * @property {OnboardingData} data - Collected onboarding data
 * @property {boolean} isComplete - Whether onboarding is complete
 * @property {boolean} isLoading - Loading state for API calls
 * @property {OnboardingStatus | null} status - Server-side onboarding status
 * @property {Function} setCurrentRole - Set step 1 data
 * @property {Function} setTargetRole - Set step 2 data
 * @property {Function} setWeeklyHours - Set step 3 data
 * @property {Function} setSkillsToSkip - Set step 4 data
 * @property {Function} goToStep - Navigate to a specific step
 * @property {Function} nextStep - Advance to next step
 * @property {Function} previousStep - Go back to previous step
 * @property {Function} resetOnboarding - Clear all onboarding progress
 * @property {Function} completeOnboarding - Submit onboarding data
 */
export interface OnboardingContextValue {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  isComplete: boolean;
  isLoading: boolean;
  status: OnboardingStatus | null;
  setCurrentRole: (role: CurrentRole) => void;
  setTargetRole: (role: TargetRole) => void;
  setWeeklyHours: (hours: WeeklyHoursOption) => void;
  setSkillsToSkip: (skills: string[]) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
}

/**
 * Props for the OnboardingProvider component.
 *
 * @interface OnboardingProviderProps
 * @property {ReactNode} children - Child components to be wrapped by the provider
 */
interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * Key used for storing onboarding progress in localStorage.
 * @constant {string}
 */
const ONBOARDING_STORAGE_KEY = 'plpg_onboarding_progress';

/**
 * Initial onboarding data state.
 * @constant {OnboardingData}
 */
const INITIAL_DATA: OnboardingData = {
  currentRole: null,
  targetRole: null,
  weeklyHours: null,
  skillsToSkip: [],
};

/**
 * Onboarding context.
 * Must be accessed through useOnboarding hook for proper error handling.
 *
 * @type {React.Context<OnboardingContextValue | undefined>}
 */
const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

/**
 * Loads saved onboarding progress from localStorage.
 *
 * @returns {Partial<{ currentStep: number; data: OnboardingData }> | null} Saved progress or null
 */
function loadSavedProgress(): {
  currentStep: number;
  data: OnboardingData;
} | null {
  try {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as { currentStep: number; data: OnboardingData };
    }
  } catch (error) {
    console.error('Error loading onboarding progress:', error);
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }
  return null;
}

/**
 * Saves onboarding progress to localStorage.
 *
 * @param {number} currentStep - Current step number
 * @param {OnboardingData} data - Current onboarding data
 */
function saveProgress(currentStep: number, data: OnboardingData): void {
  try {
    localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ currentStep, data })
    );
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
  }
}

/**
 * Clears saved onboarding progress from localStorage.
 */
function clearSavedProgress(): void {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

/**
 * Onboarding provider component.
 * Wraps the onboarding flow to provide state and methods to all child components.
 *
 * Manages:
 * - Current step tracking
 * - Onboarding data collection
 * - Progress persistence to localStorage
 * - API integration for status and completion
 *
 * @param {OnboardingProviderProps} props - Component props
 * @returns {JSX.Element} Provider component wrapping children
 *
 * @example
 * ```tsx
 * function OnboardingPage() {
 *   return (
 *     <OnboardingProvider>
 *       <OnboardingFlow />
 *     </OnboardingProvider>
 *   );
 * }
 * ```
 */
export function OnboardingProvider({
  children,
}: OnboardingProviderProps): JSX.Element {
  // Initialize state from localStorage if available
  const savedProgress = loadSavedProgress();

  const [currentStep, setCurrentStep] = useState<number>(
    savedProgress?.currentStep ?? 1
  );
  const [data, setData] = useState<OnboardingData>(
    savedProgress?.data ?? INITIAL_DATA
  );
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);

  /**
   * Persist progress to localStorage whenever it changes.
   */
  useEffect(() => {
    if (!isComplete) {
      saveProgress(currentStep, data);
    }
  }, [currentStep, data, isComplete]);

  /**
   * Sets the current role (step 1).
   *
   * @param {CurrentRole} role - Selected current role
   */
  const setCurrentRole = useCallback((role: CurrentRole): void => {
    setData((prev) => ({ ...prev, currentRole: role }));
  }, []);

  /**
   * Sets the target role (step 2).
   *
   * @param {TargetRole} role - Selected target role
   */
  const setTargetRole = useCallback((role: TargetRole): void => {
    setData((prev) => ({ ...prev, targetRole: role }));
  }, []);

  /**
   * Sets the weekly hours commitment (step 3).
   *
   * @param {WeeklyHoursOption} hours - Selected weekly hours
   */
  const setWeeklyHours = useCallback((hours: WeeklyHoursOption): void => {
    setData((prev) => ({ ...prev, weeklyHours: hours }));
  }, []);

  /**
   * Sets the skills to skip (step 4).
   *
   * @param {string[]} skills - Array of skill IDs to skip
   */
  const setSkillsToSkip = useCallback((skills: string[]): void => {
    setData((prev) => ({ ...prev, skillsToSkip: skills }));
  }, []);

  /**
   * Navigates to a specific step.
   *
   * @param {number} step - Step number to navigate to (1-4)
   */
  const goToStep = useCallback((step: number): void => {
    if (step >= 1 && step <= TOTAL_ONBOARDING_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  /**
   * Advances to the next step.
   */
  const nextStep = useCallback((): void => {
    setCurrentStep((prev) =>
      prev < TOTAL_ONBOARDING_STEPS ? prev + 1 : prev
    );
  }, []);

  /**
   * Goes back to the previous step.
   */
  const previousStep = useCallback((): void => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  /**
   * Resets all onboarding progress.
   */
  const resetOnboarding = useCallback((): void => {
    setCurrentStep(1);
    setData(INITIAL_DATA);
    setIsComplete(false);
    setStatus(null);
    clearSavedProgress();
  }, []);

  /**
   * Submits the completed onboarding data.
   * Validates all required fields are filled before submission.
   *
   * @throws {Error} If required fields are missing
   */
  const completeOnboarding = useCallback(async (): Promise<void> => {
    // Validate all required data is present
    if (!data.currentRole || !data.targetRole || !data.weeklyHours) {
      throw new Error('Please complete all required onboarding steps');
    }

    setIsLoading(true);

    try {
      // TODO: Call API to submit onboarding data
      // const response = await submitOnboarding({
      //   currentRole: data.currentRole,
      //   targetRole: data.targetRole,
      //   weeklyHours: data.weeklyHours,
      //   skillsToSkip: data.skillsToSkip,
      // });

      // For now, simulate completion
      setIsComplete(true);
      clearSavedProgress();

      // Update status
      setStatus({
        isComplete: true,
        currentStep: TOTAL_ONBOARDING_STEPS,
        totalSteps: TOTAL_ONBOARDING_STEPS,
        response: null, // Would come from API
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  /**
   * Memoized context value to prevent unnecessary re-renders.
   */
  const value = useMemo<OnboardingContextValue>(
    () => ({
      currentStep,
      totalSteps: TOTAL_ONBOARDING_STEPS,
      data,
      isComplete,
      isLoading,
      status,
      setCurrentRole,
      setTargetRole,
      setWeeklyHours,
      setSkillsToSkip,
      goToStep,
      nextStep,
      previousStep,
      resetOnboarding,
      completeOnboarding,
    }),
    [
      currentStep,
      data,
      isComplete,
      isLoading,
      status,
      setCurrentRole,
      setTargetRole,
      setWeeklyHours,
      setSkillsToSkip,
      goToStep,
      nextStep,
      previousStep,
      resetOnboarding,
      completeOnboarding,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to access onboarding context.
 * Must be used within an OnboardingProvider.
 *
 * @returns {OnboardingContextValue} Onboarding context value with state and methods
 * @throws {Error} If used outside of OnboardingProvider
 *
 * @example
 * ```tsx
 * function OnboardingStep() {
 *   const { currentStep, nextStep, data } = useOnboarding();
 *
 *   return (
 *     <div>
 *       <p>Step {currentStep} of 4</p>
 *       <button onClick={nextStep}>Next</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);

  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }

  return context;
}
