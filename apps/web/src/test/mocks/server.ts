/**
 * @fileoverview MSW server setup for Node.js test environment.
 * Creates and configures the mock service worker server.
 *
 * @module @plpg/web/test/mocks/server
 * @description MSW server instance for intercepting API requests in tests.
 *
 * @example
 * // In test setup
 * import { server } from './mocks/server';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance.
 * Intercepts network requests and returns mock responses.
 *
 * @description
 * The server is started in the test setup file (setup.ts).
 * Use server.use() to override handlers for specific tests.
 *
 * @example
 * // Override handler in a test
 * import { server } from './mocks/server';
 * import { http, HttpResponse } from 'msw';
 *
 * test('handles error response', () => {
 *   server.use(
 *     http.get('/api/v1/auth/me', () => {
 *       return HttpResponse.json({ error: 'Not found' }, { status: 404 });
 *     })
 *   );
 *   // ... test code
 * });
 */
export const server = setupServer(...handlers);
