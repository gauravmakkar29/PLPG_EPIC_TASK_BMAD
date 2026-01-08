/**
 * @fileoverview Global test setup for PLPG web application.
 * Configures testing-library matchers and MSW server.
 *
 * @module @plpg/web/test/setup
 * @description Global setup that runs before all tests.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

/**
 * Start MSW server before all tests.
 * Listens for API requests and returns mocked responses.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

/**
 * Reset handlers after each test.
 * Ensures tests don't affect each other.
 */
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

/**
 * Close MSW server after all tests.
 */
afterAll(() => {
  server.close();
});

/**
 * Mock window.matchMedia for components that use media queries.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

/**
 * Mock ResizeObserver for components that observe element sizes.
 */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;

/**
 * Mock IntersectionObserver for components that use intersection detection.
 */
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

window.IntersectionObserver = IntersectionObserverMock;
