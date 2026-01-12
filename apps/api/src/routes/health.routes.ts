/**
 * @fileoverview Health check routes.
 * Defines routes for service health monitoring.
 *
 * @module @plpg/api/routes/health
 */

import { Router } from 'express';
import { healthCheck, detailedHealthCheck } from '../controllers/health.controller';

const router = Router();

/**
 * @route GET /api/v1/health
 * @description Basic health check endpoint
 * @returns {HealthResponse} Service health status
 */
router.get('/', healthCheck);

/**
 * @route GET /api/v1/health/detailed
 * @description Detailed health check with database connectivity
 * @returns {HealthResponse} Detailed service health status including DB
 */
router.get('/detailed', detailedHealthCheck);

export const healthRoutes = router;
