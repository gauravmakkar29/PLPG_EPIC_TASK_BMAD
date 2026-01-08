/**
 * @fileoverview Global test setup for PLPG API application.
 * Configures test environment and global mocks.
 *
 * @module @plpg/api/test/setup
 * @description Global setup that runs before all tests.
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

/**
 * Mock environment variables for testing.
 */
beforeAll(() => {
  process.env['NODE_ENV'] = 'test';
  process.env['JWT_SECRET'] = 'test-jwt-secret-for-testing-only';
  process.env['LOG_LEVEL'] = 'silent';
});

/**
 * Clear all mocks after each test.
 */
afterEach(() => {
  vi.clearAllMocks();
});

/**
 * Restore all mocks after all tests.
 */
afterAll(() => {
  vi.restoreAllMocks();
});

/**
 * Mock Pino logger to suppress output during tests.
 */
vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
    })),
  },
}));
