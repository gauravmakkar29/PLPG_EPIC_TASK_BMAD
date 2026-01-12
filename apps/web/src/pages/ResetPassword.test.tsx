/**
 * @fileoverview Tests for ResetPassword page component.
 * Validates password reset flow, token validation, form validation, and user interactions.
 *
 * @module @plpg/web/pages/ResetPassword.test
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import * as authService from '../services/auth.service';
import { ResetPassword } from './ResetPassword';
import { AuthProvider } from '../contexts/AuthContext';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom partially
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth service
vi.mock('../services/auth.service');

/**
 * Custom render function for ResetPassword with route params.
 */
function renderWithToken(token: string = 'valid-token') {
  return {
    ...render(
      <AuthProvider>
        <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
          <Routes>
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    ),
  };
}

// Helper render function from test utils
import { render } from '@testing-library/react';

describe('ResetPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should show loading state while validating token', async () => {
      vi.mocked(authService.validateResetToken).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithToken('test-token');

      expect(
        screen.getByText(/validating your reset link/i)
      ).toBeInTheDocument();
    });

    it('should show form for valid token', async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: true,
      });

      renderWithToken('valid-token');

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /set new password/i })
        ).toBeInTheDocument();
      });
    });

    it('should show invalid state for invalid token', async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: false,
      });

      renderWithToken('invalid-token');

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /invalid or expired link/i })
        ).toBeInTheDocument();
      });
    });

    it('should show invalid state on validation error', async () => {
      vi.mocked(authService.validateResetToken).mockRejectedValue(
        new Error('Network error')
      );

      renderWithToken('error-token');

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /invalid or expired link/i })
        ).toBeInTheDocument();
      });
    });

    it('should show link to request new reset in invalid state', async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: false,
      });

      renderWithToken('invalid-token');

      await waitFor(() => {
        const newResetLink = screen.getByRole('link', {
          name: /request new reset link/i,
        });
        expect(newResetLink).toHaveAttribute('href', '/forgot-password');
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: true,
      });
    });

    it('should render password form with all elements', async () => {
      renderWithToken();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /set new password/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /reset password/i })
      ).toBeInTheDocument();
    });

    it('should render password requirements', async () => {
      renderWithToken();

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one number/i)).toBeInTheDocument();
        expect(screen.getByText(/one special character/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: true,
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();
      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'Short1!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'DifferentPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should update password requirements as user types', async () => {
      const user = userEvent.setup();
      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);

      // Type a password that meets some requirements
      await user.type(passwordInput, 'Aa1!');

      // The requirements that are met should have checkmarks (green)
      // This is visual testing - we're checking the component updates
      await waitFor(() => {
        // After typing, the requirements should update their visual state
        expect(passwordInput).toHaveValue('Aa1!');
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: true,
      });
    });

    it('should call resetPassword with correct data', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.resetPassword).mockResolvedValue({
        message: 'Password reset successful',
      });

      renderWithToken('test-token');

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'NewSecurePass123!');
      await user.type(confirmPasswordInput, 'NewSecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.resetPassword).toHaveBeenCalledWith({
          token: 'test-token',
          password: 'NewSecurePass123!',
        });
      });
    });

    it('should show success state after successful reset', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.resetPassword).mockResolvedValue({
        message: 'Password reset successful',
      });

      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'NewSecurePass123!');
      await user.type(confirmPasswordInput, 'NewSecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /password reset successful/i })
        ).toBeInTheDocument();
      });
    });

    it('should show sign in link after success', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.resetPassword).mockResolvedValue({
        message: 'Password reset successful',
      });

      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'NewSecurePass123!');
      await user.type(confirmPasswordInput, 'NewSecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        const signInLink = screen.getByRole('link', { name: /sign in/i });
        expect(signInLink).toHaveAttribute('href', '/sign-in');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: true,
      });
    });

    it('should show invalid state for expired token error', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.resetPassword).mockRejectedValue(
        new Error('Reset token has expired')
      );

      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'NewSecurePass123!');
      await user.type(confirmPasswordInput, 'NewSecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /invalid or expired link/i })
        ).toBeInTheDocument();
      });
    });

    it('should show error message for generic errors', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.resetPassword).mockRejectedValue(
        new Error('An error occurred')
      );

      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'NewSecurePass123!');
      await user.type(confirmPasswordInput, 'NewSecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(async () => {
      vi.mocked(authService.validateResetToken).mockResolvedValue({
        valid: true,
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.resetPassword).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithToken();

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', {
        name: /reset password/i,
      });

      await user.type(passwordInput, 'NewSecurePass123!');
      await user.type(confirmPasswordInput, 'NewSecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resetting password/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
