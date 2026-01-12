/**
 * @fileoverview Utilities barrel file for PLPG shared package.
 * Re-exports all utility functions.
 *
 * @module @plpg/shared/utils
 * @description Central export point for all utility functions.
 */

// Date utilities
export {
  formatDateISO,
  formatDateDisplay,
  formatDateTime,
  formatRelativeTime,
  daysBetween,
  addDays,
  addWeeks,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isPast,
  isFuture,
  calculateProjectedCompletion,
} from './date';

// Format utilities
export {
  formatHours,
  formatMinutes,
  formatDuration,
  formatPercent,
  truncate,
  slugify,
  capitalize,
  toTitleCase,
  formatNumber,
  formatOrdinal,
  pluralize,
  getInitials,
} from './format';
