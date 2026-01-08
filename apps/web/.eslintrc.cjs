/**
 * @fileoverview ESLint configuration for PLPG Web Application.
 * Extends the shared React ESLint configuration from @plpg/config.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve('@plpg/config/eslint/react')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.*'],
};
