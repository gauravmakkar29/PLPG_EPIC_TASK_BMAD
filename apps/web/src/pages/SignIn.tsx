/**
 * @fileoverview Sign In page component.
 * Provides user authentication through email and password login.
 * Implements security best practices including rate limiting, generic error messages,
 * and proper session management with optional "remember me" functionality.
 *
 * @module @plpg/web/pages/SignIn
 *
 * @description
 * This component handles the complete sign-in user experience including:
 * - Form validation with real-time feedback
 * - Secure authentication flow with generic error messaging
 * - Remember me functionality for extended sessions
 * - Redirect logic for authenticated users
 * - Loading states and error handling
 * - Analytics tracking
 *
 * Security Features:
 * - Generic error messages prevent user enumeration
 * - Rate limiting enforced at API level (5 attempts = 15 min lockout)
 * - Client-side validation before API calls
 * - Secure token storage via AuthContext
 *
 * @example
 * ```tsx
 * <Route path="/sign-in" element={<SignIn />} />
 * ```
 */

import {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  type JSX,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { loginUser } from '../services/auth.service';

/**
 * Form data structure for sign-in inputs.
 *
 * @interface SignInFormData
 * @property {string} email - User's email address
 * @property {string} password - User's password
 * @property {boolean} rememberMe - Whether to extend session duration
 */
interface SignInFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Form validation errors structure.
 *
 * @interface FormErrors
 * @property {string} [email] - Email validation error message
 * @property {string} [password] - Password validation error message
 * @property {string} [general] - General authentication error message
 */
interface FormErrors {
  email?: string;
  password?: string;
  general?: string | undefined;
}

/**
 * Sign In page component.
 * Renders a secure login form with email/password authentication.
 *
 * Features:
 * - Client-side form validation
 * - Loading states during authentication
 * - Generic error messages for security
 * - Remember me option
 * - Forgot password link
 * - Sign up navigation link
 * - Auto-redirect for authenticated users
 * - Analytics tracking on successful login
 *
 * Redirects:
 * - Authenticated users → /dashboard (or /onboarding if incomplete)
 * - Successful login → /dashboard (backend determines onboarding status)
 *
 * @returns {JSX.Element} Sign in page component
 *
 * @component
 */
export function SignIn(): JSX.Element {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  /**
   * Form state management
   */
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Validates email format.
   *
   * @param {string} email - Email address to validate
   * @returns {string | undefined} Error message if invalid, undefined if valid
   */
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  /**
   * Validates password is not empty.
   * Note: Full password validation happens server-side.
   *
   * @param {string} password - Password to validate
   * @returns {string | undefined} Error message if invalid, undefined if valid
   */
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    return undefined;
  };

  /**
   * Validates all form fields.
   *
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles input field changes.
   * Clears field-specific errors on change.
   *
   * @param {ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear general error when user makes changes
    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: undefined,
      }));
    }
  };

  /**
   * Handles form submission.
   * Validates form, authenticates user, and redirects on success.
   *
   * @param {FormEvent<HTMLFormElement>} e - Form submit event
   *
   * @async
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate user
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Store authentication data
      login(response.accessToken, response.user);

      // Track analytics event
      interface WindowWithAnalytics extends Window {
        analytics?: {
          track: (event: string, properties: Record<string, unknown>) => void;
        };
      }
      const windowWithAnalytics = window as WindowWithAnalytics;
      if (typeof window !== 'undefined' && windowWithAnalytics.analytics) {
        windowWithAnalytics.analytics.track('login_completed', {
          userId: response.user.id,
          email: response.user.email,
          rememberMe: formData.rememberMe,
          timestamp: new Date().toISOString(),
        });
      }

      // Navigate to appropriate page
      // Backend response includes redirectPath if onboarding incomplete
      const redirectPath = response.redirectPath ?? '/dashboard';
      navigate(redirectPath);
    } catch (_error) {
      // Display generic error message for security
      // Prevents user enumeration attacks
      setErrors({
        general:
          'Invalid email or password. Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              className="font-medium text-indigo-600 hover:text-indigo-500"
              to="/sign-up"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Sign In Form */}
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
        >
          {/* General Error Message */}
          {errors.general && (
            <div
              aria-live="polite"
              className="rounded-md bg-red-50 p-4"
              role="alert"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {errors.general}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            {/* Email Field */}
            <div>
              <label className="sr-only" htmlFor="email">
                Email address
              </label>
              <input
                autoComplete="email"
                className={`relative block w-full appearance-none rounded-md border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm`}
                id="email"
                name="email"
                placeholder="Email address"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                autoComplete="current-password"
                className={`relative block w-full appearance-none rounded-md border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm`}
                id="password"
                name="password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                checked={formData.rememberMe}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                onChange={handleInputChange}
              />
              <label
                className="ml-2 block text-sm text-gray-900"
                htmlFor="rememberMe"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                className="font-medium text-indigo-600 hover:text-indigo-500"
                to="/forgot-password"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <svg
                    aria-hidden="true"
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
