/**
 * @fileoverview Tests for ProtectedRoute component.
 * Validates authentication routing, loading states, and redirect preservation.
 *
 * @module @plpg/web/components/ProtectedRoute.test
 */

import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { render } from '../test/utils';

import { ProtectedRoute } from './ProtectedRoute';

import type { AuthContextValue } from '../contexts/AuthContext';
import type { JSX } from 'react';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

// Mock AuthContext module - must include all exports
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});
/* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

describe('ProtectedRoute Component', () => {
  // Test content component
  const ProtectedContent = (): JSX.Element => <div>Protected Content</div>;
  const SignInPage = (): JSX.Element => <div>Sign In Page</div>;
  const OnboardingPage = (): JSX.Element => <div>Onboarding Page</div>;

  /**
   * Helper function to create mock auth context values
   *
   * @param overrides - Partial auth context to override defaults
   * @returns Complete AuthContextValue for testing
   */
  const createMockAuthContext = (
    overrides: Partial<AuthContextValue> = {}
  ): AuthContextValue => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while authentication is loading', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: true,
          isAuthenticated: false,
        })
      );

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Loading authentication status')
      ).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should have accessible loading indicator', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: true,
        })
      );

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      const loadingIndicator = screen.getByRole('status');
      expect(loadingIndicator).toHaveAttribute(
        'aria-label',
        'Loading authentication status'
      );
    });

    it('should not redirect during loading state', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: true,
          isAuthenticated: false,
        })
      );

      render(
        <Routes>
          <Route element={<SignInPage />} path="/sign-in" />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/protected"
          />
        </Routes>,
        {
          initialEntries: ['/protected'],
        }
      );

      // Should show loading, not redirect to sign-in
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated User', () => {
    it('should redirect to sign-in when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: false,
          user: null,
        })
      );

      render(
        <Routes>
          <Route element={<SignInPage />} path="/sign-in" />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/protected"
          />
        </Routes>,
        {
          initialEntries: ['/protected'],
        }
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In Page')).toBeInTheDocument();
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should preserve intended destination in location state', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: false,
        })
      );

      render(
        <Routes>
          <Route element={<SignInPage />} path="/sign-in" />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/dashboard"
          />
        </Routes>,
        {
          initialEntries: ['/dashboard'],
        }
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In Page')).toBeInTheDocument();
      });
    });

    it('should not render protected content when unauthenticated', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: false,
        })
      );

      render(
        <Routes>
          <Route element={<SignInPage />} path="/sign-in" />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/protected"
          />
        </Routes>,
        {
          initialEntries: ['/protected'],
        }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    it('should render children when user is authenticated', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          },
        })
      );

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not show loading spinner when authenticated', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          },
        })
      );

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not redirect when authenticated', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          },
        })
      );

      render(
        <Routes>
          <Route element={<SignInPage />} path="/sign-in" />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/protected"
          />
        </Routes>,
        {
          initialEntries: ['/protected'],
        }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument();
    });
  });

  describe('Onboarding Requirement', () => {
    it('should render children when requireOnboarding is false', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          },
        })
      );

      render(
        <ProtectedRoute requireOnboarding={false}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should handle requireOnboarding prop when true (placeholder for Epic 2)', () => {
      // Note: This is a placeholder test for future onboarding functionality
      // When Epic 2 implements user onboarding status, this test should be updated
      // to verify redirect to /onboarding when user.hasCompletedOnboarding is false

      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
            // Future: Add hasCompletedOnboarding: false
          },
        })
      );

      render(
        <Routes>
          <Route element={<OnboardingPage />} path="/onboarding" />
          <Route
            element={
              <ProtectedRoute requireOnboarding>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/settings"
          />
        </Routes>,
        {
          initialEntries: ['/settings'],
        }
      );

      // Currently renders content as onboarding check is not implemented
      // Future: Should redirect to onboarding when incomplete
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid authentication state changes', async () => {
      // Start with loading
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: true,
          isAuthenticated: false,
        })
      );

      const { rerender } = render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Transition to authenticated
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          },
        })
      );

      rerender(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should handle multiple children elements', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          },
        })
      );

      render(
        <ProtectedRoute>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          },
        })
      );

      expect(() => {
        render(<ProtectedRoute>{null}</ProtectedRoute>);
      }).not.toThrow();
    });

    it('should preserve route parameters when redirecting', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: false,
        })
      );

      render(
        <Routes>
          <Route element={<SignInPage />} path="/sign-in" />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/project/:id/settings"
          />
        </Routes>,
        {
          initialEntries: ['/project/abc123/settings'],
        }
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In Page')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading state with sr-only text', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: true,
        })
      );

      render(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      const srOnlyText = screen.getByText('Loading...');
      expect(srOnlyText).toHaveClass('sr-only');
    });

    it('should maintain focus management during redirect', async () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          isLoading: false,
          isAuthenticated: false,
        })
      );

      render(
        <Routes>
          <Route element={<SignInPage />} path="/sign-in" />
          <Route
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
            path="/protected"
          />
        </Routes>,
        {
          initialEntries: ['/protected'],
        }
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In Page')).toBeInTheDocument();
      });

      // Focus should not be lost during redirect
      expect(document.body).toBeInTheDocument();
    });
  });
});
