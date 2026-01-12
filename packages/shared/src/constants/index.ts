/**
 * @fileoverview Constants barrel file for PLPG shared package.
 * Re-exports all constant definitions.
 *
 * @module @plpg/shared/constants
 * @description Central export point for all constants.
 */

// Phase constants
export {
  PHASE_NAMES,
  PHASE_DESCRIPTIONS,
  PHASE_ORDER,
  PHASE_COLORS,
  PHASE_ICONS,
  getPhaseMetadata,
  getPhaseById,
  type PhaseMetadata,
} from './phases';

// Subscription constants
export {
  SUBSCRIPTION_PLANS,
  PLAN_LIMITATIONS,
  FREE_PLAN_FEATURES,
  PRO_PLAN_FEATURES,
  PLAN_CONFIGS,
  TRIAL_DURATION_DAYS,
  GRACE_PERIOD_DAYS,
  getPlanConfig,
  isPlanFeatureAvailable,
} from './subscription';

// Role constants
export {
  CURRENT_ROLE_NAMES,
  CURRENT_ROLE_DESCRIPTIONS,
  TARGET_ROLE_NAMES,
  TARGET_ROLE_DESCRIPTIONS,
  CURRENT_ROLE_OPTIONS,
  TARGET_ROLE_OPTIONS,
} from './roles';

/**
 * API version constant.
 *
 * @constant API_VERSION
 */
export const API_VERSION = 'v1';

/**
 * Default pagination limit.
 *
 * @constant DEFAULT_PAGE_LIMIT
 */
export const DEFAULT_PAGE_LIMIT = 25;

/**
 * Maximum pagination limit.
 *
 * @constant MAX_PAGE_LIMIT
 */
export const MAX_PAGE_LIMIT = 100;

/**
 * JWT token expiry times.
 *
 * @constant TOKEN_EXPIRY
 */
export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
  VERIFY_EMAIL: '24h',
  RESET_PASSWORD: '1h',
} as const;

/**
 * Rate limiting configurations.
 *
 * @constant RATE_LIMITS
 */
export const RATE_LIMITS = {
  GENERAL: { windowMs: 60 * 1000, max: 100 },
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
  API: { windowMs: 60 * 1000, max: 60 },
} as const;

/**
 * Weekly hours options for onboarding.
 *
 * @constant WEEKLY_HOURS_OPTIONS
 */
export const WEEKLY_HOURS_OPTIONS: ReadonlyArray<{
  value: 5 | 10 | 15 | 20;
  label: string;
  description: string;
}> = [
  { value: 5, label: '5 hours/week', description: 'Casual pace - ~12 months' },
  { value: 10, label: '10 hours/week', description: 'Steady pace - ~6 months' },
  { value: 15, label: '15 hours/week', description: 'Focused pace - ~4 months' },
  { value: 20, label: '20 hours/week', description: 'Intensive pace - ~3 months' },
] as const;

/**
 * Module status display configuration.
 *
 * @constant MODULE_STATUS_CONFIG
 */
export const MODULE_STATUS_CONFIG = {
  locked: { label: 'Locked', color: 'gray', icon: 'Lock' },
  available: { label: 'Available', color: 'blue', icon: 'Unlock' },
  in_progress: { label: 'In Progress', color: 'yellow', icon: 'Play' },
  completed: { label: 'Completed', color: 'green', icon: 'Check' },
  skipped: { label: 'Skipped', color: 'slate', icon: 'SkipForward' },
} as const;

/**
 * Resource type display configuration.
 *
 * @constant RESOURCE_TYPE_CONFIG
 */
export const RESOURCE_TYPE_CONFIG = {
  video: { label: 'Video', icon: 'Video', color: 'red' },
  documentation: { label: 'Documentation', icon: 'FileText', color: 'blue' },
  tutorial: { label: 'Tutorial', icon: 'BookOpen', color: 'green' },
  mini_project: { label: 'Mini Project', icon: 'Code', color: 'purple' },
} as const;
