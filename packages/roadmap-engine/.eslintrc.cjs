/**
 * @fileoverview ESLint configuration for PLPG Roadmap Engine Package.
 * Extends the shared base ESLint configuration from @plpg/config.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve('@plpg/config/eslint/base')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules'],
};
