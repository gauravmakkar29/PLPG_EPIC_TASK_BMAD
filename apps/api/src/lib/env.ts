/**
 * @fileoverview Environment configuration module.
 * Loads and validates environment variables for the API.
 *
 * @module @plpg/api/lib/env
 * @description Centralized environment variable management.
 */

import { z } from 'zod';

/**
 * Environment variable schema for validation.
 *
 * @constant envSchema
 * @description Zod schema defining required and optional environment variables.
 */
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3001'),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // Bcrypt configuration
  BCRYPT_ROUNDS: z.string().default('12'),

  // Trial configuration
  TRIAL_DURATION_DAYS: z.string().default('14'),

  // SMTP configuration for email
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('1025'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@plpg.dev'),

  // Frontend URL for reset links
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

/**
 * Validated environment variable type.
 *
 * @typedef {z.infer<typeof envSchema>} Env
 */
type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates environment variables.
 *
 * @function parseEnv
 * @returns {Env} Validated environment variables
 * @throws {Error} If required environment variables are missing or invalid
 */
function parseEnv(): Env {
  // In test environment, provide defaults for JWT secrets if not set
  const testDefaults =
    process.env['NODE_ENV'] === 'test'
      ? {
          JWT_SECRET:
            process.env['JWT_SECRET'] ||
            'test-jwt-secret-at-least-32-characters-long',
          JWT_REFRESH_SECRET:
            process.env['JWT_REFRESH_SECRET'] ||
            'test-jwt-refresh-secret-at-least-32-characters-long',
          SMTP_FROM:
            process.env['SMTP_FROM'] || 'noreply@test.plpg.dev',
          FRONTEND_URL:
            process.env['FRONTEND_URL'] || 'http://localhost:5173',
        }
      : {};

  const result = envSchema.safeParse({
    ...process.env,
    ...testDefaults,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Validated environment variables.
 *
 * @constant env
 * @description Use this object to access environment variables throughout the application.
 *
 * @example
 * import { env } from './lib/env';
 *
 * const port = env.PORT;
 * const secret = env.JWT_SECRET;
 */
export const env = parseEnv();

/**
 * Gets the bcrypt cost factor from environment.
 *
 * @function getBcryptRounds
 * @returns {number} Number of bcrypt rounds (default: 12)
 */
export function getBcryptRounds(): number {
  return parseInt(env.BCRYPT_ROUNDS, 10);
}

/**
 * Gets the trial duration in days from environment.
 *
 * @function getTrialDurationDays
 * @returns {number} Trial duration in days (default: 14)
 */
export function getTrialDurationDays(): number {
  return parseInt(env.TRIAL_DURATION_DAYS, 10);
}
