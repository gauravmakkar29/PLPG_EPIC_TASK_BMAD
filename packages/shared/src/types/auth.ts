/**
 * @fileoverview Authentication type definitions for PLPG.
 * Defines JWT payload, request/response types for auth flows.
 *
 * @module @plpg/shared/types/auth
 * @description Authentication domain types for JWT-based auth.
 */

/**
 * User role enumeration.
 * Defines access levels for users.
 *
 * @constant UserRole
 * @description Available user roles.
 *
 * - free: Basic user with free tier access
 * - pro: Paid user with full access
 * - admin: Administrative user
 */
export type UserRole = 'free' | 'pro' | 'admin';

/**
 * JWT access token payload.
 *
 * @interface AuthTokenPayload
 * @description Data encoded in the JWT access token.
 *
 * @property {string} userId - User's unique identifier
 * @property {string} email - User's email address
 * @property {UserRole} role - User's access role
 * @property {number} iat - Token issued at timestamp
 * @property {number} exp - Token expiration timestamp
 */
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Refresh token payload.
 *
 * @interface RefreshTokenPayload
 * @description Data encoded in the JWT refresh token.
 */
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

/**
 * Login request body.
 *
 * @interface LoginRequest
 * @description Data required for user login.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request body.
 *
 * @interface RegisterRequest
 * @description Data required for user registration.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Auth response with tokens.
 *
 * @interface AuthResponse
 * @description Response from login/register endpoints.
 */
export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * User data in auth response.
 *
 * @interface AuthUser
 * @description Safe user representation without sensitive data.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * Refresh token request.
 *
 * @interface RefreshTokenRequest
 * @description Data for refreshing access token.
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response.
 *
 * @interface RefreshTokenResponse
 * @description Response from token refresh endpoint.
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Forgot password request.
 *
 * @interface ForgotPasswordRequest
 * @description Data for initiating password reset.
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request.
 *
 * @interface ResetPasswordRequest
 * @description Data for completing password reset.
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Verify email request.
 *
 * @interface VerifyEmailRequest
 * @description Data for email verification.
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Change password request.
 *
 * @interface ChangePasswordRequest
 * @description Data for changing password while logged in.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Session info response.
 *
 * @interface SessionInfo
 * @description Current session information.
 */
export interface SessionInfo {
  user: AuthUser;
  expiresAt: Date;
  issuedAt: Date;
}
