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

export {
  sendEmail,
  sendPasswordResetEmail,
  emailService,
  closeEmailTransporter,
  type EmailOptions,
  type EmailResult,
  type IEmailService,
} from './email.service';

export {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  cleanupExpiredTokens,
  passwordResetService,
  type ForgotPasswordResult,
  type ResetPasswordResult,
  type IPasswordResetService,
} from './passwordReset.service';
