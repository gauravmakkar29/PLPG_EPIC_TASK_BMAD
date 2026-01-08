/**
 * @fileoverview Prisma client export for PLPG.
 * Provides a singleton Prisma client instance for database access.
 *
 * @module @plpg/shared/prisma
 * @description Centralized Prisma client for consistent database access.
 *
 * @example
 * import { prisma } from '@plpg/shared/prisma';
 *
 * const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma client instance declaration.
 * Prevents multiple instances in development with hot reloading.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Creates a new Prisma client instance with logging configuration.
 *
 * @function createPrismaClient
 * @returns {PrismaClient} Configured Prisma client instance
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  return client;
}

/**
 * Singleton Prisma client instance.
 * Uses global variable in development to prevent multiple instances
 * during hot module replacement.
 *
 * @constant prisma
 * @description Use this for all database operations.
 */
export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

// Store client in global variable for development
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

/**
 * Gracefully disconnect Prisma client.
 * Call this during application shutdown.
 *
 * @function disconnectPrisma
 * @returns {Promise<void>}
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Connect to the database explicitly.
 * Useful for verifying database connectivity.
 *
 * @function connectPrisma
 * @returns {Promise<void>}
 */
export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
}

// Re-export Prisma types for convenience
export { PrismaClient } from '@prisma/client';
export type { Prisma } from '@prisma/client';
