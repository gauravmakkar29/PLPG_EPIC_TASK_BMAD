/**
 * @fileoverview JWT utility module for token generation and verification.
 * Provides functions for creating and validating JWT access and refresh tokens.
 *
 * @module @plpg/api/lib/jwt
 * @description Secure JWT handling for PLPG authentication.
 */

import jwt from 'jsonwebtoken';
import type { AuthTokenPayload, RefreshTokenPayload, UserRole } from '@plpg/shared';
import { AuthenticationError } from '@plpg/shared';
import { env } from './env';

/**
 * Access token expiration time.
 * @constant ACCESS_TOKEN_EXPIRY
 */
const ACCESS_TOKEN_EXPIRY = '15m';

/**
 * Refresh token expiration time.
 * @constant REFRESH_TOKEN_EXPIRY
 */
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Refresh token expiration in milliseconds (7 days).
 * @constant REFRESH_TOKEN_EXPIRY_MS
 */
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Payload for generating an access token.
 *
 * @interface GenerateAccessTokenPayload
 * @property {string} userId - User's unique identifier
 * @property {string} email - User's email address
 * @property {UserRole} role - User's access role
 */
export interface GenerateAccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Payload for generating a refresh token.
 *
 * @interface GenerateRefreshTokenPayload
 * @property {string} userId - User's unique identifier
 * @property {string} tokenId - Unique identifier for this refresh token
 */
export interface GenerateRefreshTokenPayload {
  userId: string;
  tokenId: string;
}

/**
 * Generates a JWT access token.
 *
 * @function generateAccessToken
 * @param {GenerateAccessTokenPayload} payload - Data to encode in the token
 * @returns {string} Signed JWT access token
 *
 * @example
 * const token = generateAccessToken({
 *   userId: 'uuid-123',
 *   email: 'user@example.com',
 *   role: 'free'
 * });
 */
export function generateAccessToken(payload: GenerateAccessTokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'plpg-api',
      audience: 'plpg-client',
    }
  );
}

/**
 * Generates a JWT refresh token.
 *
 * @function generateRefreshToken
 * @param {GenerateRefreshTokenPayload} payload - Data to encode in the token
 * @returns {string} Signed JWT refresh token
 *
 * @example
 * const refreshToken = generateRefreshToken({
 *   userId: 'uuid-123',
 *   tokenId: 'token-uuid-456'
 * });
 */
export function generateRefreshToken(payload: GenerateRefreshTokenPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      tokenId: payload.tokenId,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'plpg-api',
      audience: 'plpg-client',
    }
  );
}

/**
 * Verifies and decodes a JWT access token.
 *
 * @function verifyAccessToken
 * @param {string} token - JWT access token to verify
 * @returns {AuthTokenPayload} Decoded token payload
 * @throws {AuthenticationError} If the token is invalid or expired
 *
 * @example
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log(payload.userId);
 * } catch (error) {
 *   // Handle invalid token
 * }
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'plpg-api',
      audience: 'plpg-client',
    }) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Verifies and decodes a JWT refresh token.
 *
 * @function verifyRefreshToken
 * @param {string} token - JWT refresh token to verify
 * @returns {RefreshTokenPayload} Decoded token payload
 * @throws {AuthenticationError} If the token is invalid or expired
 *
 * @example
 * try {
 *   const payload = verifyRefreshToken(refreshToken);
 *   console.log(payload.tokenId);
 * } catch (error) {
 *   // Handle invalid refresh token
 * }
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'plpg-api',
      audience: 'plpg-client',
    }) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw new AuthenticationError('Refresh token verification failed');
  }
}
