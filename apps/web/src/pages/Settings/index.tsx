/**
 * @fileoverview Settings page component.
 * Main settings hub with navigation to various settings sections.
 *
 * @module @plpg/web/pages/Settings
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import type { JSX } from 'react';

/**
 * Settings menu item configuration.
 *
 * @interface SettingsMenuItem
 * @property {string} title - Display title for the menu item
 * @property {string} description - Brief description of the setting
 * @property {string} path - Navigation path
 * @property {string} icon - Icon character or emoji
 */
interface SettingsMenuItem {
  title: string;
  description: string;
  path: string;
  icon: string;
}

/**
 * Settings menu items configuration.
 */
const settingsMenuItems: SettingsMenuItem[] = [
  {
    title: 'Profile',
    description: 'Manage your display name and profile information',
    path: '/settings/profile',
    icon: 'U',
  },
  {
    title: 'Subscription & Billing',
    description: 'Manage your subscription plan and payment methods',
    path: '/settings/billing',
    icon: '$',
  },
];

/**
 * Settings page component.
 * Displays a list of settings sections the user can navigate to.
 *
 * @returns {JSX.Element} Settings page component
 *
 * @example
 * ```tsx
 * <Route path="/settings" element={<Settings />} />
 * ```
 */
export function Settings(): JSX.Element {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm" role="banner">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
            {user && (
              <span className="text-sm text-secondary-600">{user.email}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8" role="main">
        <nav aria-label="Settings navigation">
          <ul className="space-y-4">
            {settingsMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={`Navigate to ${item.title} settings`}
                >
                  <div className="flex items-center">
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="text-xl font-bold text-primary-600">
                        {item.icon}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="ml-4 flex-1">
                      <h2 className="text-lg font-semibold text-secondary-900">
                        {item.title}
                      </h2>
                      <p className="text-sm text-secondary-600 mt-1">
                        {item.description}
                      </p>
                    </div>
                    {/* Arrow */}
                    <div className="flex-shrink-0 ml-4" aria-hidden="true">
                      <svg
                        className="w-5 h-5 text-secondary-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Back to Dashboard link */}
        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Settings;
