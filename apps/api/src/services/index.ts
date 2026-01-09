/**
 * @fileoverview Barrel export for service modules.
 *
 * @module @plpg/api/services
 * @description Business logic service layer exports.
 */

export {
  registerUser,
  hashPassword,
  comparePassword,
  calculateTrialEndDate,
  toAuthUser,
  trackAuthEvent,
  getCurrentSession,
  getSubscriptionStatus,
  getTrialEndsAt,
  getUserById,
  AUTH_EVENTS,
  BCRYPT_COST_FACTOR,
  type RegisterResult,
  type SessionResponse,
} from './auth.service';
