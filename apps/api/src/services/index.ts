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
  AUTH_EVENTS,
  BCRYPT_COST_FACTOR,
  type RegisterResult,
} from './auth.service';
