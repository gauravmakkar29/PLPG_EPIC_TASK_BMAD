/**
 * @fileoverview Health check controller.
 * Provides endpoints for service health monitoring.
 *
 * @module @plpg/api/controllers/health
 */

import type { Request, Response } from 'express';
import { logger } from '../lib/logger';

/**
 * Health check response structure.
 */
interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database?: 'connected' | 'disconnected' | 'not_configured';
  version?: string;
}

/**
 * Basic health check endpoint.
 * Returns service status and timestamp.
 *
 * @route GET /api/v1/health
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['npm_package_version'] || '0.1.0',
  };

  res.status(200).json(response);
}

/**
 * Detailed health check with database connectivity.
 * Useful for load balancer health probes.
 *
 * @route GET /api/v1/health/detailed
 */
export async function detailedHealthCheck(
  _req: Request,
  res: Response
): Promise<void> {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['npm_package_version'] || '0.1.0',
    database: 'not_configured',
  };

  try {
    // Dynamically import prisma to avoid startup issues
    const { getPrisma } = await import('../lib/prisma');
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    response.database = 'connected';
  } catch (error) {
    logger.warn({ error }, 'Database health check failed');
    response.status = 'unhealthy';
    response.database = 'disconnected';
  }

  const statusCode = response.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
}
