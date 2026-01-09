/**
 * @fileoverview MSW request handlers for API mocking.
 * Defines mock responses for PLPG API endpoints.
 *
 * @module @plpg/web/test/mocks/handlers
 * @description Mock Service Worker handlers for testing.
 *
 * @example
 * // Override a handler in a specific test
 * import { server } from './server';
 * import { http, HttpResponse } from 'msw';
 *
 * server.use(
 *   http.get('/api/v1/auth/me', () => {
 *     return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   })
 * );
 */

import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3001/api/v1';

/**
 * Mock user data for testing.
 */
export const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  role: 'free' as const,
  isVerified: true,
  createdAt: new Date().toISOString(),
};

/**
 * Mock auth response data.
 */
export const mockAuthResponse = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

/**
 * Mock session data.
 */
export const mockSession = {
  user: mockUser,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  issuedAt: new Date().toISOString(),
};

/**
 * Default request handlers for MSW.
 * These handlers intercept API requests during tests.
 */
export const handlers = [
  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  }),

  // Auth: Register
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body['email'] || !body['password'] || !body['name']) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json(mockAuthResponse, { status: 201 });
  }),

  // Auth: Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (body['email'] === 'invalid@example.com') {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
            status: 401,
          },
        },
        { status: 401 }
      );
    }

    return HttpResponse.json(mockAuthResponse);
  }),

  // Auth: Logout
  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Successfully logged out',
    });
  }),

  // Auth: Get current session
  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401,
          },
        },
        { status: 401 }
      );
    }

    return HttpResponse.json(mockSession);
  }),

  // Auth: Refresh token
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body['refreshToken']) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
    });
  }),

  // Auth: Forgot password
  http.post(`${API_BASE}/auth/forgot-password`, () => {
    return HttpResponse.json({
      success: true,
      message:
        'If an account exists with this email, a password reset link has been sent',
    });
  }),

  // Auth: Reset password
  http.post(`${API_BASE}/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body['token'] || !body['password']) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            status: 400,
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  }),
];
