/**
 * @fileoverview Tests for authentication controller.
 * Validates login, register, and token management endpoints.
 *
 * @module @plpg/api/controllers/auth.controller.test
 */

/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@plpg/shared';
import bcrypt from 'bcryptjs';
import { login, register } from './auth.controller';
import { prisma } from '../lib/prisma';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    onboardingResponse: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return 400 for invalid request body', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: '',
      };

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid request body',
        })
      );
    });

    it('should return 401 for non-existent user', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });

    it('should return 401 for invalid password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'free' as UserRole,
        emailVerified: true,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });

    it('should return tokens and user data on successful login', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: false,
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'free' as UserRole,
        emailVerified: true,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOnboarding = {
        id: '1',
        userId: '1',
        currentRole: 'developer',
        targetRole: 'ml_engineer',
        weeklyHours: 10,
        skillsToSkip: [],
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        id: '1',
        token: 'refresh-token',
        userId: '1',
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.onboardingResponse.findUnique).mockResolvedValue(
        mockOnboarding
      );

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
          redirectPath: '/dashboard',
        })
      );
    });

    it('should redirect to onboarding if incomplete', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'free' as UserRole,
        emailVerified: true,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        id: '1',
        token: 'refresh-token',
        userId: '1',
        expiresAt: new Date(),
        createdAt: new Date(),
      });
      vi.mocked(prisma.refreshToken.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.onboardingResponse.findUnique).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectPath: '/onboarding',
        })
      );
    });
  });

  describe('register', () => {
    it('should return 400 for invalid request body', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: 'weak',
        name: '',
      };

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid request body',
        })
      );
    });

    it('should return 400 if email already exists', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const mockExistingUser = {
        id: '1',
        email: 'existing@example.com',
        passwordHash: 'hashed',
        name: 'Existing User',
        role: 'free' as UserRole,
        emailVerified: false,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockExistingUser);

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email address is already registered',
      });
    });

    it('should create user and return tokens on successful registration', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      };

      const mockNewUser = {
        id: '1',
        email: 'newuser@example.com',
        passwordHash: 'hashed-password',
        name: 'New User',
        role: 'free' as UserRole,
        emailVerified: false,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockNewUser);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        id: '1',
        token: 'refresh-token',
        userId: '1',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: {
            id: '1',
            email: 'newuser@example.com',
            name: 'New User',
          },
          emailVerificationRequired: true,
        })
      );
    });
  });
});
