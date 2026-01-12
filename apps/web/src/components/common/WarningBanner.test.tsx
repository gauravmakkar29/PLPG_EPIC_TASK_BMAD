/**
 * @fileoverview Unit tests for WarningBanner component.
 *
 * @module @plpg/web/components/common/WarningBanner.test
 *
 * @requirements
 * - AIRE-239: Story 2.7 - Warning message displays before regeneration
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WarningBanner } from './WarningBanner';

describe('WarningBanner', () => {
  it('renders with default warning variant', () => {
    render(
      <WarningBanner>
        <p>Test warning message</p>
      </WarningBanner>
    );

    expect(screen.getByText('Test warning message')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with title when provided', () => {
    render(
      <WarningBanner title="Important Notice">
        <p>Test content</p>
      </WarningBanner>
    );

    expect(screen.getByText('Important Notice')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies warning variant styles', () => {
    render(
      <WarningBanner variant="warning" testId="warning-test">
        <p>Warning content</p>
      </WarningBanner>
    );

    const banner = screen.getByTestId('warning-test');
    expect(banner.className).toContain('bg-yellow-50');
    expect(banner.className).toContain('border-yellow-400');
  });

  it('applies info variant styles', () => {
    render(
      <WarningBanner variant="info" testId="info-test">
        <p>Info content</p>
      </WarningBanner>
    );

    const banner = screen.getByTestId('info-test');
    expect(banner.className).toContain('bg-blue-50');
    expect(banner.className).toContain('border-blue-400');
  });

  it('applies error variant styles', () => {
    render(
      <WarningBanner variant="error" testId="error-test">
        <p>Error content</p>
      </WarningBanner>
    );

    const banner = screen.getByTestId('error-test');
    expect(banner.className).toContain('bg-red-50');
    expect(banner.className).toContain('border-red-400');
  });

  it('shows dismiss button when dismissible is true', () => {
    render(
      <WarningBanner dismissible testId="dismissible-test">
        <p>Dismissible content</p>
      </WarningBanner>
    );

    expect(screen.getByTestId('dismissible-test-dismiss-button')).toBeInTheDocument();
  });

  it('does not show dismiss button when dismissible is false', () => {
    render(
      <WarningBanner dismissible={false} testId="not-dismissible-test">
        <p>Not dismissible content</p>
      </WarningBanner>
    );

    expect(screen.queryByTestId('not-dismissible-test-dismiss-button')).not.toBeInTheDocument();
  });

  it('calls onDismiss and hides when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <WarningBanner dismissible onDismiss={onDismiss} testId="dismiss-test">
        <p>Dismissible content</p>
      </WarningBanner>
    );

    await user.click(screen.getByTestId('dismiss-test-dismiss-button'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Dismissible content')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <WarningBanner className="custom-class" testId="custom-class-test">
        <p>Custom class content</p>
      </WarningBanner>
    );

    const banner = screen.getByTestId('custom-class-test');
    expect(banner.className).toContain('custom-class');
  });

  it('uses custom testId', () => {
    render(
      <WarningBanner testId="my-banner" title="Test Title">
        <p>Test content</p>
      </WarningBanner>
    );

    expect(screen.getByTestId('my-banner')).toBeInTheDocument();
    expect(screen.getByTestId('my-banner-title')).toBeInTheDocument();
    expect(screen.getByTestId('my-banner-content')).toBeInTheDocument();
  });

  it('has correct ARIA role for warning variant', () => {
    render(
      <WarningBanner variant="warning">
        <p>Warning content</p>
      </WarningBanner>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has alert role for error variant', () => {
    render(
      <WarningBanner variant="error">
        <p>Error content</p>
      </WarningBanner>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(
      <WarningBanner>
        <div data-testid="child-element">
          <span>Nested content</span>
        </div>
      </WarningBanner>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });
});
