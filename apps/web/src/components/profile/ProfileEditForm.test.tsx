/**
 * @fileoverview Tests for ProfileEditForm component.
 *
 * @module @plpg/web/components/profile/ProfileEditForm.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileEditForm } from './ProfileEditForm';

// Mock the useProfile hook
const mockUpdateProfile = vi.fn();
const mockReset = vi.fn();

vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({
    updateProfile: mockUpdateProfile,
    isUpdating: false,
    updateError: null,
    isSuccess: false,
    reset: mockReset,
  }),
}));

/**
 * Creates a fresh QueryClient for each test.
 *
 * @returns {QueryClient} New QueryClient instance
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

/**
 * Wrapper component providing necessary context providers.
 *
 * @param {{ children: React.ReactNode }} props - Component props
 * @returns {JSX.Element} Wrapped component
 */
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('ProfileEditForm', () => {
  const defaultProps = {
    currentName: 'John Doe',
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    it('renders the form with correct label', () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    it('displays the current name in the input field', () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      expect(input).toHaveValue('John Doe');
    });

    it('handles null current name', () => {
      render(<ProfileEditForm currentName={null} />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      expect(input).toHaveValue('');
    });

    it('displays character count', () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      expect(screen.getByText('8/100 characters')).toBeInTheDocument();
    });

    it('displays save button', () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('has proper accessibility attributes', () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      const form = screen.getByRole('form', { name: /edit profile form/i });
      expect(form).toBeInTheDocument();

      const input = screen.getByLabelText(/display name/i);
      expect(input).toHaveAttribute('id', 'profile-name');
    });
  });

  describe('Input Validation', () => {
    it('shows error when name is cleared to empty and submitted', async () => {
      render(<ProfileEditForm currentName="John" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, ' ');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('updates character count on input change', async () => {
      render(<ProfileEditForm currentName="" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.type(input, 'Test Name');

      expect(screen.getByText('9/100 characters')).toBeInTheDocument();
    });

    it('sets aria-invalid when there is an error', async () => {
      render(<ProfileEditForm currentName="John" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, ' ');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const inputAfterSubmit = screen.getByLabelText(/display name/i);
        expect(inputAfterSubmit).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Form Submission', () => {
    it('does not submit when name has not changed', async () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).not.toHaveBeenCalled();
      });
    });

    it('calls updateProfile with trimmed name on valid submit', async () => {
      render(<ProfileEditForm currentName="Old Name" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, '  New Name  ');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'New Name' });
      });
    });

    it('calls onSuccess callback on successful update', async () => {
      const onSuccess = vi.fn();
      render(<ProfileEditForm currentName="Old Name" onSuccess={onSuccess} />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('shows success message after successful update', async () => {
      render(<ProfileEditForm currentName="Old Name" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saved successfully')).toBeInTheDocument();
      });
    });

    it('shows error message when update fails', async () => {
      mockUpdateProfile.mockRejectedValueOnce(new Error('Network error'));

      render(<ProfileEditForm currentName="Old Name" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows generic error message for non-Error failures', async () => {
      mockUpdateProfile.mockRejectedValueOnce('Unknown error');

      render(<ProfileEditForm currentName="Old Name" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Button State', () => {
    it('disables save button when name has not changed', () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables save button when name has changed', async () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has accessible form label', () => {
      render(<ProfileEditForm {...defaultProps} />, { wrapper });

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Edit profile form');
    });

    it('associates error message with input via aria-describedby when error occurs', async () => {
      render(<ProfileEditForm currentName="John" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, ' ');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const inputAfterSubmit = screen.getByLabelText(/display name/i);
        expect(inputAfterSubmit).toHaveAttribute('aria-describedby', 'name-error');
      });
    });

    it('error message has role="alert" when validation fails', async () => {
      render(<ProfileEditForm currentName="John" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, ' ');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent('Name is required');
      });
    });

    it('success message has role="status"', async () => {
      render(<ProfileEditForm currentName="Old Name" />, { wrapper });

      const input = screen.getByLabelText(/display name/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const successMessage = screen.getByRole('status');
        expect(successMessage).toHaveTextContent('Saved successfully');
      });
    });
  });
});
