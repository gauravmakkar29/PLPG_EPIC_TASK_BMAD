/**
 * @fileoverview Prettier configuration for PLPG monorepo.
 * Ensures consistent code formatting across all packages.
 *
 * @module @plpg/config/prettier
 * @description Shared Prettier configuration for consistent code style.
 *
 * @example
 * // In your .prettierrc.js
 * module.exports = require('@plpg/config/prettier');
 *
 * // Or in package.json
 * {
 *   "prettier": "@plpg/config/prettier"
 * }
 *
 * @see {@link https://prettier.io/docs/en/options.html|Prettier Options}
 */

/** @type {import('prettier').Config} */
module.exports = {
  // Line width
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // Semicolons
  semi: true,

  // Quotes
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',

  // Trailing commas
  trailingComma: 'es5',

  // Brackets and spacing
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Prose wrapping (for markdown)
  proseWrap: 'preserve',

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // End of line
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Single attribute per line in HTML/JSX
  singleAttributePerLine: false,

  // Plugin-specific options
  plugins: [],

  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 100,
      },
    },
    {
      files: ['*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
