/**
 * @fileoverview Unit tests for authentication service.
 * Tests login, password verification, and token generation.
 *
 * @module @plpg/api/services/auth.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  mockUser,
  mockProUser,
  mockSubscription,
  mockProSubscription,
} from '../test/db';

import { ConflictError } from '@plpg/shared';
import {
  hashPassword,
  comparePassword,
  calculateTrialEndDate,
  toAuthUser,
  trackAuthEvent,
  registerUser,
  BCRYPT_COST_FACTOR,
  AUTH_EVENTS,
} from './auth.service';

// Mock the prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  subscription: {
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

// Mock the lib modules
vi.mock('../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
}));

vi.mock('../lib/env', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-at-least-32-characters-long',
    BCRYPT_ROUNDS: '12',
    TRIAL_DURATION_DAYS: '14',
  },
  getBcryptRounds: () => 12,
  getTrialDurationDays: () => 14,
}));

vi.mock('../lib/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
}));

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'MySecurePassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('should use cost factor 12', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      // Bcrypt hash format: $2b$<rounds>$<salt><hash>
      // Extract rounds from hash
      const rounds = parseInt(hash.split('$')[2], 10);
      expect(rounds).toBe(12);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe('calculateTrialEndDate', () => {
    it('should add 14 days to start date', () => {
      const startDate = new Date('2026-01-01T00:00:00.000Z');
      const endDate = calculateTrialEndDate(startDate);

      expect(endDate.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    });

    it('should handle month boundaries', () => {
      const startDate = new Date('2026-01-25T00:00:00.000Z');
      const endDate = calculateTrialEndDate(startDate);

      expect(endDate.toISOString()).toBe('2026-02-08T00:00:00.000Z');
    });
  });

  describe('toAuthUser', () => {
    it('should transform database user to AuthUser', () => {
      const dbUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'free' as const,
        emailVerified: false,
        createdAt: new Date('2026-01-01'),
      };

      const authUser = toAuthUser(dbUser);

      expect(authUser).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'free',
        isVerified: false,
        createdAt: new Date('2026-01-01'),
      });
    });

    it('should handle null name and avatarUrl', () => {
      const dbUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        avatarUrl: null,
        role: 'pro' as const,
        emailVerified: true,
        createdAt: new Date(),
      };

      const authUser = toAuthUser(dbUser);

      expect(authUser.name).toBeNull();
      expect(authUser.avatarUrl).toBeNull();
      expect(authUser.isVerified).toBe(true);
    });
  });

  describe('trackAuthEvent', () => {
    it('should log auth events', () => {
      // trackAuthEvent uses logger.info which is mocked
      expect(() => {
        trackAuthEvent(AUTH_EVENTS.SIGNUP_COMPLETED, { userId: 'test-123' });
      }).not.toThrow();
    });
  });

  describe('registerUser', () => {
    const validInput = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
    };

    const mockCreatedUser = {
      id: 'new-user-id',
      email: 'newuser@example.com',
      name: 'New User',
      avatarUrl: null,
      role: 'free' as const,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: 'hashed-password',
    };

    const mockRefreshToken = {
      id: 'token-id',
      token: 'token-uuid',
      userId: 'new-user-id',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            user: {
              create: vi.fn().mockResolvedValue(mockCreatedUser),
            },
            subscription: {
              create: vi.fn().mockResolvedValue({}),
            },
            refreshToken: {
              create: vi.fn().mockResolvedValue(mockRefreshToken),
            },
          });
        }
      );
    });

    it('should create user with hashed password', async () => {
      const result = await registerUser(validInput);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validInput.email);
      expect(result.user.name).toBe(validInput.name);
      expect(result.user.role).toBe('free');
    });

    it('should return access and refresh tokens', async () => {
      const result = await registerUser(validInput);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw ConflictError for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: validInput.email,
      });

      await expect(registerUser(validInput)).rejects.toThrow(ConflictError);
      await expect(registerUser(validInput)).rejects.toThrow(
        'A user with this email already exists'
      );
    });

    it('should return 409 status for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: validInput.email,
      });

      try {
        await registerUser(validInput);
        expect.fail('Should have thrown ConflictError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
        expect((error as ConflictError).status).toBe(409);
      }
    });

    it('should not return password in response', async () => {
      const result = await registerUser(validInput);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should set user role to free by default', async () => {
      const result = await registerUser(validInput);

      expect(result.user.role).toBe('free');
    });

    it('should set isVerified to false for new users', async () => {
      const result = await registerUser(validInput);

      expect(result.user.isVerified).toBe(false);
    });

    it('should check for existing email before creating user', async () => {
      await registerUser(validInput);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validInput.email },
      });
    });

    it('should use transaction for atomic operations', async () => {
      await registerUser(validInput);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('BCRYPT_COST_FACTOR', () => {
    it('should be 12 as per security requirements', () => {
      expect(BCRYPT_COST_FACTOR).toBe(12);
    });
  });

  describe('AUTH_EVENTS', () => {
    it('should have signup_completed event', () => {
      expect(AUTH_EVENTS.SIGNUP_COMPLETED).toBe('signup_completed');
    });
  });
});
// Create hoisted mocks
const mocks = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
  mockDeleteMany: vi.fn(),
}));

// Mock Prisma module using hoisted mocks
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.mockFindUnique,
    },
    refreshToken: {
      create: mocks.mockCreate,
      delete: mocks.mockDelete,
      deleteMany: mocks.mockDeleteMany,
    },
  },
}));

// Import the service under test after mocking
import { loginUser, verifyPassword, hashPassword } from './auth.service';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyPassword', () => {
    it('returns true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);

      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('returns false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await bcrypt.hash(password, 10);

      const result = await verifyPassword(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('returns a valid bcrypt hash', async () => {
      const password = 'TestPassword123!';

      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('produces different hashes for same password', async () => {
      const password = 'TestPassword123!';

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('loginUser', () => {
    const validPassword = 'ValidPassword123!';
    let validPasswordHash: string;

    beforeEach(async () => {
      validPasswordHash = await bcrypt.hash(validPassword, 10);
    });

    it('returns tokens and user data for valid credentials', async () => {
      const userWithHash = {
        ...mockUser,
        passwordHash: validPasswordHash,
        subscription: mockSubscription,
      };
      mocks.mockFindUnique.mockResolvedValue(userWithHash);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await loginUser(mockUser.email, validPassword);

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(mockUser.id);
      expect(result?.user.email).toBe(mockUser.email);
      expect(result?.accessToken).toBeDefined();
      expect(result?.refreshToken).toBeDefined();
    });

    it('returns null for non-existent email', async () => {
      mocks.mockFindUnique.mockResolvedValue(null);

      const result = await loginUser('nonexistent@example.com', validPassword);

      expect(result).toBeNull();
    });

    it('returns null for invalid password', async () => {
      const userWithHash = {
        ...mockUser,
        passwordHash: validPasswordHash,
        subscription: mockSubscription,
      };
      mocks.mockFindUnique.mockResolvedValue(userWithHash);

      const result = await loginUser(mockUser.email, 'WrongPassword123!');

      expect(result).toBeNull();
    });

    it('returns pro subscription status for user with active pro subscription', async () => {
      const proUserWithHash = {
        ...mockProUser,
        passwordHash: validPasswordHash,
        subscription: mockProSubscription,
      };
      mocks.mockFindUnique.mockResolvedValue(proUserWithHash);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockProUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await loginUser(mockProUser.email, validPassword);

      expect(result?.subscriptionStatus).toBe('pro');
    });

    it('returns trial subscription status for new user within trial period', async () => {
      const newUser = {
        ...mockUser,
        passwordHash: validPasswordHash,
        createdAt: new Date(), // Just created
        subscription: null,
      };
      mocks.mockFindUnique.mockResolvedValue(newUser);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await loginUser(mockUser.email, validPassword);

      expect(result?.subscriptionStatus).toBe('trial');
    });

    it('returns free subscription status for user after trial period', async () => {
      const oldUser = {
        ...mockUser,
        passwordHash: validPasswordHash,
        createdAt: new Date('2020-01-01'), // Long ago - trial expired
        subscription: null,
      };
      mocks.mockFindUnique.mockResolvedValue(oldUser);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await loginUser(mockUser.email, validPassword);

      expect(result?.subscriptionStatus).toBe('free');
    });

    it('returns pro status for admin users regardless of subscription', async () => {
      const adminUser = {
        ...mockUser,
        role: 'admin' as const,
        passwordHash: validPasswordHash,
        subscription: null,
      };
      mocks.mockFindUnique.mockResolvedValue(adminUser);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await loginUser(mockUser.email, validPassword);

      expect(result?.subscriptionStatus).toBe('pro');
    });

    it('generates valid JWT access token with correct payload', async () => {
      const userWithHash = {
        ...mockUser,
        passwordHash: validPasswordHash,
        subscription: mockSubscription,
      };
      mocks.mockFindUnique.mockResolvedValue(userWithHash);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await loginUser(mockUser.email, validPassword);

      expect(result?.accessToken).toBeDefined();
      const decoded = jwt.decode(result!.accessToken) as {
        userId: string;
        email: string;
        role: string;
      };
      expect(decoded.userId).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('stores refresh token in database', async () => {
      const userWithHash = {
        ...mockUser,
        passwordHash: validPasswordHash,
        subscription: mockSubscription,
      };
      mocks.mockFindUnique.mockResolvedValue(userWithHash);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await loginUser(mockUser.email, validPassword);

      expect(mocks.mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('normalizes email to lowercase', async () => {
      const userWithHash = {
        ...mockUser,
        passwordHash: validPasswordHash,
        subscription: mockSubscription,
      };
      mocks.mockFindUnique.mockResolvedValue(userWithHash);
      mocks.mockCreate.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await loginUser('TEST@EXAMPLE.COM', validPassword);

      expect(mocks.mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { subscription: true },
      });
    });
  });
});
