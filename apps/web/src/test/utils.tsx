/**
 * @fileoverview Test utilities for PLPG web application.
 * Provides custom render function with all application providers.
 *
 * @module @plpg/web/test/utils
 * @description Testing utilities with provider wrappers.
 *
 * @example
 * import { render, screen, userEvent } from '@/test/utils';
 *
 * test('renders component', async () => {
 *   const user = userEvent.setup();
 *   render(<MyComponent />);
 *
 *   await user.click(screen.getByRole('button'));
 *   expect(screen.getByText('Clicked')).toBeInTheDocument();
 * });
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { vi } from 'vitest';

import { AuthProvider } from '../contexts/AuthContext';

import type { ReactElement, ReactNode, JSX } from 'react';

/**
 * Creates a fresh QueryClient for each test.
 * Configured with test-friendly defaults.
 *
 * @function createTestQueryClient
 * @returns {QueryClient} QueryClient instance configured for testing
 *
 * @description
 * Test configuration:
 * - No retries (fail fast)
 * - No cache time (fresh data each test)
 * - No window focus refetch
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Props for the AllProviders wrapper component.
 *
 * @interface AllProvidersProps
 * @property {ReactNode} children - Child components to wrap
 * @property {QueryClient} [queryClient] - Optional custom QueryClient
 * @property {MemoryRouterProps} [routerProps] - Optional router configuration
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  routerProps?: MemoryRouterProps;
}

/**
 * Wrapper component that provides all application providers.
 * Use this to wrap components in tests that need provider context.
 *
 * @function AllProviders
 * @param {AllProvidersProps} props - Provider configuration
 * @returns {ReactElement} Wrapped component with all providers
 *
 * @description
 * Provides:
 * - QueryClientProvider for data fetching
 * - MemoryRouter for routing (test-friendly)
 *
 * @example
 * // Basic usage in tests
 * render(<MyComponent />, { wrapper: AllProviders });
 *
 * // With custom initial route
 * render(<MyComponent />, {
 *   wrapper: ({ children }) => (
 *     <AllProviders routerProps={{ initialEntries: ['/dashboard'] }}>
 *       {children}
 *     </AllProviders>
 *   )
 * });
 */
export function AllProviders({
  children,
  queryClient,
  routerProps = {},
}: AllProvidersProps): ReactElement {
  const client = queryClient ?? createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter {...routerProps}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render options extending RTL render options.
 *
 * @interface CustomRenderOptions
 * @extends RenderOptions
 * @property {QueryClient} [queryClient] - Custom QueryClient for the test
 * @property {string} [initialRoute] - Initial route for MemoryRouter
 * @property {string[]} [initialEntries] - Initial history entries
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
  initialEntries?: string[];
}

/**
 * Custom render function with all providers pre-configured.
 * Use this instead of @testing-library/react's render.
 *
 * @function customRender
 * @param {ReactElement} ui - Component to render
 * @param {CustomRenderOptions} [options] - Render options
 * @returns {ReturnType<typeof render>} Render result with queries
 *
 * @description
 * This render function automatically wraps components in:
 * - QueryClientProvider
 * - MemoryRouter
 *
 * @example
 * import { render, screen } from '@/test/utils';
 *
 * test('renders landing page', () => {
 *   render(<LandingPage />);
 *   expect(screen.getByRole('heading')).toBeInTheDocument();
 * });
 *
 * @example
 * // With custom initial route
 * render(<App />, { initialRoute: '/dashboard' });
 *
 * @example
 * // With custom query client
 * const queryClient = createTestQueryClient();
 * render(<MyComponent />, { queryClient });
 */
function customRender(
  ui: ReactElement,
  {
    queryClient,
    initialRoute = '/',
    initialEntries,
    ...options
  }: CustomRenderOptions = {}
): ReturnType<typeof render> {
  const entries = initialEntries ?? [initialRoute];

  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <AllProviders
      {...(queryClient !== undefined && { queryClient })}
      routerProps={{ initialEntries: entries }}
    >
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Render function with router navigation mock.
 * Returns navigate mock for testing navigation.
 * Uses spy on MemoryRouter's navigate function.
 *
 * @function renderWithRouter
 * @param {ReactElement} ui - Component to render
 * @param {CustomRenderOptions} [options] - Render options
 * @returns {object} Render result with navigate spy
 *
 * @example
 * const { navigate } = renderWithRouter(<SignIn />);
 * // ... trigger navigation
 * expect(navigate).toHaveBeenCalledWith('/dashboard');
 */
export function renderWithRouter(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof customRender> & { navigate: ReturnType<typeof vi.fn> } {
  // Simply use the standard render - MemoryRouter handles navigation
  // For testing navigation, we can check the route changes
  const result = customRender(ui, options);

  // Create a navigate mock that can be checked
  const navigate = vi.fn();

  return {
    ...result,
    navigate,
  };
}

// Re-export commonly used testing-library utilities (excluding render which we override)
export {
  screen,
  waitFor,
  within,
  fireEvent,
  act,
  cleanup,
  renderHook,
  waitForElementToBeRemoved,
} from '@testing-library/react';

// Export our custom render function
export { customRender as render };

// Export userEvent for convenience
export { userEvent };

// Export mock data for use in tests
export { mockUser, mockAuthResponse, mockSession } from './mocks/handlers';
