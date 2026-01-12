/**
 * @fileoverview Tests for user service.
 * Validates API calls and error handling for user profile operations.
 *
 * @module @plpg/web/services/user.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { api } from '../lib/api';
import {
  getSession,
  updateUserProfile,
  getUserProfile,
  type Session,
} from './user.service';

import type { UserProfile } from '@plpg/shared';

// Mock the API module
vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    },
    getErrorMessage: actual.getErrorMessage,
  };
});

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSession', () => {
    it('should successfully fetch session data', async () => {
      const mockSession: Session = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        subscriptionStatus: 'active',
        trialEndsAt: '2026-02-01T00:00:00.000Z',
        isVerified: true,
        role: 'free',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockSession });

      const result = await getSession();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockSession);
    });

    it('should throw error on fetch failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Unauthorized' },
        },
      };

      vi.mocked(api.get).mockRejectedValue(mockError);

      await expect(getSession()).rejects.toThrow();
    });

    it('should handle session with null values', async () => {
      const mockSession: Session = {
        userId: 'user-123',
        email: 'test@example.com',
        name: null,
        avatarUrl: null,
        subscriptionStatus: 'active',
        trialEndsAt: null,
        isVerified: false,
        role: 'free',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockSession });

      const result = await getSession();

      expect(result.name).toBeNull();
      expect(result.avatarUrl).toBeNull();
      expect(result.trialEndsAt).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should successfully update profile with name', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'New Name',
        avatarUrl: null,
        emailVerified: true,
      };

      vi.mocked(api.patch).mockResolvedValue({ data: mockProfile });

      const result = await updateUserProfile({ name: 'New Name' });

      expect(api.patch).toHaveBeenCalledWith('/users/profile', { name: 'New Name' });
      expect(result).toEqual(mockProfile);
    });

    it('should successfully update profile with avatarUrl', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        emailVerified: true,
      };

      vi.mocked(api.patch).mockResolvedValue({ data: mockProfile });

      const result = await updateUserProfile({ avatarUrl: 'https://example.com/avatar.jpg' });

      expect(api.patch).toHaveBeenCalledWith('/users/profile', {
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(result).toEqual(mockProfile);
    });

    it('should successfully update profile with null avatarUrl', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        emailVerified: true,
      };

      vi.mocked(api.patch).mockResolvedValue({ data: mockProfile });

      const result = await updateUserProfile({ avatarUrl: null });

      expect(api.patch).toHaveBeenCalledWith('/users/profile', { avatarUrl: null });
      expect(result.avatarUrl).toBeNull();
    });

    it('should throw error on update failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Validation error' },
        },
      };

      vi.mocked(api.patch).mockRejectedValue(mockError);

      await expect(updateUserProfile({ name: 'a' })).rejects.toThrow();
    });

    it('should throw error when not authenticated', async () => {
      const mockError = {
        response: {
          data: { message: 'Unauthorized' },
          status: 401,
        },
      };

      vi.mocked(api.patch).mockRejectedValue(mockError);

      await expect(updateUserProfile({ name: 'New Name' })).rejects.toThrow();
    });
  });

  describe('getUserProfile', () => {
    it('should successfully fetch user profile', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        emailVerified: true,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockProfile });

      const result = await getUserProfile();

      expect(api.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockProfile);
    });

    it('should throw error on fetch failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Not found' },
        },
      };

      vi.mocked(api.get).mockRejectedValue(mockError);

      await expect(getUserProfile()).rejects.toThrow();
    });

    it('should handle profile with all fields populated', async () => {
      const mockProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.png',
        emailVerified: true,
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockProfile });

      const result = await getUserProfile();

      expect(result.name).toBe('John Doe');
      expect(result.avatarUrl).toBe('https://example.com/avatar.png');
      expect(result.emailVerified).toBe(true);
    });
  });
});
