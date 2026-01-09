/**
 * @fileoverview ESLint configuration for Node.js applications in PLPG.
 * Extends base configuration with Node.js-specific environment and rules.
 *
 * @module @plpg/config/eslint/node
 * @description Node.js-specific ESLint rules for backend applications.
 *
 * @example
 * // In apps/api/.eslintrc.js
 * module.exports = {
 *   extends: ['@plpg/config/eslint/node'],
 *   parserOptions: {
 *     project: './tsconfig.json',
 *   },
 * };
 *
 * @see {@link https://eslint.org/docs/latest/use/configure/|ESLint Configuration}
 */

const baseConfig = require('./base');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...baseConfig,
  extends: [...baseConfig.extends],
  plugins: [...baseConfig.plugins],
  rules: {
    ...baseConfig.rules,

    // Node.js-specific rules
    'no-process-exit': 'warn',
    'no-sync': 'warn',

    // Allow console in Node.js backend (logging)
    'no-console': 'off',

    // Security considerations
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Async/await best practices
    'require-await': 'off', // Handled by @typescript-eslint
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/promise-function-async': 'warn',
  },
  env: {
    node: true,
    es2022: true,
  },
};
