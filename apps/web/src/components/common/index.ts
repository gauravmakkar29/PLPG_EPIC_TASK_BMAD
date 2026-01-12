/**
 * @fileoverview Common components barrel export.
 * Provides centralized exports for reusable common components.
 *
 * @module @plpg/web/components/common
 */

export { ProtectedRoute, PublicRoute } from './ProtectedRoute';
export type { ProtectedRouteProps } from './ProtectedRoute';

export { ConfirmationDialog } from './ConfirmationDialog';
export type {
  ConfirmationDialogProps,
  ConfirmationDialogVariant,
} from './ConfirmationDialog';

export { WarningBanner } from './WarningBanner';
export type {
  WarningBannerProps,
  WarningBannerVariant,
} from './WarningBanner';
