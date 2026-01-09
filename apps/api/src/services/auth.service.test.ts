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
import {
  loginUser,
  verifyPassword,
  hashPassword,
} from './auth.service';

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
