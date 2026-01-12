/**
 * @fileoverview Tests for OnboardingContext.
 * Validates onboarding state management, step navigation, and persistence.
 *
 * @module @plpg/web/contexts/OnboardingContext.test
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  OnboardingProvider,
  useOnboarding,
  TOTAL_ONBOARDING_STEPS,
} from './OnboardingContext';

import type { ReactNode } from 'react';

// Wrapper component for testing hooks
function wrapper({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}

describe('OnboardingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have initial step as 1', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.currentStep).toBe(1);
    });

    it('should have correct total steps', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.totalSteps).toBe(TOTAL_ONBOARDING_STEPS);
      expect(result.current.totalSteps).toBe(4);
    });

    it('should have null initial data values', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.data.currentRole).toBeNull();
      expect(result.current.data.targetRole).toBeNull();
      expect(result.current.data.weeklyHours).toBeNull();
      expect(result.current.data.skillsToSkip).toEqual([]);
    });

    it('should not be complete initially', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.isComplete).toBe(false);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Step Navigation', () => {
    it('should go to next step', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should go to previous step', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // First go to step 2
      act(() => {
        result.current.nextStep();
      });

      // Then go back
      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not go below step 1', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not go above total steps', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // Go to last step
      act(() => {
        result.current.goToStep(TOTAL_ONBOARDING_STEPS);
      });

      // Try to go beyond
      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(TOTAL_ONBOARDING_STEPS);
    });

    it('should go to specific step', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('should not go to invalid step below 1', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.goToStep(0);
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not go to invalid step above total', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.goToStep(10);
      });

      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('Data Management', () => {
    it('should set current role', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setCurrentRole('backend_developer');
      });

      expect(result.current.data.currentRole).toBe('backend_developer');
    });

    it('should set target role', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setTargetRole('ml_engineer');
      });

      expect(result.current.data.targetRole).toBe('ml_engineer');
    });

    it('should set weekly hours', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setWeeklyHours(10);
      });

      expect(result.current.data.weeklyHours).toBe(10);
    });

    it('should set skills to skip', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });
      const skills = ['skill-1', 'skill-2'];

      act(() => {
        result.current.setSkillsToSkip(skills);
      });

      expect(result.current.data.skillsToSkip).toEqual(skills);
    });

    it('should preserve other data when setting individual fields', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setCurrentRole('frontend_developer');
        result.current.setTargetRole('data_scientist');
        result.current.setWeeklyHours(15);
      });

      expect(result.current.data.currentRole).toBe('frontend_developer');
      expect(result.current.data.targetRole).toBe('data_scientist');
      expect(result.current.data.weeklyHours).toBe(15);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all data', () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // Set some data
      act(() => {
        result.current.setCurrentRole('backend_developer');
        result.current.setTargetRole('ml_engineer');
        result.current.setWeeklyHours(10);
        result.current.goToStep(3);
      });

      // Reset
      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.data.currentRole).toBeNull();
      expect(result.current.data.targetRole).toBeNull();
      expect(result.current.data.weeklyHours).toBeNull();
      expect(result.current.data.skillsToSkip).toEqual([]);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('Completion', () => {
    it('should throw error if required fields are missing', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await expect(result.current.completeOnboarding()).rejects.toThrow(
        'Please complete all required onboarding steps'
      );
    });

    it('should complete when all required fields are filled', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setCurrentRole('backend_developer');
        result.current.setTargetRole('ml_engineer');
        result.current.setWeeklyHours(10);
      });

      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('should set loading state during completion', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setCurrentRole('backend_developer');
        result.current.setTargetRole('ml_engineer');
        result.current.setWeeklyHours(10);
      });

      // Start completion but don't wait
      const completionPromise = act(async () => {
        await result.current.completeOnboarding();
      });

      await completionPromise;

      // After completion, loading should be false
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save progress to localStorage', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setCurrentRole('backend_developer');
        result.current.goToStep(2);
      });

      // Wait for effect to run
      await waitFor(() => {
        const saved = localStorage.getItem('plpg_onboarding_progress');
        expect(saved).not.toBeNull();
      });

      const saved = JSON.parse(
        localStorage.getItem('plpg_onboarding_progress') || '{}'
      );
      expect(saved.currentStep).toBe(2);
      expect(saved.data.currentRole).toBe('backend_developer');
    });

    it('should restore progress from localStorage', () => {
      // Pre-populate localStorage
      const savedProgress = {
        currentStep: 3,
        data: {
          currentRole: 'frontend_developer',
          targetRole: 'ml_engineer',
          weeklyHours: 15,
          skillsToSkip: [],
        },
      };
      localStorage.setItem(
        'plpg_onboarding_progress',
        JSON.stringify(savedProgress)
      );

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.currentStep).toBe(3);
      expect(result.current.data.currentRole).toBe('frontend_developer');
      expect(result.current.data.targetRole).toBe('ml_engineer');
      expect(result.current.data.weeklyHours).toBe(15);
    });

    it('should reset localStorage data on reset', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setCurrentRole('backend_developer');
        result.current.goToStep(3);
      });

      // Wait for save
      await waitFor(() => {
        const saved = localStorage.getItem('plpg_onboarding_progress');
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved!);
        expect(parsed.data.currentRole).toBe('backend_developer');
      });

      // Reset
      act(() => {
        result.current.resetOnboarding();
      });

      // After reset, data should be back to initial state
      await waitFor(() => {
        const saved = localStorage.getItem('plpg_onboarding_progress');
        if (saved) {
          const parsed = JSON.parse(saved);
          expect(parsed.currentStep).toBe(1);
          expect(parsed.data.currentRole).toBeNull();
        }
      });
    });

    it('should clear localStorage on completion', async () => {
      const { result } = renderHook(() => useOnboarding(), { wrapper });

      act(() => {
        result.current.setCurrentRole('backend_developer');
        result.current.setTargetRole('ml_engineer');
        result.current.setWeeklyHours(10);
      });

      // Wait for save
      await waitFor(() => {
        expect(localStorage.getItem('plpg_onboarding_progress')).not.toBeNull();
      });

      // Complete
      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(localStorage.getItem('plpg_onboarding_progress')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useOnboarding());
      }).toThrow('useOnboarding must be used within an OnboardingProvider');

      consoleSpy.mockRestore();
    });
  });
});
