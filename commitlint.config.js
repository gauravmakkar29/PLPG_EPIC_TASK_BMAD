/**
 * @fileoverview Commitlint configuration for PLPG monorepo.
 *
 * This configuration enforces the Conventional Commits specification
 * (https://www.conventionalcommits.org/) to ensure consistent and
 * meaningful commit messages across the project.
 *
 * Commit Message Format:
 *   <type>(<scope>): <subject>
 *
 *   [optional body]
 *
 *   [optional footer(s)]
 *
 * Examples:
 *   feat(web): add user authentication flow
 *   fix(api): resolve database connection timeout
 *   docs(shared): update API documentation
 *   chore(deps): upgrade vitest to v3.2.3
 *
 * @see https://commitlint.js.org/
 */

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],

  /**
   * Custom rules to extend or override the conventional config.
   * Rule format: [level, applicable, value]
   *   - level: 0 = disable, 1 = warning, 2 = error
   *   - applicable: 'always' | 'never'
   *   - value: rule-specific value
   */
  rules: {
    /**
     * Allowed commit types.
     * These align with the Conventional Commits specification and
     * common development workflows.
     */
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature or functionality
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Code style changes (formatting, semicolons, etc.)
        'refactor', // Code refactoring without changing functionality
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Build system or external dependency changes
        'ci',       // CI/CD configuration changes
        'chore',    // Maintenance tasks, tooling, etc.
        'revert',   // Reverting a previous commit
      ],
    ],

    /**
     * Allowed scopes for commit messages.
     * Scopes help identify which part of the codebase is affected.
     */
    'scope-enum': [
      2,
      'always',
      [
        // Application scopes
        'web',      // Frontend web application
        'api',      // Backend API service

        // Package scopes
        'shared',   // Shared types, utilities, and validation
        'config',   // Shared configuration (ESLint, TypeScript, etc.)
        'ui',       // UI component library (future)

        // Domain scopes
        'auth',     // Authentication and authorization
        'roadmap',  // Roadmap generation engine
        'onboarding', // User onboarding flow
        'dashboard', // Dashboard and progress tracking

        // Infrastructure scopes
        'infra',    // Infrastructure and deployment
        'ci',       // CI/CD pipelines
        'docker',   // Docker/containerization

        // Other scopes
        'deps',     // Dependency updates
        'release',  // Release-related changes
      ],
    ],

    /**
     * Allow empty scope for general changes that span multiple areas.
     */
    'scope-empty': [1, 'never'],

    /**
     * Enforce lowercase type.
     */
    'type-case': [2, 'always', 'lower-case'],

    /**
     * Enforce lowercase subject.
     */
    'subject-case': [2, 'always', 'lower-case'],

    /**
     * Subject must not end with a period.
     */
    'subject-full-stop': [2, 'never', '.'],

    /**
     * Subject must not be empty.
     */
    'subject-empty': [2, 'never'],

    /**
     * Maximum header length (type + scope + subject).
     * Keeps commit messages readable in git log.
     */
    'header-max-length': [2, 'always', 100],

    /**
     * Body must have blank line after header.
     */
    'body-leading-blank': [2, 'always'],

    /**
     * Footer must have blank line after body.
     */
    'footer-leading-blank': [2, 'always'],
  },

  /**
   * Help message displayed when a commit is rejected.
   * Provides guidance on how to write a proper commit message.
   */
  helpUrl:
    'https://github.com/plpg/plpg/blob/main/CONTRIBUTING.md#commit-messages',
};
