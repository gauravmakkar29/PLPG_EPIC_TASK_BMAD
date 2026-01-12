/**
 * @fileoverview Forgot Password page component.
 * Provides password reset request functionality via email.
 *
 * @module @plpg/web/pages/ForgotPassword
 *
 * @description
 * This component handles the forgot password user experience including:
 * - Email input form with validation
 * - Rate limiting awareness (3 requests per hour)
 * - Success/error state handling
 * - Navigation to sign-in page
 *
 * Security Features:
 * - Always shows success message to prevent user enumeration
 * - Rate limiting enforced at API level
 */

import {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  type JSX,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { forgotPassword } from '../services/auth.service';

/**
 * Form data structure for forgot password input.
 */
interface ForgotPasswordFormData {
  email: string;
}

/**
 * Form validation errors structure.
 */
interface FormErrors {
  email?: string;
  general?: string;
}

/**
 * Forgot Password page component.
 * Renders a form for requesting password reset via email.
 *
 * @returns {JSX.Element} Forgot password page component
 */
export function ForgotPassword(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  /**
   * Validates email format.
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
   * Validates all form fields.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
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
      setErrors((prev) => {
        const { general: _, ...rest } = prev;
        return rest;
      });
    }
  };

  /**
   * Handles form submission.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword({ email: formData.email });
      setIsSuccess(true);
    } catch (error) {
      // Check if it's a rate limit error
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      if (errorMessage.includes('Too many')) {
        setErrors({
          general:
            'Too many password reset requests. Please try again after 1 hour.',
        });
      } else {
        // Still show success to prevent user enumeration
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
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
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              If an account exists with{' '}
              <span className="font-medium text-gray-900">{formData.email}</span>
              , you will receive a password reset link shortly.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-center text-sm text-gray-500">
              Didn't receive an email? Check your spam folder or{' '}
              <button
                className="font-medium text-indigo-600 hover:text-indigo-500"
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setFormData({ email: '' });
                }}
              >
                try again
              </button>
            </p>

            <div className="text-center">
              <Link
                className="font-medium text-indigo-600 hover:text-indigo-500"
                to="/sign-in"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {/* Form */}
        <form
          className="mt-8 space-y-6"
          noValidate
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

          <div>
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              autoComplete="email"
              autoFocus
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
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </div>

          {/* Back to Sign In Link */}
          <div className="text-center">
            <Link
              className="font-medium text-indigo-600 hover:text-indigo-500"
              to="/sign-in"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
