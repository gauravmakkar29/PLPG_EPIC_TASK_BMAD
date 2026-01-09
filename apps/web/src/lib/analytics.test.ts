/**
 * @fileoverview Tests for analytics module.
 * Validates event tracking, user identification, and configuration.
 *
 * @module @plpg/web/lib/analytics.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  initAnalytics,
  trackEvent,
  trackPageView,
  identifyUser,
  clearUser,
  getTrackedEvents,
  clearTrackedEvents,
  AnalyticsEvent,
} from './analytics';

describe('Analytics Module', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Reset analytics config
    initAnalytics({ debug: false, enableInDev: true });
    // Clear console mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('initAnalytics', () => {
    it('should initialize with default config', () => {
      initAnalytics();
      // Default config should allow tracking in dev
      trackEvent('test_event');
      const events = getTrackedEvents();
      expect(events.length).toBe(1);
    });

    it('should accept custom configuration', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      initAnalytics({ debug: true, enableInDev: true });
      trackEvent('test_event');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Event tracked:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should log initialization when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      initAnalytics({ debug: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Initialized with config:',
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('trackEvent', () => {
    it('should track events with predefined event names', () => {
      trackEvent(AnalyticsEvent.LOGIN_COMPLETED);

      const events = getTrackedEvents();
      expect(events.length).toBe(1);
      expect((events[0] as { event: string }).event).toBe('login_completed');
    });

    it('should track events with custom event names', () => {
      trackEvent('custom_event_name');

      const events = getTrackedEvents();
      expect(events.length).toBe(1);
      expect((events[0] as { event: string }).event).toBe('custom_event_name');
    });

    it('should include event properties', () => {
      trackEvent(AnalyticsEvent.SKILL_COMPLETED, {
        skillId: 'python-basics',
        duration: 3600,
      });

      const events = getTrackedEvents();
      const eventData = events[0] as {
        event: string;
        properties: { skillId: string; duration: number };
      };
      expect(eventData.properties.skillId).toBe('python-basics');
      expect(eventData.properties.duration).toBe(3600);
    });

    it('should include timestamp in event properties', () => {
      trackEvent('test_event');

      const events = getTrackedEvents();
      const eventData = events[0] as {
        properties: { timestamp: string };
      };
      expect(eventData.properties.timestamp).toBeDefined();
      // Verify it's a valid ISO date string
      expect(new Date(eventData.properties.timestamp).toISOString()).toBe(
        eventData.properties.timestamp
      );
    });

    it('should include URL in event properties', () => {
      trackEvent('test_event');

      const events = getTrackedEvents();
      const eventData = events[0] as {
        properties: { url: string };
      };
      expect(eventData.properties.url).toBeDefined();
    });

    it('should include userId when user is identified', () => {
      identifyUser({ userId: 'user-123', email: 'test@example.com' });
      trackEvent('test_event');

      const events = getTrackedEvents();
      const eventData = events[0] as {
        properties: { userId: string };
      };
      expect(eventData.properties.userId).toBe('user-123');
    });

    it('should track logout_completed event', () => {
      trackEvent(AnalyticsEvent.LOGOUT_COMPLETED, { method: 'button_click' });

      const events = getTrackedEvents();
      expect(events.length).toBe(1);
      expect((events[0] as { event: string }).event).toBe('logout_completed');
      const eventData = events[0] as {
        properties: { method: string };
      };
      expect(eventData.properties.method).toBe('button_click');
    });

    it('should store events in sessionStorage', () => {
      trackEvent('test_event');

      const storedEvents = sessionStorage.getItem('plpg_analytics_events');
      expect(storedEvents).not.toBeNull();

      const parsedEvents = JSON.parse(storedEvents || '[]');
      expect(parsedEvents.length).toBe(1);
    });

    it('should accumulate multiple events', () => {
      trackEvent('event_1');
      trackEvent('event_2');
      trackEvent('event_3');

      const events = getTrackedEvents();
      expect(events.length).toBe(3);
    });

    it('should log event when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      initAnalytics({ debug: true, enableInDev: true });
      trackEvent('test_event');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Event tracked:',
        expect.objectContaining({
          event: 'test_event',
          properties: expect.any(Object),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('trackPageView', () => {
    it('should track page view events', () => {
      trackPageView('Dashboard');

      const events = getTrackedEvents();
      expect(events.length).toBe(1);
      expect((events[0] as { event: string }).event).toBe('page_view');
    });

    it('should include page name in properties', () => {
      trackPageView('Settings');

      const events = getTrackedEvents();
      const eventData = events[0] as {
        properties: { page_name: string };
      };
      expect(eventData.properties.page_name).toBe('Settings');
    });

    it('should include additional page properties', () => {
      trackPageView('Dashboard', { referrer: '/sign-in' });

      const events = getTrackedEvents();
      const eventData = events[0] as {
        properties: { page_name: string; referrer: string };
      };
      expect(eventData.properties.page_name).toBe('Dashboard');
      expect(eventData.properties.referrer).toBe('/sign-in');
    });
  });

  describe('identifyUser', () => {
    it('should identify user with properties', () => {
      identifyUser({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      // Verify user is set by tracking an event
      trackEvent('test_event');

      const events = getTrackedEvents();
      const eventData = events[0] as {
        properties: { userId: string };
      };
      expect(eventData.properties.userId).toBe('user-123');
    });

    it('should log identification when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      initAnalytics({ debug: true, enableInDev: true });
      identifyUser({ userId: 'user-123' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] User identified:',
        expect.objectContaining({ userId: 'user-123' })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('clearUser', () => {
    it('should clear identified user', () => {
      identifyUser({ userId: 'user-123' });
      clearUser();

      trackEvent('test_event');

      const events = getTrackedEvents();
      const eventData = events[0] as {
        properties: { userId: string | undefined };
      };
      expect(eventData.properties.userId).toBeUndefined();
    });

    it('should log user cleared when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      initAnalytics({ debug: true, enableInDev: true });
      identifyUser({ userId: 'user-123' });
      clearUser();

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] User cleared');

      consoleSpy.mockRestore();
    });
  });

  describe('getTrackedEvents', () => {
    it('should return empty array when no events tracked', () => {
      const events = getTrackedEvents();
      expect(events).toEqual([]);
    });

    it('should return all tracked events', () => {
      trackEvent('event_1');
      trackEvent('event_2');

      const events = getTrackedEvents();
      expect(events.length).toBe(2);
    });

    it('should return empty array if sessionStorage is corrupted', () => {
      sessionStorage.setItem('plpg_analytics_events', 'invalid-json');

      const events = getTrackedEvents();
      expect(events).toEqual([]);
    });
  });

  describe('clearTrackedEvents', () => {
    it('should clear all tracked events', () => {
      trackEvent('event_1');
      trackEvent('event_2');

      expect(getTrackedEvents().length).toBe(2);

      clearTrackedEvents();

      expect(getTrackedEvents().length).toBe(0);
    });

    it('should remove events from sessionStorage', () => {
      trackEvent('event_1');

      clearTrackedEvents();

      expect(sessionStorage.getItem('plpg_analytics_events')).toBeNull();
    });
  });

  describe('AnalyticsEvent Enum', () => {
    it('should have all required event types', () => {
      expect(AnalyticsEvent.LOGIN_COMPLETED).toBe('login_completed');
      expect(AnalyticsEvent.SIGNUP_COMPLETED).toBe('signup_completed');
      expect(AnalyticsEvent.LOGOUT_COMPLETED).toBe('logout_completed');
      expect(AnalyticsEvent.ONBOARDING_STARTED).toBe('onboarding_started');
      expect(AnalyticsEvent.ONBOARDING_COMPLETED).toBe('onboarding_completed');
      expect(AnalyticsEvent.DASHBOARD_VIEWED).toBe('dashboard_viewed');
      expect(AnalyticsEvent.SKILL_COMPLETED).toBe('skill_completed');
      expect(AnalyticsEvent.PROFILE_UPDATED).toBe('profile_updated');
      expect(AnalyticsEvent.PAGE_VIEW).toBe('page_view');
    });
  });
});
