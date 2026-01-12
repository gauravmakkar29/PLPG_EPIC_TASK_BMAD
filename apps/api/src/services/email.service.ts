/**
 * @fileoverview Email service for PLPG API.
 * Handles sending transactional emails via SMTP (Nodemailer + MailHog in dev).
 *
 * @module @plpg/api/services/email
 * @description Email service following Single Responsibility Principle.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../lib/env';
import { logger } from '../lib/logger';

/**
 * Email options for sending emails.
 */
export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email service result.
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email service interface for dependency injection.
 * Follows Interface Segregation Principle (ISP).
 */
export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailResult>;
}

/**
 * Creates the nodemailer transporter based on environment configuration.
 *
 * @returns Nodemailer transporter instance
 */
function createTransporter(): Transporter {
  const transportConfig = {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    secure: false, // MailHog doesn't use TLS
    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {}),
  };

  return nodemailer.createTransport(transportConfig);
}

/**
 * Singleton transporter instance.
 * Lazy initialized to avoid connection issues during import.
 */
let transporter: Transporter | null = null;

/**
 * Gets or creates the transporter instance.
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

/**
 * Sends an email using the configured SMTP server.
 *
 * @param options - Email options including recipient, subject, and content
 * @returns Promise resolving to email result
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const transport = getTransporter();

    const mailOptions = {
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transport.sendMail(mailOptions);

    logger.info(
      { messageId: info.messageId, to: options.to },
      'Email sent successfully'
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      { error: errorMessage, to: options.to },
      'Failed to send email'
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends a password reset email with the reset link.
 *
 * @param email - Recipient email address
 * @param resetUrl - Full URL for password reset
 * @returns Promise resolving to email result
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<EmailResult> {
  const subject = 'Reset Your PLPG Password';

  const text = `
You have requested to reset your password for your PLPG account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email.
Your password will remain unchanged.

Best regards,
The PLPG Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p>You have requested to reset your password for your PLPG account.</p>

    <p>Click the button below to reset your password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
    </div>

    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #4F46E5; word-break: break-all; font-size: 14px;">${resetUrl}</p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #999; font-size: 12px;">
      <strong>This link will expire in 1 hour.</strong><br>
      If you did not request a password reset, please ignore this email.
      Your password will remain unchanged.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} PLPG - Personalized Learning Path Generator</p>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

/**
 * Email service implementation for dependency injection.
 * Implements IEmailService interface.
 */
export const emailService: IEmailService = {
  sendEmail,
  sendPasswordResetEmail,
};

/**
 * Closes the transporter connection.
 * Useful for graceful shutdown and testing.
 */
export function closeEmailTransporter(): void {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}
