/**
 * @fileoverview Tests for SignIn page component.
 * Validates authentication flow, form validation, error handling, and user interactions.
 *
 * @module @plpg/web/pages/SignIn.test
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as authService from '../services/auth.service';
import { render } from '../test/utils';

import { SignIn } from './SignIn';

import type { LoginResponse } from '../services/auth.service';

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

// Mock analytics
const mockAnalyticsTrack = vi.fn();
Object.defineProperty(window, 'analytics', {
  value: { track: mockAnalyticsTrack },
  writable: true,
});

describe('SignIn Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sign in form with all fields', () => {
      render(<SignIn />);

      expect(
        screen.getByRole('heading', { name: /sign in to your account/i })
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /remember me/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^sign in$/i })
      ).toBeInTheDocument();
    });

    it('should render link to create new account', () => {
      render(<SignIn />);

      const signUpLink = screen.getByRole('link', {
        name: /create a new account/i,
      });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/sign-up');
    });

    it('should render forgot password link', () => {
      render(<SignIn />);

      const forgotPasswordLink = screen.getByRole('link', {
        name: /forgot your password/i,
      });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<SignIn />);

      const submitButton = screen.getByRole('button', { name: /^sign in$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it.skip('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'not-an-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const user = userEvent.setup();
      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

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
    it('should call login function with correct credentials', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expiresIn: 900,
        redirectPath: '/dashboard',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResponse);

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.loginUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123!',
          rememberMe: false,
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should include remember me in login request when checked', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expiresIn: 604800,
        redirectPath: '/dashboard',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResponse);

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const rememberMeCheckbox = screen.getByRole('checkbox', {
        name: /remember me/i,
      });
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.loginUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123!',
          rememberMe: true,
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display generic error on invalid credentials', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.loginUser).mockRejectedValue(
        new Error(
          'Invalid email or password. Please check your credentials and try again.'
        )
      );

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /invalid email or password. please check your credentials and try again/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should clear general error when user makes changes', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.loginUser).mockRejectedValue(
        new Error('Invalid email or password')
      );

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      // Trigger error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });

      // Make a change
      await user.type(passwordInput, '!');

      await waitFor(() => {
        expect(
          screen.queryByText(/invalid email or password/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveLogin: (value: LoginResponse) => void;
      const loginPromise = new Promise<LoginResponse>((resolve) => {
        resolveLogin = resolve;
      });

      vi.mocked(authService.loginUser).mockReturnValue(loginPromise);

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveLogin!({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expiresIn: 900,
        redirectPath: '/dashboard',
      });
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expiresIn: 900,
        redirectPath: '/dashboard',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResponse);

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect to onboarding if incomplete', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expiresIn: 900,
        redirectPath: '/onboarding',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResponse);

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track login_completed event on successful login', async () => {
      const user = userEvent.setup();
      const mockLoginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expiresIn: 900,
        redirectPath: '/dashboard',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockLoginResponse);

      render(<SignIn />);

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const rememberMeCheckbox = screen.getByRole('checkbox', {
        name: /remember me/i,
      });
      const submitButton = screen.getByRole('button', { name: /^sign in$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('login_completed', {
          userId: '1',
          email: 'test@example.com',
          rememberMe: true,
          timestamp: expect.any(String) as string,
        });
      });
    });
  });

  describe('Remember Me Checkbox', () => {
    it('should update state when remember me is checked', async () => {
      const user = userEvent.setup();
      render(<SignIn />);

      const rememberMeCheckbox = screen.getByRole('checkbox', {
        name: /remember me/i,
      });

      expect(rememberMeCheckbox).not.toBeChecked();

      await user.click(rememberMeCheckbox);

      expect(rememberMeCheckbox).toBeChecked();
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      render(<SignIn />);

      const rememberMeCheckbox = screen.getByRole('checkbox', {
        name: /remember me/i,
      });

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });
  });

  describe('Link Navigation', () => {
    it('should have link to sign up page', () => {
      render(<SignIn />);

      const signUpLink = screen.getByRole('link', {
        name: /create a new account/i,
      });
      expect(signUpLink).toHaveAttribute('href', '/sign-up');
    });

    it('should have link to forgot password page', () => {
      render(<SignIn />);

      const forgotPasswordLink = screen.getByRole('link', {
        name: /forgot your password/i,
      });
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });
  });
});
