/**
 * @fileoverview Vitest configuration for PLPG shared package.
 * Configures Node.js environment for validation and utility testing.
 *
 * @module @plpg/shared/vitest.config
 * @description Test configuration for the shared package.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Include patterns
    include: ['src/**/*.{test,spec}.ts'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'prisma'],

    // Global variables available in tests
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/prisma/**/*',
        'src/**/index.ts',
      ],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Reporter
    reporters: ['default'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
