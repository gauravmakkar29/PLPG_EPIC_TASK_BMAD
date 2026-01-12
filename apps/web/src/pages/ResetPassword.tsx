/**
 * @fileoverview Reset Password page component.
 * Allows users to set a new password using a reset token from email.
 *
 * @module @plpg/web/pages/ResetPassword
 *
 * @description
 * This component handles the password reset user experience including:
 * - Token validation on page load
 * - New password input with confirmation
 * - Password strength validation
 * - Success/error state handling
 * - Redirect to sign-in on success
 *
 * Security Features:
 * - Token validated before showing form
 * - Password strength requirements enforced
 * - Token consumed on successful reset
 */

import {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  type JSX,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateResetToken, resetPassword } from '../services/auth.service';

/**
 * Form data structure for reset password inputs.
 */
interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Form validation errors structure.
 */
interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Page states for the reset password flow.
 */
type PageState = 'loading' | 'invalid' | 'form' | 'success';

/**
 * Password requirements for display.
 */
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', regex: /.{8,}/ },
  { id: 'uppercase', label: 'One uppercase letter', regex: /[A-Z]/ },
  { id: 'lowercase', label: 'One lowercase letter', regex: /[a-z]/ },
  { id: 'number', label: 'One number', regex: /[0-9]/ },
  { id: 'special', label: 'One special character', regex: /[^A-Za-z0-9]/ },
];

/**
 * Reset Password page component.
 * Renders a form for setting a new password using a reset token.
 *
 * @returns {JSX.Element} Reset password page component
 */
export function ResetPassword(): JSX.Element {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Validate token on mount
  useEffect(() => {
    async function checkToken(): Promise<void> {
      if (!token) {
        setPageState('invalid');
        return;
      }

      try {
        const result = await validateResetToken(token);
        setPageState(result.valid ? 'form' : 'invalid');
      } catch {
        setPageState('invalid');
      }
    }

    void checkToken();
  }, [token]);

  /**
   * Validates password strength.
   */
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return undefined;
  };

  /**
   * Validates all form fields.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles input field changes.
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  /**
   * Handles form submission.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrors({});

    if (!validateForm() || !token) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({
        token,
        password: formData.password,
      });
      setPageState('success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      if (
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid')
      ) {
        setPageState('invalid');
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Checks if a password requirement is met.
   */
  const isRequirementMet = (regex: RegExp): boolean => {
    return regex.test(formData.password);
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            aria-hidden="true"
            className="mx-auto h-12 w-12 animate-spin text-indigo-600"
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
          <p className="mt-4 text-gray-600">Validating your reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (pageState === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                aria-hidden="true"
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Invalid or expired link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>

          <div className="text-center">
            <Link
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              to="/forgot-password"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                aria-hidden="true"
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Password reset successful
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been reset successfully. You can now sign in
              with your new password.
            </p>
          </div>

          <div className="text-center">
            <Link
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              to="/sign-in"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {/* Form */}
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

          <div className="space-y-4">
            {/* New Password Field */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                New Password
              </label>
              <input
                autoComplete="new-password"
                autoFocus
                className={`mt-1 block w-full appearance-none rounded-md border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm`}
                id="password"
                name="password"
                placeholder="Enter new password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}

              {/* Password Requirements */}
              <div className="mt-3 space-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center text-xs ${
                      formData.password
                        ? isRequirementMet(req.regex)
                          ? 'text-green-600'
                          : 'text-gray-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {formData.password && isRequirementMet(req.regex) ? (
                      <svg
                        aria-hidden="true"
                        className="mr-1 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      </svg>
                    )}
                    {req.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                autoComplete="new-password"
                className={`mt-1 block w-full appearance-none rounded-md border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm`}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm new password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
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
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
