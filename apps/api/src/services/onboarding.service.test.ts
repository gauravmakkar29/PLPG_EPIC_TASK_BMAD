/**
 * @fileoverview Unit tests for onboarding service.
 * Tests the business logic for onboarding operations.
 *
 * @module @plpg/api/services/onboarding.service.test
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - Selection persists in database
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getOnboardingStatus,
  saveStep1,
  hasCompletedOnboarding,
  getOnboardingByUserId,
} from './onboarding.service';

// Mock prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    onboardingResponse: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Import mocked prisma
import { prisma } from '../lib/prisma';

// Type assertion for mocked functions
const mockFindUnique = prisma.onboardingResponse.findUnique as ReturnType<typeof vi.fn>;
const mockUpsert = prisma.onboardingResponse.upsert as ReturnType<typeof vi.fn>;

describe('onboarding.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('should return initial status when no onboarding record exists', async () => {
      mockFindUnique.mockResolvedValue(null);

      const status = await getOnboardingStatus('user-123');

      expect(status).toEqual({
        isComplete: false,
        currentStep: 1,
        totalSteps: 5,
        response: null,
      });
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return status with existing onboarding data', async () => {
      const mockResponse = {
        id: 'onboarding-123',
        userId: 'user-123',
        currentRole: 'backend_developer',
        customRoleText: null,
        targetRole: 'ml_engineer',
        weeklyHours: 10,
        skillsToSkip: [],
        completedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(mockResponse);

      const status = await getOnboardingStatus('user-123');

      expect(status.isComplete).toBe(false);
      expect(status.currentStep).toBe(2); // Has currentRole, next is targetRole
      expect(status.response).not.toBeNull();
      expect(status.response?.currentRole).toBe('backend_developer');
    });

    it('should return isComplete=true when completedAt is set', async () => {
      const mockResponse = {
        id: 'onboarding-123',
        userId: 'user-123',
        currentRole: 'backend_developer',
        customRoleText: null,
        targetRole: 'data_scientist',
        weeklyHours: 15,
        skillsToSkip: ['skill-1', 'skill-2'],
        completedAt: new Date('2024-01-10'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
      };

      mockFindUnique.mockResolvedValue(mockResponse);

      const status = await getOnboardingStatus('user-123');

      expect(status.isComplete).toBe(true);
      expect(status.currentStep).toBe(5);
    });
  });

  describe('saveStep1', () => {
    it('should create new onboarding record with current role', async () => {
      const mockResponse = {
        id: 'onboarding-123',
        userId: 'user-123',
        currentRole: 'backend_developer',
        customRoleText: null,
        targetRole: 'ml_engineer',
        weeklyHours: 10,
        skillsToSkip: [],
        completedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockUpsert.mockResolvedValue(mockResponse);

      const result = await saveStep1('user-123', {
        currentRole: 'backend_developer',
      });

      expect(result.currentRole).toBe('backend_developer');
      expect(result.customRoleText).toBeNull();
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {
          currentRole: 'backend_developer',
          customRoleText: null,
          updatedAt: expect.any(Date),
        },
        create: {
          userId: 'user-123',
          currentRole: 'backend_developer',
          customRoleText: null,
          targetRole: 'ml_engineer',
          weeklyHours: 10,
          skillsToSkip: [],
        },
      });
    });

    it('should save custom role text when other is selected', async () => {
      const mockResponse = {
        id: 'onboarding-123',
        userId: 'user-123',
        currentRole: 'other',
        customRoleText: 'Software Architect',
        targetRole: 'ml_engineer',
        weeklyHours: 10,
        skillsToSkip: [],
        completedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockUpsert.mockResolvedValue(mockResponse);

      const result = await saveStep1('user-123', {
        currentRole: 'other',
        customRoleText: 'Software Architect',
      });

      expect(result.currentRole).toBe('other');
      expect(result.customRoleText).toBe('Software Architect');
    });

    it('should throw error for invalid role', async () => {
      await expect(
        saveStep1('user-123', {
          currentRole: 'invalid_role' as any,
        })
      ).rejects.toThrow('Invalid current role: invalid_role');
    });

    it('should throw error when other is selected without custom text', async () => {
      await expect(
        saveStep1('user-123', {
          currentRole: 'other',
        })
      ).rejects.toThrow('Custom role text is required when selecting "Other"');
    });

    it('should throw error when other is selected with too short custom text', async () => {
      await expect(
        saveStep1('user-123', {
          currentRole: 'other',
          customRoleText: 'A',
        })
      ).rejects.toThrow('Custom role text is required when selecting "Other"');
    });

    it('should clear custom role text when switching from other to predefined role', async () => {
      const mockResponse = {
        id: 'onboarding-123',
        userId: 'user-123',
        currentRole: 'qa_engineer',
        customRoleText: null,
        targetRole: 'ml_engineer',
        weeklyHours: 10,
        skillsToSkip: [],
        completedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockUpsert.mockResolvedValue(mockResponse);

      const result = await saveStep1('user-123', {
        currentRole: 'qa_engineer',
        customRoleText: 'Previous custom text', // Should be ignored
      });

      expect(result.customRoleText).toBeNull();
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            customRoleText: null,
          }),
          create: expect.objectContaining({
            customRoleText: null,
          }),
        })
      );
    });

    it('should accept all valid role values', async () => {
      const validRoles = [
        'backend_developer',
        'devops_engineer',
        'data_analyst',
        'qa_engineer',
        'it_professional',
      ];

      for (const role of validRoles) {
        mockUpsert.mockResolvedValue({
          id: 'onboarding-123',
          userId: 'user-123',
          currentRole: role,
          customRoleText: null,
          targetRole: 'ml_engineer',
          weeklyHours: 10,
          skillsToSkip: [],
          completedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        });

        const result = await saveStep1('user-123', {
          currentRole: role as any,
        });

        expect(result.currentRole).toBe(role);
      }
    });
  });

  describe('hasCompletedOnboarding', () => {
    it('should return false when no record exists', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await hasCompletedOnboarding('user-123');

      expect(result).toBe(false);
    });

    it('should return false when completedAt is null', async () => {
      mockFindUnique.mockResolvedValue({
        completedAt: null,
      });

      const result = await hasCompletedOnboarding('user-123');

      expect(result).toBe(false);
    });

    it('should return true when completedAt is set', async () => {
      mockFindUnique.mockResolvedValue({
        completedAt: new Date('2024-01-10'),
      });

      const result = await hasCompletedOnboarding('user-123');

      expect(result).toBe(true);
    });
  });

  describe('getOnboardingByUserId', () => {
    it('should return null when no record exists', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getOnboardingByUserId('user-123');

      expect(result).toBeNull();
    });

    it('should return onboarding response when record exists', async () => {
      const mockResponse = {
        id: 'onboarding-123',
        userId: 'user-123',
        currentRole: 'backend_developer',
        customRoleText: null,
        targetRole: 'ml_engineer',
        weeklyHours: 10,
        skillsToSkip: ['skill-1'],
        completedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFindUnique.mockResolvedValue(mockResponse);

      const result = await getOnboardingByUserId('user-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('onboarding-123');
      expect(result?.currentRole).toBe('backend_developer');
      expect(result?.skillsToSkip).toEqual(['skill-1']);
    });
  });
});
