/**
 * @fileoverview Subscription entity type definitions for PLPG.
 * Defines subscription plans and billing models.
 *
 * @module @plpg/shared/types/subscription
 * @description Subscription domain types for billing management.
 */

/**
 * Subscription plan enumeration.
 * Defines available subscription tiers.
 *
 * @constant SubscriptionPlan
 * @description Available subscription plans.
 *
 * - free: Basic access with limitations
 * - pro: Full access to all features
 */
export type SubscriptionPlan = 'free' | 'pro';

/**
 * Subscription status enumeration.
 * Represents the current state of a subscription.
 *
 * @constant SubscriptionStatus
 * @description Lifecycle states for subscriptions.
 *
 * - active: Subscription is currently valid
 * - expired: Subscription has ended
 * - cancelled: User cancelled subscription
 */
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

/**
 * Subscription entity.
 *
 * @interface Subscription
 * @description User subscription information.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} userId - Reference to user
 * @property {SubscriptionPlan} plan - Current subscription plan
 * @property {SubscriptionStatus} status - Current subscription status
 * @property {Date | null} expiresAt - When subscription expires
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 */
export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription with user relationship.
 *
 * @interface SubscriptionWithUser
 * @description Subscription including user data.
 */
export interface SubscriptionWithUser extends Subscription {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Plan features definition.
 *
 * @interface PlanFeatures
 * @description Features available in a subscription plan.
 */
export interface PlanFeatures {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  priceInterval: 'month' | 'year';
  features: string[];
  limitations: PlanLimitations;
}

/**
 * Plan limitations.
 *
 * @interface PlanLimitations
 * @description Constraints for a subscription plan.
 */
export interface PlanLimitations {
  maxRoadmaps: number;
  canSkipModules: boolean;
  canRecalculate: boolean;
  hasDetailedAnalytics: boolean;
  hasPrioritySupport: boolean;
}

/**
 * Subscription response for API.
 *
 * @interface SubscriptionResponse
 * @description Subscription data for client display.
 */
export interface SubscriptionResponse {
  subscription: Subscription;
  features: PlanFeatures;
  isTrialActive: boolean;
  trialDaysRemaining: number | null;
}

/**
 * Upgrade subscription input.
 *
 * @interface UpgradeSubscriptionInput
 * @description Data for upgrading subscription (mock).
 */
export interface UpgradeSubscriptionInput {
  plan: SubscriptionPlan;
  paymentMethodId?: string;
}

/**
 * Cancel subscription input.
 *
 * @interface CancelSubscriptionInput
 * @description Data for cancelling subscription.
 */
export interface CancelSubscriptionInput {
  reason?: string;
  feedback?: string;
}
