/**
 * @fileoverview Authentication service for API interactions.
 * Provides type-safe methods for all authentication-related API calls.
 * Implements security best practices and proper error handling.
 *
 * @module @plpg/web/services/auth.service
 *
 * @description
 * This service encapsulates all authentication API interactions including:
 * - User login with optional remember me
 * - User registration
 * - Token refresh
 * - Password reset flows
 * - Email verification
 * - Profile management
 *
 * Security features:
 * - Type-safe request/response handling
 * - Centralized error management
 * - Token management integration
 * - Rate limiting awareness
 */

import {
  api,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getRefreshToken,
  getErrorMessage,
} from '../lib/api';

import type { AuthUser } from '../contexts/AuthContext';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '@plpg/shared/validation';

/**
 * Login API response structure.
 *
 * @interface LoginResponse
 * @property {string} accessToken - JWT access token for authenticated requests
 * @property {string} refreshToken - JWT refresh token for obtaining new access tokens
 * @property {AuthUser} user - Authenticated user information
 * @property {number} expiresIn - Access token expiration time in seconds
 * @property {string} [redirectPath] - Optional redirect path (e.g., /onboarding if incomplete)
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
  redirectPath?: string;
}

/**
 * Extended login input with remember me option.
 *
 * @interface LoginWithRememberMeInput
 * @extends {LoginInput}
 * @property {boolean} [rememberMe] - Whether to extend session duration
 */
export interface LoginWithRememberMeInput extends LoginInput {
  rememberMe?: boolean;
}

/**
 * Register API response structure.
 *
 * @interface RegisterResponse
 * @property {string} accessToken - JWT access token for authenticated requests
 * @property {string} refreshToken - JWT refresh token for obtaining new access tokens
 * @property {AuthUser} user - Newly registered user information
 * @property {number} expiresIn - Access token expiration time in seconds
 * @property {boolean} emailVerificationRequired - Whether email verification is required
 */
export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
  emailVerificationRequired: boolean;
}

/**
 * Forgot password API response structure.
 *
 * @interface ForgotPasswordResponse
 * @property {string} message - Success message
 * @property {boolean} emailSent - Whether password reset email was sent
 */
export interface ForgotPasswordResponse {
  message: string;
  emailSent: boolean;
}

/**
 * Reset password API response structure.
 *
 * @interface ResetPasswordResponse
 * @property {string} message - Success message
 */
export interface ResetPasswordResponse {
  message: string;
}

/**
 * Change password API response structure.
 *
 * @interface ChangePasswordResponse
 * @property {string} message - Success message
 */
export interface ChangePasswordResponse {
  message: string;
}

/**
 * Update profile API response structure.
 *
 * @interface UpdateProfileResponse
 * @property {AuthUser} user - Updated user information
 */
export interface UpdateProfileResponse {
  user: AuthUser;
}

/**
 * Authenticates a user with email and password.
 * Stores access and refresh tokens in localStorage.
 * Supports "remember me" functionality for extended sessions.
 *
 * Rate Limiting:
 * - 5 failed attempts result in 15-minute account lockout
 * - Lockout is enforced at the API level
 *
 * @param {LoginWithRememberMeInput} credentials - User login credentials
 * @returns {Promise<LoginResponse>} Login response with tokens and user data
 *
 * @throws {Error} Authentication failed, account locked, or network error
 *
 * @example
 * ```typescript
 * try {
 *   const response = await loginUser({
 *     email: 'user@example.com',
 *     password: 'SecurePass123!',
 *     rememberMe: true
 *   });
 *   console.log('Logged in:', response.user);
 * } catch (error) {
 *   console.error('Login failed:', error.message);
 * }
 * ```
 */
export async function loginUser(
  credentials: LoginWithRememberMeInput
): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
    });

    // Store tokens in localStorage
    setAccessToken(response.data.accessToken);
    setRefreshToken(response.data.refreshToken);

    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Registers a new user account.
 * Creates user, stores tokens, and initiates email verification if required.
 *
 * @param {RegisterInput} userData - New user registration data
 * @returns {Promise<RegisterResponse>} Registration response with tokens and user data
 *
 * @throws {Error} Registration failed (duplicate email, validation error, network error)
 *
 * @example
 * ```typescript
 * try {
 *   const response = await registerUser({
 *     email: 'newuser@example.com',
 *     password: 'SecurePass123!',
 *     name: 'John Doe'
 *   });
 *   console.log('Registered:', response.user);
 *   if (response.emailVerificationRequired) {
 *     console.log('Please verify your email');
 *   }
 * } catch (error) {
 *   console.error('Registration failed:', error.message);
 * }
 * ```
 */
export async function registerUser(
  userData: RegisterInput
): Promise<RegisterResponse> {
  try {
    const response = await api.post<RegisterResponse>(
      '/auth/register',
      userData
    );

    // Store tokens in localStorage
    setAccessToken(response.data.accessToken);
    setRefreshToken(response.data.refreshToken);

    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Initiates forgot password flow.
 * Sends password reset email to user if account exists.
 * Returns success even if email doesn't exist (security best practice).
 *
 * @param {ForgotPasswordInput} data - Forgot password request data
 * @returns {Promise<ForgotPasswordResponse>} Success response
 *
 * @throws {Error} Network error or server error
 *
 * @example
 * ```typescript
 * try {
 *   const response = await forgotPassword({
 *     email: 'user@example.com'
 *   });
 *   console.log(response.message);
 * } catch (error) {
 *   console.error('Request failed:', error.message);
 * }
 * ```
 */
export async function forgotPassword(
  data: ForgotPasswordInput
): Promise<ForgotPasswordResponse> {
  try {
    const response = await api.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      data
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Resets user password using reset token from email.
 *
 * @param {ResetPasswordInput} data - Password reset data with token and new password
 * @returns {Promise<ResetPasswordResponse>} Success response
 *
 * @throws {Error} Invalid/expired token, validation error, or network error
 *
 * @example
 * ```typescript
 * try {
 *   const response = await resetPassword({
 *     token: 'reset-token-from-email',
 *     password: 'NewSecurePass123!'
 *   });
 *   console.log(response.message);
 * } catch (error) {
 *   console.error('Password reset failed:', error.message);
 * }
 * ```
 */
export async function resetPassword(
  data: ResetPasswordInput
): Promise<ResetPasswordResponse> {
  try {
    const response = await api.post<ResetPasswordResponse>(
      '/auth/reset-password',
      data
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Changes user's password (requires current password).
 * User must be authenticated.
 *
 * @param {ChangePasswordInput} data - Current and new password
 * @returns {Promise<ChangePasswordResponse>} Success response
 *
 * @throws {Error} Invalid current password, validation error, or network error
 *
 * @example
 * ```typescript
 * try {
 *   const response = await changePassword({
 *     currentPassword: 'OldPass123!',
 *     newPassword: 'NewSecurePass123!'
 *   });
 *   console.log(response.message);
 * } catch (error) {
 *   console.error('Password change failed:', error.message);
 * }
 * ```
 */
export async function changePassword(
  data: ChangePasswordInput
): Promise<ChangePasswordResponse> {
  try {
    const response = await api.post<ChangePasswordResponse>(
      '/auth/change-password',
      data
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Updates user profile information.
 * User must be authenticated.
 *
 * @param {UpdateProfileInput} data - Profile data to update
 * @returns {Promise<UpdateProfileResponse>} Updated user data
 *
 * @throws {Error} Validation error or network error
 *
 * @example
 * ```typescript
 * try {
 *   const response = await updateProfile({
 *     name: 'Jane Doe',
 *     avatarUrl: 'https://example.com/avatar.jpg'
 *   });
 *   console.log('Profile updated:', response.user);
 * } catch (error) {
 *   console.error('Profile update failed:', error.message);
 * }
 * ```
 */
export async function updateProfile(
  data: UpdateProfileInput
): Promise<UpdateProfileResponse> {
  try {
    const response = await api.patch<UpdateProfileResponse>(
      '/auth/profile',
      data
    );
    return response.data;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Logout API response structure.
 *
 * @interface LogoutResponse
 * @property {boolean} success - Whether the logout was successful
 * @property {string} message - Success or error message
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Logout options for configuring logout behavior.
 *
 * @interface LogoutOptions
 * @property {boolean} [logoutAll=false] - If true, logs out from all sessions
 */
export interface LogoutOptions {
  logoutAll?: boolean;
}

/**
 * Logs out the current user.
 * Calls the backend to invalidate the refresh token, then clears local tokens.
 * This ensures server-side session invalidation for security on shared devices.
 *
 * @param {LogoutOptions} [options] - Logout options
 * @param {boolean} [options.logoutAll=false] - Logout from all sessions
 * @returns {Promise<LogoutResponse>} Logout response
 *
 * @example
 * ```typescript
 * // Logout from current session
 * await logoutUser();
 *
 * // Logout from all sessions
 * await logoutUser({ logoutAll: true });
 * ```
 */
export async function logoutUser(
  options: LogoutOptions = {}
): Promise<LogoutResponse> {
  const { logoutAll = false } = options;

  try {
    // Get the current refresh token to invalidate server-side
    const refreshToken = getRefreshToken();

    // Call backend to invalidate the refresh token
    const response = await api.post<LogoutResponse>('/auth/logout', {
      refreshToken,
      logoutAll,
    });

    return response.data;
  } catch (error) {
    // Log the error but continue with local cleanup
    console.error('Logout API call failed:', error);

    // Return a failure response but don't throw - local cleanup will still happen
    return {
      success: false,
      message: getErrorMessage(error),
    };
  } finally {
    // Always clear tokens locally, even if API call fails
    clearTokens();
  }
}
