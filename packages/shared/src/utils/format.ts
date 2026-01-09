/**
 * @fileoverview String and number formatting utilities for PLPG.
 * Provides formatting functions for display purposes.
 *
 * @module @plpg/shared/utils/format
 * @description Formatting utilities for strings and numbers.
 */

/**
 * Format hours for display (e.g., "10h", "2.5h").
 *
 * @function formatHours
 * @param {number} hours - Number of hours
 * @param {boolean} [showFraction=true] - Whether to show decimal places
 * @returns {string} Formatted hours string
 *
 * @example
 * formatHours(10) // '10h'
 * formatHours(2.5) // '2.5h'
 */
export function formatHours(hours: number, showFraction = true): string {
  if (showFraction && hours % 1 !== 0) {
    return `${hours.toFixed(1)}h`;
  }
  return `${Math.round(hours)}h`;
}

/**
 * Format minutes for display (e.g., "45 min", "1h 30min").
 *
 * @function formatMinutes
 * @param {number} minutes - Number of minutes
 * @returns {string} Formatted time string
 *
 * @example
 * formatMinutes(45) // '45 min'
 * formatMinutes(90) // '1h 30min'
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Format duration in a human-readable way.
 *
 * @function formatDuration
 * @param {number} hours - Duration in hours
 * @returns {string} Human-readable duration
 *
 * @example
 * formatDuration(0.5) // '30 minutes'
 * formatDuration(1) // '1 hour'
 * formatDuration(24) // '1 day'
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  }
  if (hours === 1) {
    return '1 hour';
  }
  if (hours < 24) {
    return `${hours.toFixed(1).replace(/\.0$/, '')} hours`;
  }
  const days = hours / 24;
  if (days === 1) {
    return '1 day';
  }
  return `${days.toFixed(1).replace(/\.0$/, '')} days`;
}

/**
 * Format a percentage for display.
 *
 * @function formatPercent
 * @param {number} value - Value between 0 and 1, or 0 and 100
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted percentage string
 *
 * @example
 * formatPercent(0.75) // '75%'
 * formatPercent(75) // '75%'
 */
export function formatPercent(value: number, decimals = 0): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis.
 *
 * @function truncate
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 *
 * @example
 * truncate('Hello World', 5) // 'Hello...'
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Convert string to slug (URL-safe identifier).
 *
 * @function slugify
 * @param {string} text - Text to convert
 * @returns {string} URL-safe slug
 *
 * @example
 * slugify('Hello World!') // 'hello-world'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter of a string.
 *
 * @function capitalize
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 *
 * @example
 * capitalize('hello') // 'Hello'
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert snake_case or kebab-case to Title Case.
 *
 * @function toTitleCase
 * @param {string} text - Text to convert
 * @returns {string} Title case text
 *
 * @example
 * toTitleCase('hello_world') // 'Hello World'
 * toTitleCase('hello-world') // 'Hello World'
 */
export function toTitleCase(text: string): string {
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format a number with thousand separators.
 *
 * @function formatNumber
 * @param {number} num - Number to format
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted number string
 *
 * @example
 * formatNumber(1234567) // '1,234,567'
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.).
 *
 * @function formatOrdinal
 * @param {number} num - Number to format
 * @returns {string} Ordinal string
 *
 * @example
 * formatOrdinal(1) // '1st'
 * formatOrdinal(22) // '22nd'
 */
export function formatOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Pluralize a word based on count.
 *
 * @function pluralize
 * @param {number} count - Item count
 * @param {string} singular - Singular form
 * @param {string} [plural] - Plural form (defaults to singular + 's')
 * @returns {string} Formatted string with count and word
 *
 * @example
 * pluralize(1, 'module') // '1 module'
 * pluralize(5, 'module') // '5 modules'
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/**
 * Generate initials from a name.
 *
 * @function getInitials
 * @param {string | null | undefined} name - Full name
 * @param {number} [maxLength=2] - Maximum number of initials
 * @returns {string} Initials string
 *
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('John') // 'J'
 */
export function getInitials(
  name: string | null | undefined,
  maxLength = 2
): string {
  if (!name) {
    return '';
  }
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
}
