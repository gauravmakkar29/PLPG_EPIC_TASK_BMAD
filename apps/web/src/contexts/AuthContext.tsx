/**
 * @fileoverview Authentication context provider for managing user authentication state.
 * Provides authentication state and methods throughout the application via React Context.
 *
 * @module @plpg/web/contexts/AuthContext
 */

import { createContext, useContext, useState, useEffect } from 'react';

import type { ReactNode, JSX } from 'react';

/**
 * Represents an authenticated user in the system.
 *
 * @interface AuthUser
 * @property {string} id - Unique identifier for the user
 * @property {string} email - User's email address
 * @property {string} name - User's display name
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Authentication context value interface.
 * Defines the shape of data and methods available through the auth context.
 *
 * @interface AuthContextValue
 * @property {AuthUser | null} user - Currently authenticated user or null if not authenticated
 * @property {boolean} isLoading - Indicates if authentication state is being initialized
 * @property {boolean} isAuthenticated - Computed property indicating if user is logged in
 * @property {Function} login - Function to authenticate user and store session
 * @property {Function} register - Function to register new user and store session
 * @property {Function} logout - Function to clear authentication and user session
 */
export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: AuthUser) => void;
  register: (token: string, userData: AuthUser) => void;
  logout: () => void;
}

/**
 * Props for the AuthProvider component.
 *
 * @interface AuthProviderProps
 * @property {ReactNode} children - Child components to be wrapped by the provider
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Key used for storing authentication token in localStorage.
 * @constant {string}
 */
const TOKEN_KEY = 'plpg_auth_token';

/**
 * Key used for storing user data in localStorage.
 * @constant {string}
 */
const USER_KEY = 'plpg_auth_user';

/**
 * Authentication context.
 * Must be accessed through useAuth hook for proper error handling.
 *
 * @type {React.Context<AuthContextValue | undefined>}
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider component.
 * Wraps the application to provide authentication state and methods to all child components.
 *
 * Manages:
 * - User authentication state
 * - Token storage in localStorage
 * - User data persistence
 * - Loading states during initialization
 *
 * @param {AuthProviderProps} props - Component props
 * @returns {JSX.Element} Provider component wrapping children
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Initialize authentication state on mount.
   * Checks localStorage for existing token and user data.
   */
  useEffect((): void => {
    const initAuth = (): void => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const userJson = localStorage.getItem(USER_KEY);

        if (token && userJson) {
          const userData = JSON.parse(userJson) as AuthUser;
          setUser(userData);
        }
      } catch (error) {
        // If parsing fails or data is corrupted, clear storage
        console.error('Error initializing auth state:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Authenticates a user and stores their session.
   *
   * @param {string} token - JWT or session token for the authenticated user
   * @param {AuthUser} userData - User information to store in state
   *
   * @example
   * ```tsx
   * const { login } = useAuth();
   * login('jwt-token-here', { id: '123', email: 'user@example.com', name: 'John Doe' });
   * ```
   */
  const login = (token: string, userData: AuthUser): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Registers a new user and stores their session.
   * Functionally identical to login - creates authenticated session.
   *
   * @param {string} token - JWT or session token for the newly registered user
   * @param {AuthUser} userData - User information to store in state
   *
   * @example
   * ```tsx
   * const { register } = useAuth();
   * register('jwt-token-here', { id: '123', email: 'user@example.com', name: 'John Doe' });
   * ```
   */
  const register = (token: string, userData: AuthUser): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Logs out the current user.
   * Clears authentication token and user data from both state and localStorage.
   *
   * @example
   * ```tsx
   * const { logout } = useAuth();
   * logout();
   * ```
   */
  const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  /**
   * Computed authentication status.
   * @type {boolean}
   */
  const isAuthenticated = user !== null;

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider.
 *
 * @returns {AuthContextValue} Authentication context value with user state and methods
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (isAuthenticated) {
 *     return <div>Welcome, {user?.name}!</div>;
 *   }
 *   return <button onClick={() => login(token, userData)}>Login</button>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
