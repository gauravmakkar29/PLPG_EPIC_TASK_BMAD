/**
 * @fileoverview Prisma client re-export for PLPG API.
 * Imports the singleton Prisma client from @plpg/shared.
 *
 * @module @plpg/api/lib/prisma
 */

export {
  prisma,
  getPrisma,
  disconnectPrisma,
  connectPrisma,
  PrismaClient,
} from '@plpg/shared/prisma';
export type { Prisma } from '@plpg/shared/prisma';
