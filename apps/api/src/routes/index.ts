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
import { onboardingRoutes } from './onboarding.routes';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// User profile routes
router.use('/users', userRoutes);

// Onboarding routes - AIRE-234
router.use('/onboarding', onboardingRoutes);

// Future route modules will be added here:
// router.use('/roadmap', roadmapRoutes);
// router.use('/progress', progressRoutes);

export const routes = router;
