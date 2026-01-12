/**
 * @fileoverview Unit tests for email service.
 * Tests email sending functionality, SMTP configuration, and error handling.
 *
 * @module @plpg/api/services/email.service.test
 * @description Comprehensive test suite for the email service module.
 *
 * Test Coverage:
 * - Transporter configuration with SMTP settings
 * - sendEmail function success and error scenarios
 * - sendPasswordResetEmail template generation
 * - Environment variable usage
 * - Error handling and logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Transporter } from 'nodemailer';

/**
 * Use vi.hoisted to define mocks before vi.mock (which is hoisted).
 * This ensures mock variables are available when vi.mock factories execute.
 */
const mockSendMail = vi.hoisted(() => vi.fn());
const mockClose = vi.hoisted(() => vi.fn());

const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'test',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_FROM: 'noreply@test.plpg.dev',
  FRONTEND_URL: 'http://localhost:5173',
}));

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

/**
 * Mock nodemailer module.
 * Creates a mock transporter that captures sendMail calls.
 */
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
      close: mockClose,
    })),
  },
}));

/**
 * Mock environment configuration.
 * Provides test-specific SMTP settings.
 */
vi.mock('../lib/env', () => ({
  env: mockEnv,
}));

/**
 * Mock logger to capture log calls without output.
 */
vi.mock('../lib/logger', () => ({
  logger: mockLogger,
}));

// Import after mocks are set up
import nodemailer from 'nodemailer';
import {
  sendEmail,
  sendPasswordResetEmail,
  closeEmailTransporter,
  emailService,
  type EmailOptions,
  type EmailResult,
  type IEmailService,
} from './email.service';

describe('email.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the transporter singleton by closing it
    closeEmailTransporter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Transporter Configuration Tests
  // ===========================================================================
  describe('Transporter Configuration', () => {
    /**
     * @test Verifies that nodemailer.createTransport is called with correct SMTP host.
     * @requirement Test transporter is configured with correct SMTP settings
     */
    it('should configure transporter with correct SMTP host from environment', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
        })
      );
    });

    /**
     * @test Verifies that nodemailer.createTransport is called with correct SMTP port.
     * @requirement Test transporter is configured with correct SMTP settings
     */
    it('should configure transporter with correct SMTP port from environment', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 1025,
        })
      );
    });

    /**
     * @test Verifies that transporter is configured without TLS for MailHog compatibility.
     * @requirement Test transporter is configured with correct SMTP settings
     */
    it('should configure transporter with secure: false for MailHog', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: false,
        })
      );
    });

    /**
     * @test Verifies singleton pattern - transporter is created only once.
     * @requirement Performance optimization through connection reuse
     */
    it('should reuse transporter instance (singleton pattern)', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-123' });

      await sendEmail({ to: 'user1@example.com', subject: 'Test 1', text: 'Message 1' });
      await sendEmail({ to: 'user2@example.com', subject: 'Test 2', text: 'Message 2' });

      // Transporter should only be created once
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    });

    /**
     * @test Verifies that closeEmailTransporter properly closes the connection.
     * @requirement Graceful shutdown support
     */
    it('should close transporter connection when closeEmailTransporter is called', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      // Initialize the transporter by sending an email
      await sendEmail({ to: 'user@example.com', subject: 'Test', text: 'Test' });

      // Close the transporter
      closeEmailTransporter();

      expect(mockClose).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // sendEmail Function Tests
  // ===========================================================================
  describe('sendEmail', () => {
    /**
     * @test Verifies successful email sending returns success result.
     * @requirement Test sendEmail function sends email successfully
     */
    it('should send email successfully and return success result', async () => {
      const mockMessageId = 'test-message-id-12345';
      mockSendMail.mockResolvedValueOnce({ messageId: mockMessageId });

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test body text',
      };

      const result = await sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(mockMessageId);
      expect(result.error).toBeUndefined();
    });

    /**
     * @test Verifies that sendMail is called with correct recipient address.
     * @requirement Test email includes correct subject and body
     */
    it('should call sendMail with correct recipient address', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
        })
      );
    });

    /**
     * @test Verifies that sendMail is called with correct subject.
     * @requirement Test email includes correct subject and body
     */
    it('should call sendMail with correct subject', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Important Notification',
        text: 'Test message',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Important Notification',
        })
      );
    });

    /**
     * @test Verifies that sendMail is called with correct text body.
     * @requirement Test email includes correct subject and body
     */
    it('should call sendMail with correct text body', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      const bodyText = 'This is the email body content.';

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: bodyText,
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: bodyText,
        })
      );
    });

    /**
     * @test Verifies that sendMail includes HTML content when provided.
     * @requirement Support for HTML email templates
     */
    it('should include HTML content when provided', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      const htmlContent = '<h1>Welcome</h1><p>This is HTML content.</p>';

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Plain text version',
        html: htmlContent,
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: htmlContent,
        })
      );
    });

    /**
     * @test Verifies that email is sent from the configured SMTP_FROM address.
     * @requirement Test email includes correct from address
     */
    it('should send email from correct SMTP_FROM address', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@test.plpg.dev',
        })
      );
    });

    /**
     * @test Verifies successful send logs info message.
     * @requirement Logging for email operations
     */
    it('should log info message on successful email send', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'test-123',
          to: 'recipient@example.com',
        }),
        'Email sent successfully'
      );
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================
  describe('Error Handling', () => {
    /**
     * @test Verifies that sendEmail handles SMTP errors gracefully.
     * @requirement Test sendEmail handles errors gracefully
     */
    it('should handle SMTP connection errors gracefully', async () => {
      const errorMessage = 'Connection refused';
      mockSendMail.mockRejectedValueOnce(new Error(errorMessage));

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.messageId).toBeUndefined();
    });

    /**
     * @test Verifies that sendEmail handles authentication errors gracefully.
     * @requirement Test sendEmail handles errors gracefully
     */
    it('should handle authentication errors gracefully', async () => {
      const errorMessage = 'Invalid credentials';
      mockSendMail.mockRejectedValueOnce(new Error(errorMessage));

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    /**
     * @test Verifies that sendEmail handles timeout errors gracefully.
     * @requirement Test sendEmail handles errors gracefully
     */
    it('should handle timeout errors gracefully', async () => {
      const errorMessage = 'Connection timed out';
      mockSendMail.mockRejectedValueOnce(new Error(errorMessage));

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    /**
     * @test Verifies that unknown errors are handled with default message.
     * @requirement Test sendEmail handles errors gracefully
     */
    it('should handle unknown error types gracefully', async () => {
      mockSendMail.mockRejectedValueOnce('Non-Error thrown');

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    /**
     * @test Verifies that errors are logged with appropriate details.
     * @requirement Error handling logs failed sends
     */
    it('should log error message on failed email send', async () => {
      const errorMessage = 'SMTP server unavailable';
      mockSendMail.mockRejectedValueOnce(new Error(errorMessage));

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: errorMessage,
          to: 'recipient@example.com',
        }),
        'Failed to send email'
      );
    });
  });

  // ===========================================================================
  // sendPasswordResetEmail Tests
  // ===========================================================================
  describe('sendPasswordResetEmail', () => {
    /**
     * @test Verifies password reset email is sent to correct recipient.
     * @requirement Email templates for password reset
     */
    it('should send password reset email to correct recipient', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });

      await sendPasswordResetEmail('user@example.com', 'http://localhost/reset/token123');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
        })
      );
    });

    /**
     * @test Verifies password reset email has correct subject.
     * @requirement Email templates for password reset
     */
    it('should send password reset email with correct subject', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });

      await sendPasswordResetEmail('user@example.com', 'http://localhost/reset/token123');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Reset Your PLPG Password',
        })
      );
    });

    /**
     * @test Verifies password reset email includes reset URL in text body.
     * @requirement Email templates for password reset
     */
    it('should include reset URL in text body', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });
      const resetUrl = 'http://localhost:5173/reset-password/abc123token';

      await sendPasswordResetEmail('user@example.com', resetUrl);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(resetUrl),
        })
      );
    });

    /**
     * @test Verifies password reset email includes reset URL in HTML body.
     * @requirement Email templates for password reset
     */
    it('should include reset URL in HTML body', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });
      const resetUrl = 'http://localhost:5173/reset-password/abc123token';

      await sendPasswordResetEmail('user@example.com', resetUrl);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(resetUrl),
        })
      );
    });

    /**
     * @test Verifies password reset email includes expiry warning.
     * @requirement Email templates for password reset
     */
    it('should include token expiry warning in email', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });

      await sendPasswordResetEmail('user@example.com', 'http://localhost/reset/token');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('expire'),
        })
      );
    });

    /**
     * @test Verifies password reset email includes HTML template with styling.
     * @requirement Email templates for password reset
     */
    it('should include styled HTML template', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });

      await sendPasswordResetEmail('user@example.com', 'http://localhost/reset/token');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('<!DOCTYPE html>'),
        })
      );
    });

    /**
     * @test Verifies password reset email includes reset button in HTML.
     * @requirement Email templates for password reset
     */
    it('should include reset button in HTML template', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });

      await sendPasswordResetEmail('user@example.com', 'http://localhost/reset/token');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Reset Password'),
        })
      );
    });

    /**
     * @test Verifies password reset email returns success result.
     * @requirement sendEmail function available for password reset
     */
    it('should return success result on successful send', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'reset-123' });

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'http://localhost/reset/token'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('reset-123');
    });

    /**
     * @test Verifies password reset email handles errors gracefully.
     * @requirement Error handling for failed sends
     */
    it('should handle errors gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await sendPasswordResetEmail(
        'user@example.com',
        'http://localhost/reset/token'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP error');
    });
  });

  // ===========================================================================
  // Email Service Interface Tests
  // ===========================================================================
  describe('emailService Interface', () => {
    /**
     * @test Verifies emailService implements IEmailService interface correctly.
     * @requirement Interface compliance for dependency injection
     */
    it('should implement IEmailService interface', () => {
      expect(emailService).toBeDefined();
      expect(typeof emailService.sendEmail).toBe('function');
      expect(typeof emailService.sendPasswordResetEmail).toBe('function');
    });

    /**
     * @test Verifies emailService.sendEmail works correctly.
     * @requirement sendEmail function available for password reset
     */
    it('should send email via emailService.sendEmail', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'interface-123' });

      const result = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Test message',
      });

      expect(result.success).toBe(true);
    });

    /**
     * @test Verifies emailService.sendPasswordResetEmail works correctly.
     * @requirement sendEmail function available for password reset
     */
    it('should send password reset email via emailService.sendPasswordResetEmail', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'interface-reset-123' });

      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        'http://localhost/reset/token'
      );

      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // Environment Variables Usage Tests
  // ===========================================================================
  describe('Environment Variables', () => {
    /**
     * @test Verifies SMTP_HOST environment variable is used.
     * @requirement Test environment variables are used for config
     */
    it('should use SMTP_HOST from environment', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({ to: 'test@example.com', subject: 'Test', text: 'Test' });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockEnv.SMTP_HOST,
        })
      );
    });

    /**
     * @test Verifies SMTP_PORT environment variable is used.
     * @requirement Test environment variables are used for config
     */
    it('should use SMTP_PORT from environment', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({ to: 'test@example.com', subject: 'Test', text: 'Test' });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: parseInt(mockEnv.SMTP_PORT, 10),
        })
      );
    });

    /**
     * @test Verifies SMTP_FROM environment variable is used.
     * @requirement Test environment variables are used for config
     */
    it('should use SMTP_FROM from environment', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-123' });

      await sendEmail({ to: 'test@example.com', subject: 'Test', text: 'Test' });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockEnv.SMTP_FROM,
        })
      );
    });
  });
});
