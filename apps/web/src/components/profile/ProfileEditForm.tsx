/**
 * @fileoverview Profile edit form component.
 * Allows users to edit their display name.
 *
 * @module @plpg/web/components/profile/ProfileEditForm
 */

import { useState, useCallback } from 'react';
import { useProfile } from '../../hooks/useProfile';

import type { JSX, FormEvent, ChangeEvent } from 'react';

/**
 * Props for the ProfileEditForm component.
 *
 * @interface ProfileEditFormProps
 * @property {string | null} currentName - Current display name (null if not set)
 * @property {() => void} [onSuccess] - Callback when profile is successfully updated
 */
export interface ProfileEditFormProps {
  currentName: string | null;
  onSuccess?: () => void;
}

/**
 * Maximum allowed characters for display name.
 */
const MAX_NAME_LENGTH = 100;

/**
 * Profile edit form component.
 * Provides a form to update the user's display name.
 *
 * @param {ProfileEditFormProps} props - Component props
 * @returns {JSX.Element} Profile edit form
 *
 * @example
 * ```tsx
 * <ProfileEditForm
 *   currentName={user.name}
 *   onSuccess={() => toast('Profile updated!')}
 * />
 * ```
 */
export function ProfileEditForm({
  currentName,
  onSuccess,
}: ProfileEditFormProps): JSX.Element {
  const { updateProfile, isUpdating, reset } = useProfile();

  // Form state
  const [name, setName] = useState<string>(currentName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * Check if the name has been modified from the original.
   */
  const hasChanged = name.trim() !== (currentName ?? '').trim();

  /**
   * Handle name input change.
   */
  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setName(event.target.value);
      setError(null);
      setSuccess(false);
      reset();
    },
    [reset]
  );

  /**
   * Validate the name input.
   *
   * @returns {boolean} True if valid
   */
  const validateName = (): boolean => {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      setError('Name is required');
      return false;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name must be at most ${MAX_NAME_LENGTH} characters`);
      return false;
    }

    return true;
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      setError(null);
      setSuccess(false);

      // Don't submit if nothing changed
      if (!hasChanged) {
        return;
      }

      // Validate
      if (!validateName()) {
        return;
      }

      try {
        await updateProfile({ name: name.trim() });
        setSuccess(true);
        onSuccess?.();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to update profile. Please try again.');
        }
      }
    },
    [name, hasChanged, updateProfile, onSuccess]
  );

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Edit profile form"
      className="space-y-4"
    >
      {/* Name input */}
      <div>
        <label
          htmlFor="profile-name"
          className="block text-sm font-medium text-secondary-700"
        >
          Display Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="profile-name"
            name="name"
            value={name}
            onChange={handleNameChange}
            maxLength={MAX_NAME_LENGTH}
            className={`
              block w-full rounded-md shadow-sm
              ${
                error
                  ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
                  : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
              }
              sm:text-sm
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'name-error' : undefined}
            disabled={isUpdating}
          />
        </div>
        {/* Character count */}
        <p className="mt-1 text-xs text-secondary-500">
          {name.length}/{MAX_NAME_LENGTH} characters
        </p>
        {/* Error message */}
        {error && (
          <p
            id="name-error"
            role="alert"
            className="mt-2 text-sm text-error-600"
          >
            {error}
          </p>
        )}
        {/* Success message */}
        {success && (
          <p role="status" className="mt-2 text-sm text-success-600">
            Saved successfully
          </p>
        )}
      </div>

      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={!hasChanged || isUpdating}
          className={`
            inline-flex justify-center rounded-md border border-transparent
            px-4 py-2 text-sm font-medium text-white shadow-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            ${
              !hasChanged || isUpdating
                ? 'bg-secondary-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }
          `}
          aria-busy={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
