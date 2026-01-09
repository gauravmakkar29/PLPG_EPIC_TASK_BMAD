/**
 * @fileoverview Authentication routes module.
 * Defines HTTP routes for user authentication endpoints.
 *
 * @module @plpg/api/routes/auth
 * @description Route definitions for authentication flows.
 */

import { Router } from 'express';
import { registerSchema } from '@plpg/shared/validation';
import { register } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';

const router = Router();

/**
 * User Registration Endpoint
 *
 * @route POST /api/v1/auth/register
 * @description Creates a new user account with hashed password and trial period.
 *
 * @requestBody
 * - email: string (required) - Valid email address
 * - password: string (required) - Min 8 chars, uppercase, lowercase, number, special char
 * - name: string (required) - User's display name
 *
 * @response 201 - Successfully created user
 * {
 *   "user": AuthUser,
 *   "accessToken": string,
 *   "refreshToken": string
 * }
 *
 * @response 400 - Validation Error
 * {
 *   "error": "Validation Error",
 *   "message": "Request validation failed",
 *   "details": { ... }
 * }
 *
 * @response 409 - Conflict (email already exists)
 * {
 *   "error": "ConflictError",
 *   "message": "A user with this email already exists",
 *   "code": "CONFLICT"
 * }
 */
router.post('/register', validate({ body: registerSchema }), register);

export const authRoutes = router;
