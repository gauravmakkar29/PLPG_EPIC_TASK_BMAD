/**
 * @fileoverview Vitest workspace configuration for PLPG monorepo.
 * Defines test environments for all packages and applications.
 *
 * @module plpg/vitest.workspace
 * @description Workspace configuration for running tests across the monorepo.
 *
 * @example
 * // Run all tests
 * npm test
 *
 * // Run tests in watch mode
 * npm run test:watch
 *
 * // Run tests with coverage
 * npm run test:coverage
 */

import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Frontend React application (jsdom environment)
  'apps/web/vitest.config.ts',

  // Backend API application (node environment)
  'apps/api/vitest.config.ts',

  // Shared package (node environment)
  'packages/shared/vitest.config.ts',
]);
