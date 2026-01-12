/**
 * @fileoverview Unit tests for onboarding service.
 *
 * @module @plpg/web/services/onboarding.service.test
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Re-Onboarding / Edit Preferences
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getOnboardingStatus,
  updatePreferences,
  getCurrentPreferences,
} from './onboarding.service';
import { api } from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
  getErrorMessage: vi.fn((error) => {
    if (error instanceof Error) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    return 'Unknown error';
  }),
}));

describe('onboarding.service', () => {
  const mockOnboardingResponse = {
    id: 'onboarding-123',
    userId: 'user-123',
    currentRole: 'backend_developer',
    customRoleText: null,
    targetRole: 'ml_engineer',
    weeklyHours: 10,
    skillsToSkip: ['skill-1', 'skill-2'],
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const mockOnboardingStatus = {
    isComplete: true,
    currentStep: 5,
    totalSteps: 5,
    response: mockOnboardingResponse,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('returns onboarding status on success', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockOnboardingStatus });

      const result = await getOnboardingStatus();

      expect(api.get).toHaveBeenCalledWith('/v1/onboarding');
      expect(result).toEqual(mockOnboardingStatus);
    });

    it('throws error when API call fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      await expect(getOnboardingStatus()).rejects.toThrow('Network error');
    });

    it('returns incomplete status when user has not completed onboarding', async () => {
      const incompleteStatus = {
        isComplete: false,
        currentStep: 2,
        totalSteps: 5,
        response: null,
      };

      vi.mocked(api.get).mockResolvedValue({ data: incompleteStatus });

      const result = await getOnboardingStatus();

      expect(result.isComplete).toBe(false);
      expect(result.response).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    const updateInput = {
      currentRole: 'data_analyst' as const,
      targetRole: 'data_scientist' as const,
      weeklyHours: 15,
      skillsToSkip: ['skill-3'],
    };

    const mockUpdateResult = {
      onboardingResponse: {
        ...mockOnboardingResponse,
        ...updateInput,
      },
      roadmapRegenerated: true,
      newRoadmapId: 'new-roadmap-123',
      preservedModulesCount: 5,
    };

    it('updates preferences and returns result on success', async () => {
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: mockUpdateResult },
      });

      const result = await updatePreferences(updateInput);

      expect(api.put).toHaveBeenCalledWith('/v1/onboarding/preferences', updateInput);
      expect(result).toEqual(mockUpdateResult);
      expect(result.roadmapRegenerated).toBe(true);
    });

    it('throws error when API call fails', async () => {
      vi.mocked(api.put).mockRejectedValue(new Error('Validation failed'));

      await expect(updatePreferences(updateInput)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('includes customRoleText when currentRole is other', async () => {
      const inputWithCustomRole = {
        currentRole: 'other' as const,
        customRoleText: 'Product Manager',
        targetRole: 'ml_engineer' as const,
        weeklyHours: 10,
        skillsToSkip: [],
      };

      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: mockUpdateResult },
      });

      await updatePreferences(inputWithCustomRole);

      expect(api.put).toHaveBeenCalledWith(
        '/v1/onboarding/preferences',
        inputWithCustomRole
      );
    });

    it('returns preserved modules count', async () => {
      vi.mocked(api.put).mockResolvedValue({
        data: {
          success: true,
          data: { ...mockUpdateResult, preservedModulesCount: 7 },
        },
      });

      const result = await updatePreferences(updateInput);

      expect(result.preservedModulesCount).toBe(7);
    });
  });

  describe('getCurrentPreferences', () => {
    it('returns current preferences from onboarding status', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockOnboardingStatus });

      const result = await getCurrentPreferences();

      expect(result).toEqual(mockOnboardingResponse);
    });

    it('returns null when no preferences exist', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          isComplete: false,
          currentStep: 1,
          totalSteps: 5,
          response: null,
        },
      });

      const result = await getCurrentPreferences();

      expect(result).toBeNull();
    });

    it('throws error when API call fails', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Unauthorized'));

      await expect(getCurrentPreferences()).rejects.toThrow('Unauthorized');
    });
  });
});
