/**
 * @fileoverview ESLint configuration for PLPG API Application.
 * Extends the shared Node.js ESLint configuration from @plpg/config.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve('@plpg/config/eslint/node')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules'],
};
