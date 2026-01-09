/**
 * @fileoverview Pino logger configuration for PLPG API.
 * Provides structured JSON logging with configurable log levels.
 *
 * @module @plpg/api/lib/logger
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Pino logger instance configured for the PLPG API.
 *
 * @example
 * logger.info({ userId: '123' }, 'User logged in');
 * logger.error({ error }, 'Failed to process request');
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password'],
    censor: '[REDACTED]',
  },
});
