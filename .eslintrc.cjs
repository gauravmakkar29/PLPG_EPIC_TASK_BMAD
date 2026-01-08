/**
 * @fileoverview Root ESLint configuration for PLPG monorepo.
 * This is a minimal config - each workspace has its own specific config.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    'apps/*/dist',
    'packages/*/dist',
  ],
};
