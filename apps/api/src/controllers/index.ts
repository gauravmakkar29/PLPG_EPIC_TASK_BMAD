/**
 * @fileoverview Barrel export for all controllers.
 *
 * @module @plpg/api/controllers
 */

export { healthCheck, detailedHealthCheck } from './health.controller';
export { login, register, getMe } from './auth.controller';
