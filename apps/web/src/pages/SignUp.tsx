/**
 * @fileoverview Sign Up page component for new user registration.
 * Provides email/password registration with comprehensive validation.
 *
 * @module @plpg/web/pages/SignUp
 */

import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../lib/api';

import type { FormEvent, ChangeEvent, JSX } from 'react';

/**
 * Interface for registration form data.
 *
 * @interface SignUpFormData
 * @property {string} email - User's email address
 * @property {string} password - User's chosen password
 * @property {string} confirmPassword - Password confirmation for validation
 * @property {string} name - User's display name (optional)
 */
interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

/**
 * Interface for form field validation errors.
 *
 * @interface FormErrors
 * @property {string} [email] - Email validation error message
 * @property {string} [password] - Password validation error message
 * @property {string} [confirmPassword] - Confirm password error message
 * @property {string} [general] - General form submission error
 */
interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Interface for API registration response.
 *
 * @interface RegisterResponse
 * @property {string} token - JWT authentication token
 * @property {object} user - User data object
 */
interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    onboardingComplete?: boolean;
  };
}

/**
 * Regular expression for email validation.
 * Validates standard email format with domain.
 *
 * @constant {RegExp}
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Initial state for form data.
 *
 * @constant {SignUpFormData}
 */
const INITIAL_FORM_DATA: SignUpFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
};

/**
 * Tracks analytics events for user registration flow.
 * Placeholder implementation - integrate with actual analytics service.
 *
 * @param {string} eventName - Name of the analytics event
 * @param {Record<string, unknown>} [properties] - Optional event properties
 */
function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  // TODO: Integrate with actual analytics service (e.g., Mixpanel, Amplitude)
  console.info('[Analytics]', eventName, properties);
}

/**
 * Sign Up page component.
 * Renders a registration form with email, password, and optional name fields.
 * Includes comprehensive client-side validation and error handling.
 *
 * Features:
 * - Email format validation
 * - Password strength requirements (8+ chars, 1 uppercase, 1 number)
 * - Password confirmation matching
 * - Optional name field
 * - Loading state during submission
 * - Error display for validation and API errors
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Analytics event tracking
 *
 * @returns {JSX.Element} The sign up page component
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/signup" element={<SignUp />} />
 * ```
 */
export function SignUp(): JSX.Element {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<SignUpFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  /**
   * Track signup_started event when component mounts.
   */
  useEffect((): void => {
    trackEvent('signup_started');
  }, []);

  /**
   * Redirect if already authenticated.
   */
  useEffect((): void => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Validates email format.
   *
   * @param {string} email - Email address to validate
   * @returns {string | undefined} Error message if invalid, undefined if valid
   */
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  }, []);

  /**
   * Validates password against requirements.
   *
   * @param {string} password - Password to validate
   * @returns {string | undefined} Error message if invalid, undefined if valid
   */
  const validatePassword = useCallback(
    (password: string): string | undefined => {
      if (!password) {
        return 'Password is required';
      }
      if (password.length < 8) {
        return 'Password must be at least 8 characters';
      }
      if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least 1 uppercase letter';
      }
      if (!/\d/.test(password)) {
        return 'Password must contain at least 1 number';
      }
      return undefined;
    },
    []
  );

  /**
   * Validates password confirmation matches password.
   *
   * @param {string} confirmPassword - Confirmation password
   * @param {string} password - Original password
   * @returns {string | undefined} Error message if mismatch, undefined if match
   */
  const validateConfirmPassword = useCallback(
    (confirmPassword: string, password: string): string | undefined => {
      if (!confirmPassword) {
        return 'Please confirm your password';
      }
      if (confirmPassword !== password) {
        return 'Passwords do not match';
      }
      return undefined;
    },
    []
  );

  /**
   * Validates entire form and returns errors object.
   *
   * @returns {FormErrors} Object containing any validation errors
   */
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    );
    if (confirmPasswordError) {
      newErrors.confirmPassword = confirmPasswordError;
    }

    return newErrors;
  }, [formData, validateEmail, validatePassword, validateConfirmPassword]);

  /**
   * Handles input field changes.
   * Updates form data and clears field-specific errors.
   *
   * @param {ChangeEvent<HTMLInputElement>} event - Input change event
   */
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { name, value } = event.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error for the changed field
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  /**
   * Handles form submission.
   * Validates form, makes API call, and handles response.
   *
   * @param {FormEvent<HTMLFormElement>} event - Form submit event
   */
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      // Clear previous errors
      setErrors({});

      // Validate form
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await api.post<RegisterResponse>('/auth/register', {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          name: formData.name.trim() || undefined,
        });

        const { token, user } = response.data;

        // Register user in auth context
        register(token, {
          id: user.id,
          email: user.email,
          name: user.name || '',
        });

        // Track successful signup
        trackEvent('signup_completed', {
          userId: user.id,
          hasName: !!user.name,
        });

        // Redirect based on onboarding status
        const redirectPath = user.onboardingComplete
          ? '/dashboard'
          : '/onboarding';
        navigate(redirectPath, { replace: true });
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        // Check for duplicate email error
        if (
          errorMessage.toLowerCase().includes('email') &&
          (errorMessage.toLowerCase().includes('exists') ||
            errorMessage.toLowerCase().includes('already') ||
            errorMessage.toLowerCase().includes('duplicate'))
        ) {
          setErrors({
            email: 'An account with this email already exists',
          });
        } else {
          setErrors({
            general: errorMessage,
          });
        }

        // Track signup failure
        trackEvent('signup_failed', {
          error: errorMessage,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, register, navigate]
  );

  /**
   * Toggles password visibility.
   */
  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * Toggles confirm password visibility.
   */
  const toggleConfirmPasswordVisibility = useCallback((): void => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            className="text-white text-3xl font-bold hover:text-primary-200 transition-colors"
            to="/"
          >
            PLPG
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">
            Create your account
          </h1>
          <p className="mt-2 text-primary-200">
            Start your personalized learning journey
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="card">
          <form
            noValidate
            aria-label="Sign up form"
            onSubmit={(e): void => {
              void handleSubmit(e);
            }}
          >
            {/* General Error Alert */}
            {errors.general && (
              <div
                aria-live="polite"
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
                role="alert"
              >
                {errors.general}
              </div>
            )}

            {/* Name Field (Optional) */}
            <div className="mb-4">
              <label className="label" htmlFor="name">
                Name{' '}
                <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                aria-describedby="name-description"
                autoComplete="name"
                className="input"
                id="name"
                name="name"
                placeholder="Enter your name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
              />
              <p
                className="mt-1 text-xs text-neutral-500"
                id="name-description"
              >
                This will be displayed on your profile
              </p>
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label className="label" htmlFor="email">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                required
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                autoComplete="email"
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="email-error"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="label" htmlFor="password">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  aria-describedby="password-requirements password-error"
                  aria-invalid={!!errors.password}
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600"
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p
                className="mt-1 text-xs text-neutral-500"
                id="password-requirements"
              >
                Must be at least 8 characters with 1 uppercase letter and 1
                number
              </p>
              {errors.password && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="password-error"
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label className="label" htmlFor="confirmPassword">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  aria-describedby={
                    errors.confirmPassword
                      ? 'confirm-password-error'
                      : undefined
                  }
                  aria-invalid={!!errors.confirmPassword}
                  autoComplete="new-password"
                  className={`input pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600"
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="confirm-password-error"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              aria-busy={isSubmitting}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner className="h-5 w-5 mr-2" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-600">Already have an account? </span>
            <Link
              className="text-primary-600 hover:text-primary-700 font-medium"
              to="/signin"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-primary-200">
          By creating an account, you agree to our{' '}
          <Link className="underline hover:text-white" to="/terms">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link className="underline hover:text-white" to="/privacy">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Eye icon component for showing password.
 *
 * @param {object} props - Component props
 * @param {string} props.className - CSS class name
 * @returns {JSX.Element} SVG eye icon
 */
function EyeIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <path
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

/**
 * Eye off icon component for hiding password.
 *
 * @param {object} props - Component props
 * @param {string} props.className - CSS class name
 * @returns {JSX.Element} SVG eye-off icon
 */
function EyeOffIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

/**
 * Loading spinner component.
 *
 * @param {object} props - Component props
 * @param {string} props.className - CSS class name
 * @returns {JSX.Element} SVG loading spinner
 */
function LoadingSpinner({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
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
  );
}
