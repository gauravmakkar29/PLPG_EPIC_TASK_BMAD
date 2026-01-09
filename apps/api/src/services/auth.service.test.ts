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
  loginUser,
  verifyPassword,
  getCurrentSession,
  getSubscriptionStatus,
  getTrialEndsAt,
  BCRYPT_COST_FACTOR,
  AUTH_EVENTS,
} from './auth.service';
import type { AuthenticatedUser } from '../types';

// Use vi.hoisted to define mockPrisma before vi.mock (which is hoisted)
const mockPrisma = vi.hoisted(() => ({
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
}));

// Mock the prisma module using synchronous factory (like auth.routes.test.ts)
vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
  getPrisma: () => mockPrisma,
  disconnectPrisma: vi.fn(),
  connectPrisma: vi.fn(),
  PrismaClient: vi.fn(),
}));

// Also mock at the shared package level to handle re-exports
vi.mock('@plpg/shared/prisma', () => ({
  prisma: mockPrisma,
  getPrisma: () => mockPrisma,
  disconnectPrisma: vi.fn(),
  connectPrisma: vi.fn(),
  PrismaClient: vi.fn(),
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

      // registerUser generates tokens internally, so verify they're valid JWT strings
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).toMatch(/^eyJ/); // JWT tokens start with 'eyJ'
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).toMatch(/^eyJ/);
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

  describe('getSubscriptionStatus', () => {
    it('should return active for user without subscription', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: 'Test User',
        emailVerified: false,
        subscription: null,
      };

      const status = getSubscriptionStatus(user);

      expect(status).toBe('active');
    });

    it('should return subscription status when present', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: 'Test User',
        emailVerified: false,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: new Date('2026-01-23'),
        },
      };

      const status = getSubscriptionStatus(user);

      expect(status).toBe('active');
    });

    it('should return expired when subscription is expired', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: 'Test User',
        emailVerified: false,
        subscription: {
          plan: 'free',
          status: 'expired',
          expiresAt: new Date('2025-12-01'),
        },
      };

      const status = getSubscriptionStatus(user);

      expect(status).toBe('expired');
    });

    it('should return cancelled when subscription is cancelled', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'pro',
        name: 'Test User',
        emailVerified: true,
        subscription: {
          plan: 'pro',
          status: 'cancelled',
          expiresAt: null,
        },
      };

      const status = getSubscriptionStatus(user);

      expect(status).toBe('cancelled');
    });
  });

  describe('getTrialEndsAt', () => {
    it('should return null for user without subscription', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: 'Test User',
        emailVerified: false,
        subscription: null,
      };

      const trialEndsAt = getTrialEndsAt(user);

      expect(trialEndsAt).toBeNull();
    });

    it('should return expiresAt for free plan users', () => {
      const expectedDate = new Date('2026-01-23');
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: 'Test User',
        emailVerified: false,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: expectedDate,
        },
      };

      const trialEndsAt = getTrialEndsAt(user);

      expect(trialEndsAt).toEqual(expectedDate);
    });

    it('should return null for pro plan users', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'pro',
        name: 'Test User',
        emailVerified: true,
        subscription: {
          plan: 'pro',
          status: 'active',
          expiresAt: new Date('2027-01-01'),
        },
      };

      const trialEndsAt = getTrialEndsAt(user);

      expect(trialEndsAt).toBeNull();
    });
  });

  describe('getCurrentSession', () => {
    it('should return session data with all required fields', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: 'Test User',
        emailVerified: false,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: new Date('2026-01-23'),
        },
      };

      const session = getCurrentSession(user);

      expect(session).toHaveProperty('userId', 'user-123');
      expect(session).toHaveProperty('email', 'test@example.com');
      expect(session).toHaveProperty('name', 'Test User');
      expect(session).toHaveProperty('subscriptionStatus', 'active');
      expect(session).toHaveProperty('trialEndsAt');
      expect(session).toHaveProperty('isVerified', false);
      expect(session).toHaveProperty('role', 'free');
    });

    it('should return correct subscriptionStatus', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: null,
        emailVerified: false,
        subscription: {
          plan: 'free',
          status: 'expired',
          expiresAt: new Date('2025-12-01'),
        },
      };

      const session = getCurrentSession(user);

      expect(session.subscriptionStatus).toBe('expired');
    });

    it('should return null trialEndsAt for non-trial users', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'pro',
        name: 'Pro User',
        emailVerified: true,
        subscription: {
          plan: 'pro',
          status: 'active',
          expiresAt: null,
        },
      };

      const session = getCurrentSession(user);

      expect(session.trialEndsAt).toBeNull();
    });

    it('should handle user without subscription', () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'free',
        name: 'New User',
        emailVerified: false,
        subscription: null,
      };

      const session = getCurrentSession(user);

      expect(session.userId).toBe('user-123');
      expect(session.subscriptionStatus).toBe('active');
      expect(session.trialEndsAt).toBeNull();
    });

    it('should return correct role for admin users', () => {
      const user: AuthenticatedUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
        emailVerified: true,
        subscription: null,
      };

      const session = getCurrentSession(user);

      expect(session.role).toBe('admin');
    });
  });
});

// Note: loginUser, verifyPassword, hashPassword are already imported at the top of the file
// The mocks are consolidated in the single vi.mock('../lib/prisma') at the top

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
      mockPrisma.user.findUnique.mockResolvedValue(userWithHash);
      mockPrisma.refreshToken.create.mockResolvedValue({
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
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await loginUser('nonexistent@example.com', validPassword);

      expect(result).toBeNull();
    });

    it('returns null for invalid password', async () => {
      const userWithHash = {
        ...mockUser,
        passwordHash: validPasswordHash,
        subscription: mockSubscription,
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithHash);

      const result = await loginUser(mockUser.email, 'WrongPassword123!');

      expect(result).toBeNull();
    });

    it('returns pro subscription status for user with active pro subscription', async () => {
      const proUserWithHash = {
        ...mockProUser,
        passwordHash: validPasswordHash,
        subscription: mockProSubscription,
      };
      mockPrisma.user.findUnique.mockResolvedValue(proUserWithHash);
      mockPrisma.refreshToken.create.mockResolvedValue({
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
      mockPrisma.user.findUnique.mockResolvedValue(newUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
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
      mockPrisma.user.findUnique.mockResolvedValue(oldUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
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
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);
      mockPrisma.refreshToken.create.mockResolvedValue({
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
      mockPrisma.user.findUnique.mockResolvedValue(userWithHash);
      mockPrisma.refreshToken.create.mockResolvedValue({
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
      mockPrisma.user.findUnique.mockResolvedValue(userWithHash);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await loginUser(mockUser.email, validPassword);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
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
      mockPrisma.user.findUnique.mockResolvedValue(userWithHash);
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      await loginUser('TEST@EXAMPLE.COM', validPassword);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { subscription: true },
      });
    });
  });
});
