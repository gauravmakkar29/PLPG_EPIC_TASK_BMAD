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
  process.env['JWT_SECRET'] = 'test-jwt-secret-at-least-32-characters-long';
  process.env['JWT_REFRESH_SECRET'] =
    'test-jwt-refresh-secret-at-least-32-characters-long';
  process.env['BCRYPT_ROUNDS'] = '4'; // Lower for faster tests
  process.env['TRIAL_DURATION_DAYS'] = '14';
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
