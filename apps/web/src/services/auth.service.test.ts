/**
 * @fileoverview Tests for authentication service.
 * Validates API calls, token management, and error handling.
 *
 * @module @plpg/web/services/auth.service.test
 */

/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { api, setAccessToken, setRefreshToken, clearTokens, getRefreshToken } from '../lib/api';

import { loginUser, registerUser, logoutUser } from './auth.service';

// Mock the API module
vi.mock('../lib/api', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    api: {
      post: vi.fn(),
      patch: vi.fn(),
    },
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    getRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
    getErrorMessage: actual.getErrorMessage,
  };
});

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset getRefreshToken mock to return default value
    vi.mocked(getRefreshToken).mockReturnValue('mock-refresh-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loginUser', () => {
    it('should successfully login user and store tokens', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          expiresIn: 900,
          redirectPath: '/dashboard',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await loginUser({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: undefined,
      });

      expect(setAccessToken).toHaveBeenCalledWith('mock-access-token');
      expect(setRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('should include remember me in request', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          expiresIn: 604800,
          redirectPath: '/dashboard',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      await loginUser({
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: true,
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: true,
      });
    });

    it('should throw error on login failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' },
        },
      };

      vi.mocked(api.post).mockRejectedValue(mockError);

      await expect(
        loginUser({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow();
    });
  });

  describe('registerUser', () => {
    it('should successfully register user and store tokens', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email: 'newuser@example.com', name: 'New User' },
          expiresIn: 900,
          emailVerificationRequired: true,
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await registerUser({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      });

      expect(setAccessToken).toHaveBeenCalledWith('mock-access-token');
      expect(setRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on registration failure', async () => {
      const mockError = {
        response: {
          data: { message: 'Email already exists' },
        },
      };

      vi.mocked(api.post).mockRejectedValue(mockError);

      await expect(
        registerUser({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'User',
        })
      ).rejects.toThrow();
    });
  });

  describe('logoutUser', () => {
    it('should call logout endpoint with refresh token and clear local tokens', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, message: 'Successfully logged out' },
      });

      const result = await logoutUser();

      expect(getRefreshToken).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'mock-refresh-token',
        logoutAll: false,
      });
      expect(clearTokens).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Successfully logged out' });
    });

    it('should support logout from all sessions', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, message: 'Successfully logged out from all sessions' },
      });

      const result = await logoutUser({ logoutAll: true });

      expect(api.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'mock-refresh-token',
        logoutAll: true,
      });
      expect(result).toEqual({ success: true, message: 'Successfully logged out from all sessions' });
    });

    it('should clear tokens even if API call fails', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      const result = await logoutUser();

      expect(clearTokens).toHaveBeenCalled();
      expect(result.success).toBe(false);
    });

    it('should handle null refresh token gracefully', async () => {
      vi.mocked(getRefreshToken).mockReturnValue(null);
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, message: 'Successfully logged out' },
      });

      await logoutUser();

      expect(api.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: null,
        logoutAll: false,
      });
      expect(clearTokens).toHaveBeenCalled();
    });
  });
});
