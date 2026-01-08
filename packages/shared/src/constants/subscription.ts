/**
 * @fileoverview Subscription constants for PLPG.
 * Defines subscription plan types and configurations.
 *
 * @module @plpg/shared/constants/subscription
 * @description Subscription plan constants and configurations.
 */

import type { SubscriptionPlan, PlanFeatures, PlanLimitations } from '../types/subscription';

/**
 * Available subscription plans.
 *
 * @constant SUBSCRIPTION_PLANS
 */
export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = ['free', 'pro'] as const;

/**
 * Plan limitations by tier.
 *
 * @constant PLAN_LIMITATIONS
 */
export const PLAN_LIMITATIONS: Record<SubscriptionPlan, PlanLimitations> = {
  free: {
    maxRoadmaps: 1,
    canSkipModules: false,
    canRecalculate: false,
    hasDetailedAnalytics: false,
    hasPrioritySupport: false,
  },
  pro: {
    maxRoadmaps: 5,
    canSkipModules: true,
    canRecalculate: true,
    hasDetailedAnalytics: true,
    hasPrioritySupport: true,
  },
} as const;

/**
 * Free plan features list.
 *
 * @constant FREE_PLAN_FEATURES
 */
export const FREE_PLAN_FEATURES: readonly string[] = [
  'Personalized learning roadmap',
  'Access to foundation modules',
  'Basic progress tracking',
  'Community resources',
] as const;

/**
 * Pro plan features list.
 *
 * @constant PRO_PLAN_FEATURES
 */
export const PRO_PLAN_FEATURES: readonly string[] = [
  'Everything in Free',
  'Unlimited roadmap regeneration',
  'Skip completed skills',
  'Detailed analytics dashboard',
  'Priority support',
  'Early access to new content',
] as const;

/**
 * Complete plan configurations.
 *
 * @constant PLAN_CONFIGS
 */
export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    plan: 'free',
    name: 'Free',
    description: 'Get started with personalized ML learning',
    price: 0,
    priceInterval: 'month',
    features: [...FREE_PLAN_FEATURES],
    limitations: PLAN_LIMITATIONS.free,
  },
  pro: {
    plan: 'pro',
    name: 'Pro',
    description: 'Accelerate your ML engineering journey',
    price: 19,
    priceInterval: 'month',
    features: [...PRO_PLAN_FEATURES],
    limitations: PLAN_LIMITATIONS.pro,
  },
} as const;

/**
 * Trial period duration in days.
 *
 * @constant TRIAL_DURATION_DAYS
 */
export const TRIAL_DURATION_DAYS = 14;

/**
 * Grace period after subscription expires (in days).
 *
 * @constant GRACE_PERIOD_DAYS
 */
export const GRACE_PERIOD_DAYS = 7;

/**
 * Get plan configuration by plan type.
 *
 * @function getPlanConfig
 * @param {SubscriptionPlan} plan - The subscription plan type
 * @returns {PlanFeatures} Plan configuration
 */
export function getPlanConfig(plan: SubscriptionPlan): PlanFeatures {
  return PLAN_CONFIGS[plan];
}

/**
 * Check if a feature is available for a plan.
 *
 * @function isPlanFeatureAvailable
 * @param {SubscriptionPlan} plan - The subscription plan
 * @param {keyof PlanLimitations} feature - The feature to check
 * @returns {boolean} Whether the feature is available
 */
export function isPlanFeatureAvailable(
  plan: SubscriptionPlan,
  feature: keyof PlanLimitations
): boolean {
  const limitation = PLAN_LIMITATIONS[plan][feature];
  if (typeof limitation === 'boolean') {
    return limitation;
  }
  return limitation > 0;
}
