/**
 * @fileoverview Prisma mock utilities for testing.
 * Provides mock Prisma client and test data seeders.
 *
 * @module @plpg/api/test/db
 * @description Database mocking utilities for unit and integration tests.
 *
 * @example
 * // Unit test with mock Prisma
 * import { createMockPrisma, mockUser } from '@/test/db';
 * import { vi } from 'vitest';
 *
 * vi.mock('@/lib/prisma', () => ({
 *   prisma: createMockPrisma(),
 * }));
 *
 * test('finds user by id', async () => {
 *   const { prisma } = await import('@/lib/prisma');
 *   prisma.user.findUnique.mockResolvedValue(mockUser);
 *   // ... test code
 * });
 */

import { vi } from 'vitest';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '@prisma/client';

/**
 * Mock Prisma client type.
 * Deep mock of PrismaClient with all methods as Vitest mocks.
 */
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/**
 * Creates a mock Prisma client.
 * Use this for unit tests that need to mock database operations.
 *
 * @function createMockPrisma
 * @returns {MockPrismaClient} Deep mock of PrismaClient
 *
 * @example
 * import { createMockPrisma } from '@/test/db';
 *
 * const mockPrisma = createMockPrisma();
 * mockPrisma.user.findUnique.mockResolvedValue(mockUser);
 */
export function createMockPrisma(): MockPrismaClient {
  return mockDeep<PrismaClient>();
}

/**
 * Resets all mock implementations on a mock Prisma client.
 *
 * @function resetMockPrisma
 * @param {MockPrismaClient} mock - The mock Prisma client to reset
 *
 * @example
 * afterEach(() => {
 *   resetMockPrisma(mockPrisma);
 * });
 */
export function resetMockPrisma(mock: MockPrismaClient): void {
  mockReset(mock);
}

/**
 * Mock user data for testing.
 * Represents a typical user in the database.
 */
export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  passwordHash: '$2b$10$mockHashedPasswordForTesting',
  name: 'Test User',
  avatarUrl: null,
  role: 'free' as const,
  emailVerified: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

/**
 * Mock pro user data for testing.
 * Represents a user with Pro subscription.
 */
export const mockProUser = {
  ...mockUser,
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'pro@example.com',
  role: 'pro' as const,
};

/**
 * Mock admin user data for testing.
 * Represents an admin user.
 */
export const mockAdminUser = {
  ...mockUser,
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'admin@example.com',
  role: 'admin' as const,
};

/**
 * Mock subscription data for testing.
 */
export const mockSubscription = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  userId: mockUser.id,
  plan: 'free' as const,
  status: 'active' as const,
  expiresAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

/**
 * Mock Pro subscription data for testing.
 */
export const mockProSubscription = {
  ...mockSubscription,
  id: '660e8400-e29b-41d4-a716-446655440001',
  userId: mockProUser.id,
  plan: 'pro' as const,
  expiresAt: new Date('2027-01-01T00:00:00.000Z'),
};

/**
 * Mock refresh token data for testing.
 */
export const mockRefreshToken = {
  id: '770e8400-e29b-41d4-a716-446655440000',
  token: 'mock-refresh-token',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date(),
};

/**
 * Mock user with subscription relation.
 */
export const mockUserWithSubscription = {
  ...mockUser,
  subscription: mockSubscription,
};

/**
 * Mock Pro user with subscription relation.
 */
export const mockProUserWithSubscription = {
  ...mockProUser,
  subscription: mockProSubscription,
};

/**
 * Creates mock request object for Express middleware testing.
 *
 * @function createMockRequest
 * @param {Partial<Request>} [overrides] - Properties to override
 * @returns {Request} Mock Express request object
 */
export function createMockRequest(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    headers: {} as Record<string, string>,
    params: {} as Record<string, string>,
    query: {} as Record<string, string>,
    body: {} as Record<string, unknown>,
    user: undefined as unknown,
    ...overrides,
  };
}

/**
 * Creates mock response object for Express middleware testing.
 *
 * @function createMockResponse
 * @returns {Response} Mock Express response object with spies
 */
export function createMockResponse(): Record<string, ReturnType<typeof vi.fn>> {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Creates mock next function for Express middleware testing.
 *
 * @function createMockNext
 * @returns {NextFunction} Mock Express next function
 */
export function createMockNext(): ReturnType<typeof vi.fn> {
  return vi.fn();
}
