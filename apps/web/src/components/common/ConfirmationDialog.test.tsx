/**
 * @fileoverview Unit tests for ConfirmationDialog component.
 *
 * @module @plpg/web/components/common/ConfirmationDialog.test
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Confirmation dialog appears before save
 * - Test confirmation dialog renders in settings
 * - Test cancel returns without changes
 * - Test confirm triggers roadmap regeneration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmationDialog } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Dialog',
    children: <p>Test content</p>,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up portal elements
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach((dialog) => dialog.remove());
  });

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when isOpen is true', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays custom button labels', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        confirmLabel="Yes, Update"
        cancelLabel="No, Go Back"
      />
    );

    expect(screen.getByText('Yes, Update')).toBeInTheDocument();
    expect(screen.getByText('No, Go Back')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);

    await user.click(screen.getByTestId('confirmation-dialog-confirm-button'));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);

    await user.click(screen.getByTestId('confirmation-dialog-cancel-button'));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', async () => {
    render(<ConfirmationDialog {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when Escape is pressed during loading', async () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationDialog {...defaultProps} />);

    // Click on the backdrop (the fixed overlay with bg-opacity-75)
    const backdrop = document.querySelector('.bg-secondary-900');
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('confirmation-dialog-confirm-button')).toBeDisabled();
    expect(screen.getByTestId('confirmation-dialog-cancel-button')).toBeDisabled();
  });

  it('applies warning variant styles', () => {
    render(<ConfirmationDialog {...defaultProps} variant="warning" />);

    const confirmButton = screen.getByTestId('confirmation-dialog-confirm-button');
    expect(confirmButton.className).toContain('bg-yellow-600');
  });

  it('applies danger variant styles', () => {
    render(<ConfirmationDialog {...defaultProps} variant="danger" />);

    const confirmButton = screen.getByTestId('confirmation-dialog-confirm-button');
    expect(confirmButton.className).toContain('bg-red-600');
  });

  it('uses custom testId', () => {
    render(<ConfirmationDialog {...defaultProps} testId="my-dialog" />);

    expect(screen.getByTestId('my-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('my-dialog-confirm-button')).toBeInTheDocument();
    expect(screen.getByTestId('my-dialog-cancel-button')).toBeInTheDocument();
  });

  it('handles async onConfirm function', async () => {
    const asyncConfirm = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    render(<ConfirmationDialog {...defaultProps} onConfirm={asyncConfirm} />);

    fireEvent.click(screen.getByTestId('confirmation-dialog-confirm-button'));

    await waitFor(() => {
      expect(asyncConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('prevents body scroll when open', () => {
    render(<ConfirmationDialog {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<ConfirmationDialog {...defaultProps} />);

    rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);

    expect(document.body.style.overflow).toBe('');
  });
});
