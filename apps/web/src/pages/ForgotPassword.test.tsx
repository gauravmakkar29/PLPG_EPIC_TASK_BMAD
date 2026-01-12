/**
 * @fileoverview Tests for ForgotPassword page component.
 * Validates password reset request flow, form validation, and user interactions.
 *
 * @module @plpg/web/pages/ForgotPassword.test
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as authService from '../services/auth.service';
import { render } from '../test/utils';

import { ForgotPassword } from './ForgotPassword';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth service
vi.mock('../services/auth.service');

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render forgot password form with all elements', () => {
      render(<ForgotPassword />);

      expect(
        screen.getByRole('heading', { name: /reset your password/i })
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /send reset link/i })
      ).toBeInTheDocument();
    });

    it('should render link to sign in page', () => {
      render(<ForgotPassword />);

      const signInLink = screen.getByRole('link', { name: /back to sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/sign-in');
    });

    it('should render description text', () => {
      render(<ForgotPassword />);

      expect(
        screen.getByText(/enter your email address and we'll send you a link/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<ForgotPassword />);

      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'not-an-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      // Trigger validation error
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing
      await user.type(emailInput, 't');

      await waitFor(() => {
        expect(
          screen.queryByText(/email is required/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call forgotPassword with correct email', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockResolvedValue({
        message: 'Reset email sent',
        emailSent: true,
      });

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.forgotPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });
    });

    it('should show success state after submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockResolvedValue({
        message: 'Reset email sent',
        emailSent: true,
      });

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
        expect(
          screen.getByText(/test@example.com/i)
        ).toBeInTheDocument();
      });
    });

    it('should show return to sign in link in success state', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockResolvedValue({
        message: 'Reset email sent',
        emailSent: true,
      });

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const signInLink = screen.getByRole('link', {
          name: /return to sign in/i,
        });
        expect(signInLink).toHaveAttribute('href', '/sign-in');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show rate limit error', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockRejectedValue(
        new Error('Too many password reset requests')
      );

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/too many password reset requests/i)
        ).toBeInTheDocument();
      });
    });

    it('should show success even on generic error (security)', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockRejectedValue(
        new Error('Network error')
      );

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Should still show success to prevent user enumeration
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveRequest: (value: { message: string; emailSent: boolean }) => void;
      const requestPromise = new Promise<{ message: string; emailSent: boolean }>(
        (resolve) => {
          resolveRequest = resolve;
        }
      );

      vi.mocked(authService.forgotPassword).mockReturnValue(requestPromise);

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/sending.../i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveRequest!({ message: 'Email sent', emailSent: true });
    });

    it('should disable button during loading', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Try Again Functionality', () => {
    it('should allow trying again from success state', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.forgotPassword).mockResolvedValue({
        message: 'Reset email sent',
        emailSent: true,
      });

      render(<ForgotPassword />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', {
        name: /send reset link/i,
      });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Wait for success state
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /check your email/i })
        ).toBeInTheDocument();
      });

      // Click try again
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // Should go back to form state
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /reset your password/i })
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email address/i)).toHaveValue('');
      });
    });
  });
});
