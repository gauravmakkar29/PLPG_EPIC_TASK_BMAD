/**
 * @fileoverview ESLint configuration for React applications in PLPG.
 * Extends base configuration with React and React Hooks rules.
 *
 * @module @plpg/config/eslint/react
 * @description React-specific ESLint rules for frontend applications.
 *
 * @example
 * // In apps/web/.eslintrc.js
 * module.exports = {
 *   extends: ['@plpg/config/eslint/react'],
 *   parserOptions: {
 *     project: './tsconfig.json',
 *   },
 * };
 *
 * @see {@link https://github.com/jsx-eslint/eslint-plugin-react|ESLint Plugin React}
 * @see {@link https://www.npmjs.com/package/eslint-plugin-react-hooks|React Hooks Plugin}
 */

const baseConfig = require('./base');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...baseConfig,
  parserOptions: {
    ...baseConfig.parserOptions,
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    ...baseConfig.extends,
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  plugins: [...baseConfig.plugins, 'react', 'react-hooks'],
  settings: {
    ...baseConfig.settings,
    react: {
      version: 'detect',
    },
  },
  rules: {
    ...baseConfig.rules,

    // React-specific rules
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/jsx-no-target-blank': 'error',
    'react/jsx-curly-brace-presence': [
      'warn',
      { props: 'never', children: 'never' },
    ],
    'react/self-closing-comp': 'warn',
    'react/jsx-sort-props': [
      'warn',
      {
        callbacksLast: true,
        shorthandFirst: true,
        reservedFirst: true,
      },
    ],

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Accessibility
    'jsx-a11y/alt-text': 'off', // Enable when jsx-a11y is added
    'jsx-a11y/anchor-is-valid': 'off',
  },
  env: {
    browser: true,
    es2022: true,
  },
};
