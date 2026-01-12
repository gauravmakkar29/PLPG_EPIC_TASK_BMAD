/**
 * @fileoverview Main router configuration.
 * Combines all route modules into a single router.
 *
 * @module @plpg/api/routes
 */

import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// User profile routes
router.use('/users', userRoutes);

// Future route modules will be added here:
// router.use('/onboarding', onboardingRoutes);
// router.use('/roadmap', roadmapRoutes);
// router.use('/progress', progressRoutes);

// Future route modules will be added here:
// router.use('/onboarding', onboardingRoutes);
// router.use('/roadmap', roadmapRoutes);
// router.use('/progress', progressRoutes);

export const routes = router;
