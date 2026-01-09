/**
 * @fileoverview Profile settings page component.
 * Displays user profile information and allows editing.
 *
 * @module @plpg/web/pages/Settings/Profile
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../hooks/useSession';
import { ProfileEditForm } from '../../components/profile/ProfileEditForm';

import type { JSX } from 'react';

/**
 * Formats a date string into a human-readable format.
 *
 * @param {string | undefined} dateString - ISO date string
 * @returns {string} Formatted date or 'Unknown'
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Gets user initials from name or email.
 *
 * @param {string | null} name - User's display name
 * @param {string} email - User's email
 * @returns {string} Single initial character
 */
function getInitial(name: string | null, email: string): string {
  if (name && name.length > 0) {
    return name.charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

/**
 * Gets the subscription badge configuration.
 *
 * @param {string} status - Subscription status ('free', 'trial', 'pro')
 * @returns {{ label: string; className: string }} Badge config
 */
function getSubscriptionBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'pro':
      return { label: 'Pro', className: 'bg-primary-600 text-white' };
    case 'trial':
      return { label: 'Trial', className: 'bg-amber-500 text-white' };
    default:
      return { label: 'Free', className: 'bg-secondary-200 text-secondary-700' };
  }
}

/**
 * Profile page component.
 * Displays user profile information and provides editing capabilities.
 *
 * @returns {JSX.Element} Profile page component
 *
 * @example
 * ```tsx
 * <Route path="/settings/profile" element={<ProfilePage />} />
 * ```
 */
export function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: session, isLoading: sessionLoading } = useSession();

  // Show loading state
  if (authLoading || sessionLoading) {
    return (
      <div
        className="min-h-screen bg-secondary-50 flex items-center justify-center"
        role="status"
        aria-label="Loading profile"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-secondary-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Derive subscription status from role
  const subscriptionStatus = session?.role === 'pro' ? 'pro' :
    session?.trialEndsAt && new Date(session.trialEndsAt) > new Date() ? 'trial' : 'free';
  const badge = getSubscriptionBadge(subscriptionStatus);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm" role="banner">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {/* Back button */}
            <button
              onClick={() => navigate('/settings')}
              className="mr-4 p-2 rounded-md hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Back to settings"
            >
              <svg
                className="w-5 h-5 text-secondary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8" role="main">
        {/* Profile Information Section */}
        <section
          aria-labelledby="profile-info-heading"
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
          role="region"
        >
          <h2
            id="profile-info-heading"
            className="text-lg font-semibold text-secondary-900 mb-4"
          >
            Profile Information
          </h2>

          <div className="flex items-center">
            {/* Avatar */}
            <div
              className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              {session?.avatarUrl ? (
                <img
                  src={session.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary-600">
                  {getInitial(session?.name ?? null, session?.email ?? user?.email ?? '')}
                </span>
              )}
            </div>

            {/* User info */}
            <div className="ml-4 flex-1">
              <div className="flex items-center">
                <p className="text-lg font-medium text-secondary-900">
                  {session?.name || user?.name || 'No name set'}
                </p>
                {/* Subscription badge */}
                <span
                  className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-sm text-secondary-600">
                {session?.email || user?.email}
              </p>
            </div>
          </div>

          {/* Account created date */}
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <p className="text-sm text-secondary-600">
              <span className="font-medium">Account Created</span>
              <span className="ml-2">
                {formatDate(session?.createdAt)}
              </span>
            </p>
          </div>

          {/* Trial end info for trial users */}
          {subscriptionStatus === 'trial' && session?.trialEndsAt && (
            <div className="mt-4 p-4 bg-amber-50 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Trial ends:</span>{' '}
                {formatDate(session.trialEndsAt)}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Upgrade to Pro to continue after your trial ends
              </p>
            </div>
          )}
        </section>

        {/* Edit Profile Section */}
        <section
          aria-labelledby="edit-profile-heading"
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
          role="region"
        >
          <h2
            id="edit-profile-heading"
            className="text-lg font-semibold text-secondary-900 mb-4"
          >
            Edit Profile
          </h2>

          <ProfileEditForm
            currentName={session?.name ?? user?.name ?? null}
            onSuccess={() => {
              // Optionally show a toast or notification
            }}
          />
        </section>

        {/* Billing Section */}
        <section
          aria-labelledby="billing-heading"
          className="bg-white rounded-lg shadow-sm p-6"
          role="region"
        >
          <h2
            id="billing-heading"
            className="text-lg font-semibold text-secondary-900 mb-4"
          >
            Subscription & Billing
          </h2>

          <p className="text-sm text-secondary-600 mb-4">
            Manage your subscription plan and payment methods.
          </p>

          <button
            onClick={() => navigate('/settings/billing')}
            className="inline-flex items-center px-4 py-2 border border-secondary-300 rounded-md text-sm font-medium text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="Navigate to billing settings"
          >
            Manage Billing
            <svg
              className="ml-2 w-4 h-4"
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
          </button>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
