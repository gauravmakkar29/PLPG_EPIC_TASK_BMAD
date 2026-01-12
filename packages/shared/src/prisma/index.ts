/**
 * @fileoverview Prisma client export for PLPG.
 * Provides a lazy-loaded singleton Prisma client instance for database access.
 *
 * @module @plpg/shared/prisma
 * @description Centralized Prisma client for consistent database access.
 *
 * @example
 * import { getPrisma } from '@plpg/shared/prisma';
 *
 * const prisma = getPrisma();
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

let prismaInstance: PrismaClient | undefined;

/**
 * Creates a new Prisma client instance with logging configuration.
 *
 * @function createPrismaClient
 * @returns {PrismaClient} Configured Prisma client instance
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  return client;
}

/**
 * Get the Prisma client instance.
 * Creates a new instance if one doesn't exist (lazy initialization).
 *
 * @function getPrisma
 * @returns {PrismaClient} The Prisma client instance
 */
export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = globalThis.__prisma ?? createPrismaClient();

    // Store client in global variable for development
    if (process.env['NODE_ENV'] !== 'production') {
      globalThis.__prisma = prismaInstance;
    }
  }

  return prismaInstance;
}

/**
 * Singleton Prisma client instance.
 * Uses getter to lazily initialize the client.
 *
 * @constant prisma
 * @description Use this for all database operations.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Gracefully disconnect Prisma client.
 * Call this during application shutdown.
 *
 * @function disconnectPrisma
 * @returns {Promise<void>}
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = undefined;
  }
}

/**
 * Connect to the database explicitly.
 * Useful for verifying database connectivity.
 *
 * @function connectPrisma
 * @returns {Promise<void>}
 */
export async function connectPrisma(): Promise<void> {
  const client = getPrisma();
  await client.$connect();
}

// Re-export Prisma types for convenience
export { PrismaClient } from '@prisma/client';
export type { Prisma } from '@prisma/client';
