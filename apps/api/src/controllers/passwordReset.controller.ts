/**
 * @fileoverview Password reset controller for PLPG API.
 * Handles forgot password and reset password HTTP endpoints.
 *
 * @module @plpg/api/controllers/passwordReset
 * @description HTTP handlers for password reset endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ForgotPasswordInput, ResetPasswordInput } from '@plpg/shared/validation';
import {
  requestPasswordReset,
  resetPassword,
  validateResetToken,
} from '../services/passwordReset.service';
import { logger } from '../lib/logger';

/**
 * Request body type for forgot password endpoint.
 */
type ForgotPasswordRequest = Request<unknown, unknown, ForgotPasswordInput>;

/**
 * Request body type for reset password endpoint.
 */
type ResetPasswordRequest = Request<unknown, unknown, ResetPasswordInput>;

/**
 * Request params type for validate token endpoint.
 */
interface ValidateTokenParams {
  token: string;
}

/**
 * Forgot password endpoint handler.
 * Initiates password reset flow by sending email with reset link.
 *
 * @route POST /api/v1/auth/forgot-password
 * @param req - Express request with email in body
 * @param res - Express response
 * @param next - Express next function
 */
export async function forgotPassword(
  req: ForgotPasswordRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    logger.debug({ email }, 'Processing forgot password request');

    const result = await requestPasswordReset(email);

    // Always return 200 to prevent user enumeration
    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    logger.error({ error }, 'Error in forgot password controller');
    next(error);
  }
}

/**
 * Reset password endpoint handler.
 * Validates token and updates user's password.
 *
 * @route POST /api/v1/auth/reset-password
 * @param req - Express request with token and new password in body
 * @param res - Express response
 * @param next - Express next function
 */
export async function resetPasswordHandler(
  req: ResetPasswordRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body;

    logger.debug('Processing password reset request');

    const result = await resetPassword(token, password);

    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    logger.error({ error }, 'Error in reset password controller');
    next(error);
  }
}

/**
 * Validate reset token endpoint handler.
 * Checks if a reset token is valid without consuming it.
 *
 * @route GET /api/v1/auth/validate-reset-token/:token
 * @param req - Express request with token in params
 * @param res - Express response
 * @param next - Express next function
 */
export async function validateResetTokenHandler(
  req: Request<ValidateTokenParams>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;

    const isValid = await validateResetToken(token);

    res.status(200).json({
      valid: isValid,
    });
  } catch (error) {
    logger.error({ error }, 'Error in validate reset token controller');
    next(error);
  }
}
