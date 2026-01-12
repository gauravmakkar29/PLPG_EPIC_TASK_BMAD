/**
 * @fileoverview Password reset service for PLPG API.
 * Handles forgot password and password reset functionality.
 *
 * @module @plpg/api/services/passwordReset
 * @description Password reset business logic following SOLID principles.
 *
 * SOLID Principles Applied:
 * - SRP: This service only handles password reset logic
 * - OCP: Open for extension via dependency injection
 * - DIP: Depends on abstractions (IEmailService interface)
 */

import crypto from 'crypto';
import { prisma, getPrisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { env } from '../lib/env';
import { hashPassword } from './auth.service';
import { sendPasswordResetEmail, type IEmailService } from './email.service';
import { ValidationError, NotFoundError } from '@plpg/shared';

/**
 * Token expiry duration in milliseconds (1 hour).
 */
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Result of forgot password request.
 */
export interface ForgotPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Result of reset password request.
 */
export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Password reset service interface for dependency injection.
 * Follows Interface Segregation Principle (ISP).
 */
export interface IPasswordResetService {
  requestPasswordReset(email: string): Promise<ForgotPasswordResult>;
  resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult>;
  validateResetToken(token: string): Promise<boolean>;
}

/**
 * Generates a cryptographically secure random token.
 *
 * @returns Random token string (32 bytes, hex encoded)
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a token using SHA-256 for secure storage.
 *
 * @param token - Raw token to hash
 * @returns Hashed token string
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Requests a password reset for the given email.
 * Sends a reset email if the user exists.
 *
 * Security: Always returns success message to prevent user enumeration.
 *
 * @param email - User's email address
 * @param emailService - Optional email service for dependency injection (testing)
 * @returns Promise resolving to forgot password result
 */
export async function requestPasswordReset(
  email: string,
  emailService?: IEmailService
): Promise<ForgotPasswordResult> {
  const db = getPrisma();
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success message to prevent user enumeration
    const successMessage =
      'If an account exists with this email, you will receive a password reset link shortly.';

    if (!user) {
      logger.debug({ email: normalizedEmail }, 'Password reset requested for non-existent email');
      return { success: true, message: successMessage };
    }

    // Delete any existing reset tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new reset token
    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // Store hashed token in database
    await db.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        email: normalizedEmail,
        expiresAt,
      },
    });

    // Build reset URL
    const resetUrl = `${env.FRONTEND_URL}/reset-password/${rawToken}`;

    // Send reset email
    const sendEmailFn = emailService?.sendPasswordResetEmail ?? sendPasswordResetEmail;
    const emailResult = await sendEmailFn(normalizedEmail, resetUrl);

    if (!emailResult.success) {
      logger.error(
        { email: normalizedEmail, error: emailResult.error },
        'Failed to send password reset email'
      );
      // Still return success to prevent information leakage
    } else {
      logger.info(
        { userId: user.id, email: normalizedEmail },
        'Password reset email sent'
      );
    }

    return { success: true, message: successMessage };
  } catch (error) {
    logger.error({ error, email: normalizedEmail }, 'Error in password reset request');
    // Return success message even on error to prevent information leakage
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    };
  }
}

/**
 * Validates a password reset token without consuming it.
 *
 * @param token - Raw reset token from URL
 * @returns Promise resolving to true if token is valid, false otherwise
 */
export async function validateResetToken(token: string): Promise<boolean> {
  const db = getPrisma();
  const tokenHash = hashToken(token);

  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) {
      return false;
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return false;
    }

    // Check if token has already been used
    if (resetToken.usedAt) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error }, 'Error validating reset token');
    return false;
  }
}

/**
 * Resets the user's password using a valid reset token.
 *
 * @param token - Raw reset token from URL
 * @param newPassword - New password to set
 * @returns Promise resolving to reset password result
 * @throws ValidationError if token is invalid or expired
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const db = getPrisma();
  const tokenHash = hashToken(token);

  try {
    // Find and validate the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new ValidationError({ token: 'Invalid or expired reset token' }, 'Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      // Clean up expired token
      await db.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new ValidationError({ token: 'Token expired' }, 'Reset token has expired. Please request a new one.');
    }

    // Check if token has already been used
    if (resetToken.usedAt) {
      throw new ValidationError({ token: 'Token already used' }, 'This reset token has already been used');
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and mark token as used in a transaction
    await db.$transaction(async (tx) => {
      // Update user's password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all refresh tokens for security
      // (forces user to re-login on all devices)
      await tx.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    logger.info(
      { userId: resetToken.userId },
      'Password reset successfully'
    );

    return {
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error({ err: error }, 'Error resetting password');
    throw new ValidationError({ error: 'Reset failed' }, 'An error occurred while resetting your password. Please try again.');
  }
}

/**
 * Cleans up expired password reset tokens.
 * Should be called periodically (e.g., via cron job).
 *
 * @returns Promise resolving to number of deleted tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const db = getPrisma();

  try {
    const result = await db.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Cleaned up expired password reset tokens');
    }

    return result.count;
  } catch (error) {
    logger.error({ err: error }, 'Error cleaning up expired tokens');
    return 0;
  }
}

/**
 * Password reset service implementation for dependency injection.
 * Implements IPasswordResetService interface.
 */
export const passwordResetService: IPasswordResetService = {
  requestPasswordReset,
  resetPassword,
  validateResetToken,
};
