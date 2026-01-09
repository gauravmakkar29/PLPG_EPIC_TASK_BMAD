/**
 * @fileoverview API client configuration with Axios.
 * Provides a configured Axios instance with interceptors for
 * authentication token injection and error handling.
 *
 * @module @plpg/web/lib/api
 */

import axios, { AxiosError } from 'axios';

import type { InternalAxiosRequestConfig } from 'axios';

/**
 * Storage key for the access token.
 */
const ACCESS_TOKEN_KEY = 'plpg_access_token';

/**
 * Storage key for the refresh token.
 */
const REFRESH_TOKEN_KEY = 'plpg_refresh_token';

/**
 * Base API URL from environment variables.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Axios instance configured for PLPG API.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Get access token from local storage.
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Set access token in local storage.
 */
export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * Get refresh token from local storage.
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Set refresh token in local storage.
 */
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Clear all auth tokens from local storage.
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Request interceptor: Inject auth token into requests.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle 401 errors and token refresh.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const responseData = response.data as {
            accessToken: string;
            refreshToken: string;
          };
          const { accessToken } = responseData;
          setAccessToken(accessToken);
          setRefreshToken(responseData.refreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, clear tokens and redirect to login
          clearTokens();
          window.location.href = '/signin';
          return Promise.reject(error);
        }
      } else {
        // No refresh token, redirect to login
        clearTokens();
        window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Type-safe API error response.
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Extract error message from Axios error.
 */
export function getErrorMessage(error: unknown): string {
  // eslint-disable-next-line import/no-named-as-default-member
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    return apiError?.message ?? error.message ?? 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
