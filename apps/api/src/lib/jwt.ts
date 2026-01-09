/**
 * @fileoverview JWT utility functions for token generation and verification.
 * Provides secure token management for authentication.
 *
 * @module @plpg/api/lib/jwt
 */

import jwt from 'jsonwebtoken';
import { logger } from './logger';

/**
 * JWT payload structure for access tokens.
 *
 * @interface JwtPayload
 * @property {string} userId - User's unique identifier
 * @property {string} email - User's email address
 * @property {string} role - User's role (free, pro, admin)
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * JWT secret for access token signing.
 * Should be set in environment variables.
 */
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT secret for refresh token signing.
 * Should be different from access token secret.
 */
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'your-refresh-secret-key-change-in-production';

/**
 * Access token expiration time.
 * Default: 15 minutes for security.
 * Extended to 7 days if remember me is enabled.
 */
const ACCESS_TOKEN_EXPIRY = '15m';
const REMEMBER_ME_ACCESS_TOKEN_EXPIRY = '7d';

/**
 * Refresh token expiration time.
 * Default: 7 days.
 * Extended to 30 days if remember me is enabled.
 */
const REFRESH_TOKEN_EXPIRY = '7d';
const REMEMBER_ME_REFRESH_TOKEN_EXPIRY = '30d';

/**
 * Generates a JWT access token for a user.
 *
 * @param {JwtPayload} payload - User data to encode in the token
 * @param {boolean} [rememberMe=false] - Whether to extend token expiry
 * @returns {string} Signed JWT access token
 *
 * @example
 * ```typescript
 * const token = generateAccessToken({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   role: 'free'
 * });
 * ```
 */
export function generateAccessToken(
  payload: JwtPayload,
  rememberMe: boolean = false
): string {
  const expiry = rememberMe
    ? REMEMBER_ME_ACCESS_TOKEN_EXPIRY
    : ACCESS_TOKEN_EXPIRY;

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiry,
    issuer: 'plpg-api',
    audience: 'plpg-web',
  });
}

/**
 * Generates a JWT refresh token for a user.
 *
 * @param {JwtPayload} payload - User data to encode in the token
 * @param {boolean} [rememberMe=false] - Whether to extend token expiry
 * @returns {string} Signed JWT refresh token
 *
 * @example
 * ```typescript
 * const refreshToken = generateRefreshToken({
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   role: 'free'
 * });
 * ```
 */
export function generateRefreshToken(
  payload: JwtPayload,
  rememberMe: boolean = false
): string {
  const expiry = rememberMe
    ? REMEMBER_ME_REFRESH_TOKEN_EXPIRY
    : REFRESH_TOKEN_EXPIRY;

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: expiry,
    issuer: 'plpg-api',
    audience: 'plpg-web',
  });
}

/**
 * Verifies and decodes a JWT access token.
 *
 * @param {string} token - JWT token to verify
 * @returns {JwtPayload} Decoded token payload
 *
 * @throws {Error} Token is invalid, expired, or malformed
 *
 * @example
 * ```typescript
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 * ```
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'plpg-api',
      audience: 'plpg-web',
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    logger.error({ err: error }, 'Access token verification failed');
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verifies and decodes a JWT refresh token.
 *
 * @param {string} token - JWT refresh token to verify
 * @returns {JwtPayload} Decoded token payload
 *
 * @throws {Error} Token is invalid, expired, or malformed
 *
 * @example
 * ```typescript
 * try {
 *   const payload = verifyRefreshToken(token);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   console.error('Invalid refresh token:', error.message);
 * }
 * ```
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'plpg-api',
      audience: 'plpg-web',
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    logger.error({ err: error }, 'Refresh token verification failed');
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Gets the expiration time in seconds for a token type.
 *
 * @param {'access' | 'refresh'} tokenType - Type of token
 * @param {boolean} [rememberMe=false] - Whether remember me is enabled
 * @returns {number} Expiration time in seconds
 *
 * @example
 * ```typescript
 * const expirySeconds = getTokenExpiry('access', false);
 * // Returns 900 (15 minutes)
 * ```
 */
export function getTokenExpiry(
  tokenType: 'access' | 'refresh',
  rememberMe: boolean = false
): number {
  if (tokenType === 'access') {
    return rememberMe ? 7 * 24 * 60 * 60 : 15 * 60; // 7 days or 15 minutes
  } else {
    return rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
  }
}
