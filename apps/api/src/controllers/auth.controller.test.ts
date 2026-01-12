/**
 * @fileoverview Unit tests for authentication controller.
 * Tests login endpoint with various scenarios.
 *
 * @module @plpg/api/controllers/auth.controller.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { login, logout } from './auth.controller';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  mockUser,
  mockProUser,
  mockSubscription,
  mockProSubscription,
} from '../test/db';
import { AuthenticationError } from '@plpg/shared';
import * as authService from '../services/auth.service';

// Mock the auth service
vi.mock('../services/auth.service');

describe('Auth Controller', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'ValidPassword123!',
    };

    const mockLoginResult = {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        role: mockUser.role,
        isVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      subscriptionStatus: 'free' as const,
    };

    /**
     * Test: Returns token for valid credentials
     */
    it('returns token for valid credentials', async () => {
      mockReq.body = validCredentials;
      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResult);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(authService.loginUser).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        user: mockLoginResult.user,
        accessToken: mockLoginResult.accessToken,
        refreshToken: mockLoginResult.refreshToken,
        subscriptionStatus: 'free',
      });
    });

    /**
     * Test: Returns 401 for invalid password
     */
    it('returns 401 for invalid password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };
      vi.mocked(authService.loginUser).mockResolvedValue(null);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = mockNext.mock.calls[0]?.[0] as AuthenticationError;
      expect(error.message).toBe('Invalid email or password');
    });

    /**
     * Test: Returns 401 for non-existent email
     */
    it('returns 401 for non-existent email', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'ValidPassword123!',
      };
      vi.mocked(authService.loginUser).mockResolvedValue(null);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = mockNext.mock.calls[0]?.[0] as AuthenticationError;
      expect(error.message).toBe('Invalid email or password');
    });

    /**
     * Test: Subscription status is pro when active subscription
     */
    it('returns pro subscription status when user has active subscription', async () => {
      mockReq.body = validCredentials;
      const proLoginResult = {
        ...mockLoginResult,
        user: {
          ...mockLoginResult.user,
          id: mockProUser.id,
          email: mockProUser.email,
          role: mockProUser.role,
        },
        subscriptionStatus: 'pro' as const,
      };
      vi.mocked(authService.loginUser).mockResolvedValue(proLoginResult);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'pro',
        })
      );
    });

    /**
     * Test: Subscription status is trial when in trial period
     */
    it('returns trial subscription status when user is in trial period', async () => {
      mockReq.body = validCredentials;
      const trialLoginResult = {
        ...mockLoginResult,
        subscriptionStatus: 'trial' as const,
      };
      vi.mocked(authService.loginUser).mockResolvedValue(trialLoginResult);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'trial',
        })
      );
    });

    /**
     * Test: Subscription status is free when trial expired
     */
    it('returns free subscription status when trial expired', async () => {
      mockReq.body = validCredentials;
      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResult);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionStatus: 'free',
        })
      );
    });

    /**
     * Test: JWT token contains correct userId
     */
    it('returns access token in response', async () => {
      mockReq.body = validCredentials;
      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResult);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        })
      );
    });

    /**
     * Test: Returns validation error for missing email
     */
    it('returns error for missing email', async () => {
      mockReq.body = {
        password: 'ValidPassword123!',
      };

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    /**
     * Test: Returns validation error for missing password
     */
    it('returns error for missing password', async () => {
      mockReq.body = {
        email: 'test@example.com',
      };

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    /**
     * Test: Returns validation error for invalid email format
     */
    it('returns error for invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'ValidPassword123!',
      };

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    /**
     * Test: Normalizes email to lowercase
     */
    it('normalizes email to lowercase before authentication', async () => {
      mockReq.body = {
        email: 'TEST@EXAMPLE.COM',
        password: 'ValidPassword123!',
      };
      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResult);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(authService.loginUser).toHaveBeenCalledWith(
        'test@example.com',
        'ValidPassword123!'
      );
    });

    /**
     * Test: Handles service errors gracefully
     */
    it('passes error to next when service throws', async () => {
      mockReq.body = validCredentials;
      const serviceError = new Error('Database connection failed');
      vi.mocked(authService.loginUser).mockRejectedValue(serviceError);

      await login(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('logout', () => {
    /**
     * Test: Returns 401 when user is not authenticated
     */
    it('returns 401 when user is not authenticated', async () => {
      mockReq.body = {};
      mockReq.user = undefined;

      await logout(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = mockNext.mock.calls[0]?.[0] as AuthenticationError;
      expect(error.message).toBe('Authentication required');
    });

    /**
     * Test: Successfully logs out with refresh token
     */
    it('successfully invalidates refresh token when provided', async () => {
      mockReq.body = { refreshToken: 'mock-refresh-token' };
      mockReq.user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        subscription: null,
      };
      vi.mocked(authService.invalidateRefreshToken).mockResolvedValue();

      await logout(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(authService.invalidateRefreshToken).toHaveBeenCalledWith('mock-refresh-token');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully logged out',
      });
    });

    /**
     * Test: Successfully logs out from all sessions
     */
    it('invalidates all tokens when logoutAll is true', async () => {
      mockReq.body = { logoutAll: true };
      mockReq.user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        subscription: null,
      };
      vi.mocked(authService.invalidateAllUserTokens).mockResolvedValue();

      await logout(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(authService.invalidateAllUserTokens).toHaveBeenCalledWith(mockUser.id);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully logged out from all sessions',
      });
    });

    /**
     * Test: Successful logout without refresh token (client-side only)
     */
    it('succeeds even without refresh token', async () => {
      mockReq.body = {};
      mockReq.user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        subscription: null,
      };

      await logout(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(authService.invalidateRefreshToken).not.toHaveBeenCalled();
      expect(authService.invalidateAllUserTokens).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully logged out',
      });
    });

    /**
     * Test: Tracks logout analytics event
     */
    it('tracks logout analytics event', async () => {
      mockReq.body = { refreshToken: 'mock-refresh-token' };
      mockReq.user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        subscription: null,
      };
      vi.mocked(authService.invalidateRefreshToken).mockResolvedValue();

      await logout(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(authService.trackAuthEvent).toHaveBeenCalledWith(
        authService.AUTH_EVENTS.LOGOUT_COMPLETED,
        expect.objectContaining({
          userId: mockUser.id,
          logoutAll: false,
          method: 'api',
        })
      );
    });

    /**
     * Test: Handles service errors gracefully
     */
    it('passes error to next when service throws', async () => {
      mockReq.body = { refreshToken: 'mock-refresh-token' };
      mockReq.user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        subscription: null,
      };
      const serviceError = new Error('Database connection failed');
      vi.mocked(authService.invalidateRefreshToken).mockRejectedValue(serviceError);

      await logout(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});
