/**
 * @fileoverview Analytics tracking module for PLPG application.
 * Provides a centralized interface for tracking user events and interactions.
 * Implements a provider-agnostic design to support future analytics integrations.
 *
 * @module @plpg/web/lib/analytics
 */

/**
 * Supported analytics event names.
 * Defines all trackable events in the application.
 *
 * @enum {string}
 */
export enum AnalyticsEvent {
  /** User successfully logged in */
  LOGIN_COMPLETED = 'login_completed',
  /** User successfully registered */
  SIGNUP_COMPLETED = 'signup_completed',
  /** User successfully logged out */
  LOGOUT_COMPLETED = 'logout_completed',
  /** User started onboarding flow */
  ONBOARDING_STARTED = 'onboarding_started',
  /** User completed onboarding flow */
  ONBOARDING_COMPLETED = 'onboarding_completed',
  /** User viewed dashboard */
  DASHBOARD_VIEWED = 'dashboard_viewed',
  /** User completed a skill/module */
  SKILL_COMPLETED = 'skill_completed',
  /** User updated profile */
  PROFILE_UPDATED = 'profile_updated',
  /** Page view event */
  PAGE_VIEW = 'page_view',
}

/**
 * Analytics event properties interface.
 * Defines the structure of additional data attached to events.
 *
 * @interface EventProperties
 */
export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * User properties interface for identifying users.
 *
 * @interface UserProperties
 */
export interface UserProperties {
  /** User's unique identifier */
  userId?: string;
  /** User's email address */
  email?: string;
  /** User's display name */
  name?: string;
  /** Additional custom properties */
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Analytics configuration options.
 *
 * @interface AnalyticsConfig
 */
export interface AnalyticsConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Enable analytics in development mode */
  enableInDev?: boolean;
}

/**
 * Default analytics configuration.
 */
const defaultConfig: AnalyticsConfig = {
  debug: import.meta.env.DEV,
  enableInDev: true,
};

/**
 * Current analytics configuration.
 */
let config: AnalyticsConfig = { ...defaultConfig };

/**
 * Currently identified user properties.
 */
let currentUser: UserProperties | null = null;

/**
 * Initializes the analytics module with custom configuration.
 *
 * @param {AnalyticsConfig} customConfig - Custom configuration options
 * @returns {void}
 *
 * @example
 * ```typescript
 * initAnalytics({ debug: false, enableInDev: true });
 * ```
 */
export function initAnalytics(customConfig: Partial<AnalyticsConfig> = {}): void {
  config = { ...defaultConfig, ...customConfig };

  if (config.debug) {
    console.log('[Analytics] Initialized with config:', config);
  }
}

/**
 * Identifies a user for analytics tracking.
 * Should be called when a user logs in or is authenticated.
 *
 * @param {UserProperties} properties - User identification properties
 * @returns {void}
 *
 * @example
 * ```typescript
 * identifyUser({ userId: '123', email: 'user@example.com', name: 'John Doe' });
 * ```
 */
export function identifyUser(properties: UserProperties): void {
  currentUser = properties;

  if (config.debug) {
    console.log('[Analytics] User identified:', properties);
  }

  // Future: Send to analytics provider
  // e.g., mixpanel.identify(properties.userId);
  // e.g., amplitude.setUserId(properties.userId);
}

/**
 * Clears the currently identified user.
 * Should be called when a user logs out.
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * clearUser();
 * ```
 */
export function clearUser(): void {
  currentUser = null;

  if (config.debug) {
    console.log('[Analytics] User cleared');
  }

  // Future: Reset analytics provider user
  // e.g., mixpanel.reset();
  // e.g., amplitude.reset();
}

/**
 * Tracks an analytics event with optional properties.
 * This is the primary function for tracking user interactions.
 *
 * @param {AnalyticsEvent | string} eventName - Name of the event to track
 * @param {EventProperties} [properties={}] - Optional event properties
 * @returns {void}
 *
 * @example
 * ```typescript
 * // Track a predefined event
 * trackEvent(AnalyticsEvent.LOGOUT_COMPLETED);
 *
 * // Track with custom properties
 * trackEvent(AnalyticsEvent.SKILL_COMPLETED, { skillId: 'python-basics', duration: 3600 });
 *
 * // Track a custom event
 * trackEvent('custom_button_clicked', { buttonId: 'cta-hero' });
 * ```
 */
export function trackEvent(
  eventName: AnalyticsEvent | string,
  properties: EventProperties = {}
): void {
  // Skip tracking in development unless explicitly enabled
  if (!config.enableInDev && import.meta.env.DEV) {
    return;
  }

  const eventData = {
    event: eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      userId: currentUser?.userId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  };

  if (config.debug) {
    console.log('[Analytics] Event tracked:', eventData);
  }

  // Future: Send to analytics provider
  // e.g., mixpanel.track(eventName, eventData.properties);
  // e.g., amplitude.track(eventName, eventData.properties);
  // e.g., gtag('event', eventName, eventData.properties);

  // For now, store events in sessionStorage for debugging/testing
  if (typeof window !== 'undefined') {
    try {
      const existingEvents = JSON.parse(
        sessionStorage.getItem('plpg_analytics_events') || '[]'
      ) as unknown[];
      existingEvents.push(eventData);
      sessionStorage.setItem('plpg_analytics_events', JSON.stringify(existingEvents));
    } catch {
      // Silently fail if sessionStorage is unavailable
    }
  }
}

/**
 * Tracks a page view event.
 *
 * @param {string} pageName - Name of the page being viewed
 * @param {EventProperties} [properties={}] - Optional page properties
 * @returns {void}
 *
 * @example
 * ```typescript
 * trackPageView('Dashboard', { referrer: document.referrer });
 * ```
 */
export function trackPageView(
  pageName: string,
  properties: EventProperties = {}
): void {
  trackEvent(AnalyticsEvent.PAGE_VIEW, {
    page_name: pageName,
    ...properties,
  });
}

/**
 * Gets all tracked events from the current session.
 * Useful for debugging and testing.
 *
 * @returns {unknown[]} Array of tracked events
 *
 * @example
 * ```typescript
 * const events = getTrackedEvents();
 * console.log('Events this session:', events);
 * ```
 */
export function getTrackedEvents(): unknown[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(
      sessionStorage.getItem('plpg_analytics_events') || '[]'
    ) as unknown[];
  } catch {
    return [];
  }
}

/**
 * Clears all tracked events from the current session.
 * Useful for testing and cleanup.
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * clearTrackedEvents();
 * ```
 */
export function clearTrackedEvents(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('plpg_analytics_events');
  }
}
