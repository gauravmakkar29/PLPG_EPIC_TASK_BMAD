/**
 * @fileoverview Main entry point for @plpg/config package.
 * Re-exports all configuration presets for easy access.
 *
 * @module @plpg/config
 * @description Centralized configuration management for PLPG monorepo.
 *
 * @example
 * // Import specific configs
 * const eslintBase = require('@plpg/config/eslint/base');
 * const eslintReact = require('@plpg/config/eslint/react');
 * const eslintNode = require('@plpg/config/eslint/node');
 * const tailwindPreset = require('@plpg/config/tailwind');
 * const prettierConfig = require('@plpg/config/prettier');
 *
 * // TypeScript configs are JSON and should be extended in tsconfig.json:
 * // "extends": "@plpg/config/typescript/base"
 */

module.exports = {
  /**
   * ESLint configurations
   * @property {Object} eslint.base - Base ESLint rules for all packages
   * @property {Object} eslint.react - React-specific ESLint rules
   * @property {Object} eslint.node - Node.js-specific ESLint rules
   */
  eslint: {
    base: require('./eslint/base'),
    react: require('./eslint/react'),
    node: require('./eslint/node'),
  },

  /**
   * Tailwind CSS preset with design tokens
   * @property {Object} tailwind - Complete Tailwind preset
   */
  tailwind: require('./tailwind/preset'),

  /**
   * Prettier configuration
   * @property {Object} prettier - Prettier formatting rules
   */
  prettier: require('./prettier'),
};
