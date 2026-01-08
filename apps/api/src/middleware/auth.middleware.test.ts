/**
 * @fileoverview Tests for authentication middleware.
 * Example test demonstrating backend middleware testing patterns.
 *
 * @module @plpg/api/middleware/auth.middleware.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, requirePro } from './auth.middleware';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  mockUser,
  mockProUser,
  mockSubscription,
  mockProSubscription,
} from '../test/db';
import { AuthenticationError, ForbiddenError } from '@plpg/shared';

describe('Auth Middleware', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('requireAuth', () => {
    /**
     * Tests that requireAuth passes when user is present.
     */
    it('calls next() when user is authenticated', () => {
      mockReq.user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
        emailVerified: mockUser.emailVerified,
        subscription: mockSubscription,
      };

      requireAuth(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    /**
     * Tests that requireAuth throws error when user is missing.
     */
    it('calls next with AuthenticationError when user is not present', () => {
      mockReq.user = undefined;

      requireAuth(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });
  });

  describe('requirePro', () => {
    /**
     * Tests that requirePro passes for admin users.
     */
    it('calls next() for admin users', () => {
      mockReq.user = {
        id: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
        emailVerified: true,
        subscription: null,
      };

      requirePro(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    /**
     * Tests that requirePro passes for pro users with active subscription.
     */
    it('calls next() for pro users with active subscription', () => {
      mockReq.user = {
        id: mockProUser.id,
        email: mockProUser.email,
        role: mockProUser.role,
        name: mockProUser.name,
        emailVerified: mockProUser.emailVerified,
        subscription: {
          plan: mockProSubscription.plan,
          status: mockProSubscription.status,
          expiresAt: mockProSubscription.expiresAt,
        },
      };

      requirePro(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    /**
     * Tests that requirePro denies free users.
     */
    it('calls next with ForbiddenError for free users', () => {
      mockReq.user = {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
        emailVerified: mockUser.emailVerified,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: null,
        },
      };

      requirePro(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    /**
     * Tests that requirePro throws AuthenticationError when user is missing.
     */
    it('calls next with AuthenticationError when user is not present', () => {
      mockReq.user = undefined;

      requirePro(
        mockReq as unknown as Request,
        mockRes as unknown as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });
  });
});
