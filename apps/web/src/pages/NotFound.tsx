/**
 * @fileoverview 404 Not Found page component.
 * Displays when a user navigates to a non-existent route.
 *
 * @module @plpg/web/pages/NotFound
 */

import { Link } from 'react-router-dom';

import type { JSX } from 'react';

/**
 * Not Found page component.
 * Provides navigation back to the home page.
 */
export function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-900">404</h1>
        <h2 className="text-2xl font-semibold text-neutral-800 mt-4 mb-2">
          Page Not Found
        </h2>
        <p className="text-neutral-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link className="btn-primary px-6 py-3 rounded-lg" to="/">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
