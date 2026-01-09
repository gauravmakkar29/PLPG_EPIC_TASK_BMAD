/**
 * @fileoverview Unit tests for JWT utility module.
 * Tests token generation and verification functions.
 *
 * @module @plpg/api/lib/jwt.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@plpg/shared';

// Mock env before importing jwt module
vi.mock('./env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-at-least-32-characters-long',
  },
}));

// Import after mocking
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from './jwt';

describe('jwt utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'free' as const,
      };

      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include userId in token payload', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'free' as const,
      };

      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe('user-123');
    });

    it('should include email in token payload', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'free' as const,
      };

      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.email).toBe('test@example.com');
    });

    it('should include role in token payload', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'pro' as const,
      };

      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.role).toBe('pro');
    });

    it('should include iat and exp timestamps', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'free' as const,
      };

      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload = {
        userId: 'user-123',
        tokenId: 'token-456',
      };

      const token = generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include userId in refresh token', () => {
      const payload = {
        userId: 'user-123',
        tokenId: 'token-456',
      };

      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe('user-123');
    });

    it('should include tokenId in refresh token', () => {
      const payload = {
        userId: 'user-123',
        tokenId: 'token-456',
      };

      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.tokenId).toBe('token-456');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'free' as const,
      };

      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw AuthenticationError for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow(
        AuthenticationError
      );
    });

    it('should throw AuthenticationError for malformed token', () => {
      expect(() => verifyAccessToken('not.a.valid.jwt.token')).toThrow(
        AuthenticationError
      );
    });

    it('should throw AuthenticationError for expired token', () => {
      // Create an already expired token
      const expiredToken = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'free' },
        'test-jwt-secret-at-least-32-characters-long',
        { expiresIn: '-1s', issuer: 'plpg-api', audience: 'plpg-client' }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow(AuthenticationError);
      expect(() => verifyAccessToken(expiredToken)).toThrow('Token has expired');
    });

    it('should throw for token signed with wrong secret', () => {
      const wrongSecretToken = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'free' },
        'wrong-secret-key-that-is-also-32-chars',
        { expiresIn: '15m' }
      );

      expect(() => verifyAccessToken(wrongSecretToken)).toThrow(
        AuthenticationError
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const payload = {
        userId: 'user-123',
        tokenId: 'token-456',
      };

      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.tokenId).toBe('token-456');
    });

    it('should throw AuthenticationError for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow(
        AuthenticationError
      );
    });

    it('should throw AuthenticationError for expired refresh token', () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', tokenId: 'token-456' },
        'test-jwt-refresh-secret-at-least-32-characters-long',
        { expiresIn: '-1s', issuer: 'plpg-api', audience: 'plpg-client' }
      );

      expect(() => verifyRefreshToken(expiredToken)).toThrow(AuthenticationError);
      expect(() => verifyRefreshToken(expiredToken)).toThrow(
        'Refresh token has expired'
      );
    });
  });

  describe('REFRESH_TOKEN_EXPIRY_MS', () => {
    it('should be 7 days in milliseconds', () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(REFRESH_TOKEN_EXPIRY_MS).toBe(sevenDaysMs);
    });
  });
});
