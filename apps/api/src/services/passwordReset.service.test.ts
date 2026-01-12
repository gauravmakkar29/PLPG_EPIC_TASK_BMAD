/**
 * @fileoverview Tests for password reset service.
 * Tests forgot password and reset password functionality.
 *
 * @module @plpg/api/services/passwordReset.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Mock modules before importing the service
vi.mock('../lib/prisma', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    avatarUrl: null,
    role: 'free',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn().mockResolvedValue(mockUser),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    refreshToken: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };

  return {
    prisma: mockPrisma,
    getPrisma: vi.fn(() => mockPrisma),
  };
});

vi.mock('./email.service', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  cleanupExpiredTokens,
} from './passwordReset.service';
import { getPrisma } from '../lib/prisma';

describe('Password Reset Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('should return success message even for non-existent email (security)', async () => {
      const db = getPrisma();
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await requestPasswordReset('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
    });

    it('should normalize email to lowercase', async () => {
      const db = getPrisma();
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await requestPasswordReset('TEST@EXAMPLE.COM');

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return success for existing user', async () => {
      const db = getPrisma();
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed',
        name: 'Test',
        avatarUrl: null,
        role: 'free' as const,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(db.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(db.passwordResetToken.create).mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed-token',
        userId: mockUser.id,
        email: mockUser.email,
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        createdAt: new Date(),
      });

      const result = await requestPasswordReset(mockUser.email);

      expect(result.success).toBe(true);
      expect(db.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe('validateResetToken', () => {
    it('should return false for non-existent token', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(null);

      const result = await validateResetToken('invalid-token');

      expect(result).toBe(false);
    });

    it('should return false for expired token', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() - 1000), // Expired
        usedAt: null,
        createdAt: new Date(),
      });

      const result = await validateResetToken('some-token');

      expect(result).toBe(false);
    });

    it('should return false for already used token', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // Already used
        createdAt: new Date(),
      });

      const result = await validateResetToken('some-token');

      expect(result).toBe(false);
    });

    it('should return true for valid token', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        createdAt: new Date(),
      });

      const result = await validateResetToken('some-token');

      expect(result).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should throw error for invalid token', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(null);

      await expect(resetPassword('invalid-token', 'NewPass123!')).rejects.toThrow(
        'Invalid or expired reset token'
      );
    });

    it('should throw error for expired token', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() - 1000), // Expired
        usedAt: null,
        createdAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          passwordHash: 'hashed',
          name: 'Test',
          avatarUrl: null,
          role: 'free' as const,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as never);
      vi.mocked(db.passwordResetToken.delete).mockResolvedValue({} as never);

      await expect(resetPassword('some-token', 'NewPass123!')).rejects.toThrow(
        'expired'
      );
    });

    it('should throw error for already used token', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // Already used
        createdAt: new Date(),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          passwordHash: 'hashed',
          name: 'Test',
          avatarUrl: null,
          role: 'free' as const,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as never);

      await expect(resetPassword('some-token', 'NewPass123!')).rejects.toThrow(
        'already been used'
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and used tokens', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.deleteMany).mockResolvedValue({ count: 5 });

      const result = await cleanupExpiredTokens();

      expect(result).toBe(5);
    });

    it('should return 0 when no tokens to clean', async () => {
      const db = getPrisma();
      vi.mocked(db.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });

      const result = await cleanupExpiredTokens();

      expect(result).toBe(0);
    });
  });
});

describe('Token hashing', () => {
  it('should generate consistent hashes for same input', () => {
    const token = 'test-token';
    const hash1 = crypto.createHash('sha256').update(token).digest('hex');
    const hash2 = crypto.createHash('sha256').update(token).digest('hex');

    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different inputs', () => {
    const hash1 = crypto.createHash('sha256').update('token1').digest('hex');
    const hash2 = crypto.createHash('sha256').update('token2').digest('hex');

    expect(hash1).not.toBe(hash2);
  });
});
