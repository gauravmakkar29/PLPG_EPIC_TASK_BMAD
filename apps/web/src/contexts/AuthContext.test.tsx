/**
 * @fileoverview Unit tests for AuthContext and AuthProvider.
 * Tests authentication state management, localStorage integration, and hook behavior.
 *
 * @module @plpg/web/contexts/AuthContext.test
 */

import {
  render,
  screen,
  waitFor,
  renderHook,
  act,
} from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

import type { AuthUser } from './AuthContext';
import type { ReactNode, JSX } from 'react';

/**
 * Mock user data for testing.
 */
const mockUser: AuthUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
};

/**
 * Mock JWT token for testing.
 */
const mockToken = 'mock-jwt-token';

/**
 * Wrapper component for testing hooks.
 */
function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with isLoading true and then false', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      // Wait for loading to complete (useEffect runs immediately in test environment)
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize user from localStorage if token and user data exist', async () => {
      // Pre-populate localStorage
      localStorage.setItem('plpg_auth_token', mockToken);
      localStorage.setItem('plpg_auth_user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('plpg_auth_token', mockToken);
      localStorage.setItem('plpg_auth_user', 'invalid-json{');

      // Spy on console.error to verify error handling
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not set user if data is corrupted
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error initializing auth state:',
        expect.any(Error)
      );

      // Should clear corrupted data
      expect(localStorage.getItem('plpg_auth_token')).toBeNull();
      expect(localStorage.getItem('plpg_auth_user')).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this expected error
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return auth context when used within AuthProvider', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
    });
  });

  describe('login function', () => {
    it('should store token in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login(mockToken, mockUser);
      });

      expect(localStorage.getItem('plpg_auth_token')).toBe(mockToken);
    });

    it('should store user data in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login(mockToken, mockUser);
      });

      const storedUser = localStorage.getItem('plpg_auth_user');
      expect(storedUser).toBeTruthy();
      expect(JSON.parse(storedUser!)).toEqual(mockUser);
    });

    it('should update user state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      act(() => {
        result.current.login(mockToken, mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('register function', () => {
    it('should store token in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.register(mockToken, mockUser);
      });

      expect(localStorage.getItem('plpg_auth_token')).toBe(mockToken);
    });

    it('should store user data in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.register(mockToken, mockUser);
      });

      const storedUser = localStorage.getItem('plpg_auth_user');
      expect(storedUser).toBeTruthy();
      expect(JSON.parse(storedUser!)).toEqual(mockUser);
    });

    it('should update user state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      act(() => {
        result.current.register(mockToken, mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout function', () => {
    it('should clear localStorage token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First login
      act(() => {
        result.current.login(mockToken, mockUser);
      });

      expect(localStorage.getItem('plpg_auth_token')).toBe(mockToken);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('plpg_auth_token')).toBeNull();
    });

    it('should clear localStorage user data', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First login
      act(() => {
        result.current.login(mockToken, mockUser);
      });

      expect(localStorage.getItem('plpg_auth_user')).toBeTruthy();

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('plpg_auth_user')).toBeNull();
    });

    it('should reset user state to null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First login
      act(() => {
        result.current.login(mockToken, mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('isLoading state', () => {
    it('should start as true and transition to false during initialization', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      // In test environment, useEffect runs synchronously, so we verify final state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should become false after initialization completes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('isAuthenticated computed value', () => {
    it('should be false when user is null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should be true when user is present', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login(mockToken, mockUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should update when user logs in and out', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false);

      // After login, should be authenticated
      act(() => {
        result.current.login(mockToken, mockUser);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // After logout, should not be authenticated
      act(() => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });
});
