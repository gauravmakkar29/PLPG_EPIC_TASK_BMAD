/**
 * @fileoverview Unit tests for the SignUp page component.
 * Tests form validation, submission, error handling, and navigation.
 *
 * @module @plpg/web/pages/SignUp.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SignUp } from './SignUp';
import { AuthProvider } from '../contexts/AuthContext';
import { server } from '../test/mocks/server';

/**
 * API base URL matching the api.ts configuration.
 */
const API_BASE = 'http://localhost:3000/api';

/**
 * Mock successful registration response.
 */
const mockSuccessResponse = {
  token: 'mock-jwt-token',
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'newuser@example.com',
    name: 'New User',
    onboardingComplete: false,
  },
};

/**
 * Mock response for user with completed onboarding.
 */
const mockOnboardingCompleteResponse = {
  token: 'mock-jwt-token',
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'existing@example.com',
    name: 'Existing User',
    onboardingComplete: true,
  },
};

/**
 * Creates a fresh QueryClient for each test.
 *
 * @returns {QueryClient} Configured QueryClient for testing
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Renders SignUp component with all providers and routes.
 *
 * @param {string[]} [initialEntries] - Initial router entries
 * @returns Render result
 */
function renderSignUp(initialEntries = ['/signup']) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/signin" element={<div>Sign In Page</div>} />
            <Route path="/onboarding" element={<div>Onboarding Page</div>} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SignUp Page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    server.resetHandlers();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      renderSignUp();

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render the create account button', () => {
      renderSignUp();

      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument();
    });

    it('should render the sign in link', () => {
      renderSignUp();

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/signin');
    });

    it('should render PLPG logo link', () => {
      renderSignUp();

      const logoLink = screen.getByRole('link', { name: /plpg/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should render password requirements text', () => {
      renderSignUp();

      expect(
        screen.getByText(/must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    it('should have accessible form', () => {
      renderSignUp();

      const form = screen.getByRole('form', { name: /sign up form/i });
      expect(form).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });

    it('should accept valid email format', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'valid@example.com');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.queryByText(/please enter a valid email address/i)
      ).not.toBeInTheDocument();
    });

    it('should show error for email without domain', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'user@');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });
  });

  describe('Password Validation', () => {
    it('should show error for empty password', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'valid@example.com');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('should show error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'Short1');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    it('should show error for password without uppercase letter', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'lowercase123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/password must contain at least 1 uppercase letter/i)
      ).toBeInTheDocument();
    });

    it('should show error for password without number', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'NoNumbers');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/password must contain at least 1 number/i)
      ).toBeInTheDocument();
    });

    it('should accept valid password', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.queryByText(/password must be at least 8 characters/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/password must contain at least 1 uppercase letter/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/password must contain at least 1 number/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Confirm Password Validation', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmPasswordInput, 'DifferentPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('should show error for empty confirm password', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.getByText(/please confirm your password/i)
      ).toBeInTheDocument();
    });

    it('should accept matching passwords', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmPasswordInput, 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(
        screen.queryByText(/passwords do not match/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      // Add delay to registration endpoint
      server.use(
        http.post(`${API_BASE}/auth/register`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockSuccessResponse, { status: 201 });
        })
      );

      renderSignUp();

      // Fill form with valid data
      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should call register API with form data', async () => {
      const user = userEvent.setup();
      let capturedRequest: Record<string, unknown> | null = null;

      server.use(
        http.post(`${API_BASE}/auth/register`, async ({ request }) => {
          capturedRequest = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockSuccessResponse, { status: 201 });
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email address/i), 'NewUser@Example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      expect(capturedRequest).toEqual({
        email: 'newuser@example.com', // Should be lowercase
        password: 'ValidPass123',
        name: 'New User',
      });
    });

    it('should redirect to onboarding after successful registration (new user)', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_BASE}/auth/register`, () => {
          return HttpResponse.json(mockSuccessResponse, { status: 201 });
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
      });
    });

    it('should redirect to dashboard after registration (onboarding complete)', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_BASE}/auth/register`, () => {
          return HttpResponse.json(mockOnboardingCompleteResponse, { status: 201 });
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), 'Existing User');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });

    it('should store auth token after successful registration', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_BASE}/auth/register`, () => {
          return HttpResponse.json(mockSuccessResponse, { status: 201 });
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('plpg_auth_token')).toBe('mock-jwt-token');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error for duplicate email', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_BASE}/auth/register`, () => {
          return HttpResponse.json(
            { message: 'Email already exists' },
            { status: 409 }
          );
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/an account with this email already exists/i)
        ).toBeInTheDocument();
      });
    });

    it('should display general error message for server errors', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_BASE}/auth/register`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      const user = userEvent.setup();
      renderSignUp();

      // Submit empty form to get errors
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();

      // Start typing in email field
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 't');

      // Error should be cleared
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const passwordInput = screen.getByLabelText(/^password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getAllByRole('button', { name: /show password/i })[0]!;
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle confirm password visibility independently', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
      const confirmToggle = toggleButtons[1]!;
      await user.click(confirmToggle);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Navigation', () => {
    it('should navigate to sign in page when clicking sign in link', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      await user.click(signInLink);

      await waitFor(() => {
        expect(screen.getByText('Sign In Page')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User Redirect', () => {
    it('should redirect authenticated users to dashboard', async () => {
      // Pre-populate localStorage with auth data
      localStorage.setItem('plpg_auth_token', 'existing-token');
      localStorage.setItem(
        'plpg_auth_user',
        JSON.stringify({
          id: '123',
          email: 'existing@example.com',
          name: 'Existing User',
        })
      );

      renderSignUp();

      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });
  });

  describe('Name Field (Optional)', () => {
    it('should allow submission without name', async () => {
      const user = userEvent.setup();
      let capturedRequest: Record<string, unknown> | null = null;

      server.use(
        http.post(`${API_BASE}/auth/register`, async ({ request }) => {
          capturedRequest = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              token: 'mock-jwt-token',
              user: {
                id: '123',
                email: 'noname@example.com',
                name: '',
                onboardingComplete: false,
              },
            },
            { status: 201 }
          );
        })
      );

      renderSignUp();

      // Don't fill name field
      await user.type(screen.getByLabelText(/email address/i), 'noname@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      // Name should be undefined when empty
      expect(capturedRequest?.['name']).toBeUndefined();
    });

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup();
      let capturedRequest: Record<string, unknown> | null = null;

      server.use(
        http.post(`${API_BASE}/auth/register`, async ({ request }) => {
          capturedRequest = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(mockSuccessResponse, { status: 201 });
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), '  Trimmed Name  ');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(capturedRequest?.['name']).toBe('Trimmed Name');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-invalid on email field when error', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-busy on submit button during loading', async () => {
      const user = userEvent.setup();

      server.use(
        http.post(`${API_BASE}/auth/register`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockSuccessResponse, { status: 201 });
        })
      );

      renderSignUp();

      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email address/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderSignUp();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      const emailError = screen.getByText(/email is required/i);
      expect(emailError).toHaveAttribute('role', 'alert');
    });
  });
});
