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
  rules: {
    // Relax some rules for server code
    'no-process-exit': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/promise-function-async': 'off',

    // Disable problematic import rules (tsx handles resolution)
    'import/no-unresolved': 'off',
    'import/namespace': 'off',
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/order': 'off',
    'import/no-duplicates': 'off',
  },
  ignorePatterns: ['dist', 'node_modules'],
};
