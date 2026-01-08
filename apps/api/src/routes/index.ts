/**
 * @fileoverview Main router configuration.
 * Combines all route modules into a single router.
 *
 * @module @plpg/api/routes
 */

import { Router } from 'express';
import { healthRoutes } from './health.routes';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Future route modules will be added here:
// router.use('/auth', authRoutes);
// router.use('/onboarding', onboardingRoutes);
// router.use('/roadmap', roadmapRoutes);
// router.use('/progress', progressRoutes);

export const routes = router;
