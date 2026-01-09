/**
 * @fileoverview Date utility functions for PLPG.
 * Provides date formatting and calculation utilities.
 *
 * @module @plpg/shared/utils/date
 * @description Date manipulation and formatting utilities.
 */

/**
 * Format a date to ISO string (YYYY-MM-DD).
 *
 * @function formatDateISO
 * @param {Date | string} date - Date to format
 * @returns {string} ISO formatted date string
 *
 * @example
 * formatDateISO(new Date('2026-01-15')) // '2026-01-15'
 */
export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format a date for display (e.g., "Jan 15, 2026").
 *
 * @function formatDateDisplay
 * @param {Date | string} date - Date to format
 * @param {Intl.DateTimeFormatOptions} [options] - Formatting options
 * @returns {string} Formatted date string
 *
 * @example
 * formatDateDisplay(new Date('2026-01-15')) // 'Jan 15, 2026'
 */
export function formatDateDisplay(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format a date with time (e.g., "Jan 15, 2026 2:30 PM").
 *
 * @function formatDateTime
 * @param {Date | string} date - Date to format
 * @returns {string} Formatted date-time string
 *
 * @example
 * formatDateTime(new Date('2026-01-15T14:30:00')) // 'Jan 15, 2026 2:30 PM'
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a relative time string (e.g., "2 days ago", "in 3 weeks").
 *
 * @function formatRelativeTime
 * @param {Date | string} date - Date to format relative to now
 * @returns {string} Relative time string
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 86400000)) // '1 day ago'
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'tomorrow';
  }
  if (diffDays === -1) {
    return 'yesterday';
  }

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffDays) < 30) {
    return rtf.format(Math.round(diffDays / 7), 'week');
  } else if (Math.abs(diffDays) < 365) {
    return rtf.format(Math.round(diffDays / 30), 'month');
  } else {
    return rtf.format(Math.round(diffDays / 365), 'year');
  }
}

/**
 * Calculate days between two dates.
 *
 * @function daysBetween
 * @param {Date | string} date1 - First date
 * @param {Date | string} date2 - Second date
 * @returns {number} Number of days between dates
 *
 * @example
 * daysBetween('2026-01-01', '2026-01-15') // 14
 */
export function daysBetween(
  date1: Date | string,
  date2: Date | string
): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date.
 *
 * @function addDays
 * @param {Date | string} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} Resulting date
 *
 * @example
 * addDays('2026-01-01', 14) // Date: 2026-01-15
 */
export function addDays(date: Date | string, days: number): Date {
  const d =
    typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add weeks to a date.
 *
 * @function addWeeks
 * @param {Date | string} date - Starting date
 * @param {number} weeks - Number of weeks to add
 * @returns {Date} Resulting date
 */
export function addWeeks(date: Date | string, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Get the start of a week (Monday).
 *
 * @function startOfWeek
 * @param {Date | string} date - Date within the week
 * @returns {Date} Start of the week (Monday)
 */
export function startOfWeek(date: Date | string): Date {
  const d =
    typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of a week (Sunday).
 *
 * @function endOfWeek
 * @param {Date | string} date - Date within the week
 * @returns {Date} End of the week (Sunday)
 */
export function endOfWeek(date: Date | string): Date {
  const start = startOfWeek(date);
  return addDays(start, 6);
}

/**
 * Check if two dates are the same day.
 *
 * @function isSameDay
 * @param {Date | string} date1 - First date
 * @param {Date | string} date2 - Second date
 * @returns {boolean} Whether dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return formatDateISO(date1) === formatDateISO(date2);
}

/**
 * Check if a date is in the past.
 *
 * @function isPast
 * @param {Date | string} date - Date to check
 * @returns {boolean} Whether date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Check if a date is in the future.
 *
 * @function isFuture
 * @param {Date | string} date - Date to check
 * @returns {boolean} Whether date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
}

/**
 * Calculate projected completion date based on hours remaining and weekly commitment.
 *
 * @function calculateProjectedCompletion
 * @param {number} hoursRemaining - Total hours remaining
 * @param {number} weeklyHours - Hours committed per week
 * @param {Date | string} [startDate] - Start date (defaults to now)
 * @returns {Date} Projected completion date
 *
 * @example
 * calculateProjectedCompletion(100, 10) // Date ~10 weeks from now
 */
export function calculateProjectedCompletion(
  hoursRemaining: number,
  weeklyHours: number,
  startDate: Date | string = new Date()
): Date {
  const weeksNeeded = Math.ceil(hoursRemaining / weeklyHours);
  return addWeeks(startDate, weeksNeeded);
}
