/**
 * @fileoverview Barrel export for custom hooks.
 *
 * @module @plpg/web/hooks
 */

export { useProfile, SESSION_QUERY_KEY as PROFILE_SESSION_QUERY_KEY } from './useProfile';
export type { UseProfileReturn } from './useProfile';

export { useSession, SESSION_QUERY_KEY } from './useSession';
export type { UseSessionReturn } from './useSession';
