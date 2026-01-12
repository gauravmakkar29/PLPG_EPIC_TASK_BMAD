/**
 * @fileoverview Unit tests for Step1CurrentRole component.
 * Tests the current role selection functionality in the onboarding flow.
 *
 * @module @plpg/web/components/onboarding/Step1CurrentRole.test
 *
 * @requirements
 * - AIRE-234: Story 2.2 - Step 1 Current Role Selection
 * - Test dropdown renders all role options
 * - Test Next button is disabled initially
 * - Test Next button enables after selection
 * - Test selection calls save API
 * - Test Other option shows text input
 * - Test visual feedback on selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1CurrentRole } from './Step1CurrentRole';
import type { OnboardingStep1Data } from '@plpg/shared';

describe('Step1CurrentRole', () => {
  // Mock callbacks
  const mockOnSelectionChange = vi.fn();
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Dropdown renders all role options
   *
   * @requirement AIRE-234 - Dropdown/select with predefined roles
   */
  describe('renders all role options', () => {
    it('should render all 6 predefined role cards', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      // Check all role cards are present
      expect(screen.getByTestId('role-card-backend_developer')).toBeInTheDocument();
      expect(screen.getByTestId('role-card-devops_engineer')).toBeInTheDocument();
      expect(screen.getByTestId('role-card-data_analyst')).toBeInTheDocument();
      expect(screen.getByTestId('role-card-qa_engineer')).toBeInTheDocument();
      expect(screen.getByTestId('role-card-it_professional')).toBeInTheDocument();
      expect(screen.getByTestId('role-card-other')).toBeInTheDocument();
    });

    it('should display correct role labels', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      expect(screen.getByText('DevOps Engineer')).toBeInTheDocument();
      expect(screen.getByText('Data Analyst')).toBeInTheDocument();
      expect(screen.getByText('QA Engineer')).toBeInTheDocument();
      expect(screen.getByText('IT Professional')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should display role descriptions', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      expect(screen.getByText('Building server-side applications and APIs')).toBeInTheDocument();
      expect(screen.getByText('Managing infrastructure and deployment pipelines')).toBeInTheDocument();
      expect(screen.getByText('Analyzing data and creating insights')).toBeInTheDocument();
      expect(screen.getByText('Ensuring software quality through testing')).toBeInTheDocument();
      expect(screen.getByText('Managing IT systems and infrastructure')).toBeInTheDocument();
      expect(screen.getByText('A different technical role')).toBeInTheDocument();
    });
  });

  /**
   * Test: Next button is disabled initially
   *
   * @requirement AIRE-234 - Next button enabled only after selection
   */
  describe('Next button initial state', () => {
    it('should have Next button disabled when no selection is made', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();
    });

    it('should have Next button with correct text', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      expect(screen.getByTestId('next-button')).toHaveTextContent('Next');
    });
  });

  /**
   * Test: Next button enables after selection
   *
   * @requirement AIRE-234 - Next button enabled only after selection
   */
  describe('Next button enables after selection', () => {
    it('should enable Next button after selecting a role', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const roleCard = screen.getByTestId('role-card-backend_developer');
      await user.click(roleCard);

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeEnabled();
    });

    it('should call onNext when Next button is clicked after selection', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-data_analyst'));
      await user.click(screen.getByTestId('next-button'));

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Selection calls save API
   *
   * @requirement AIRE-234 - Selection saved immediately
   */
  describe('selection triggers save callback', () => {
    it('should call onSelectionChange when a role is selected', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-devops_engineer'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        currentRole: 'devops_engineer',
        customRoleText: undefined,
      });
    });

    it('should call onSelectionChange with each selection change', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-backend_developer'));
      await user.click(screen.getByTestId('role-card-qa_engineer'));

      expect(mockOnSelectionChange).toHaveBeenCalledTimes(2);
      expect(mockOnSelectionChange).toHaveBeenLastCalledWith({
        currentRole: 'qa_engineer',
        customRoleText: undefined,
      });
    });
  });

  /**
   * Test: Other option shows text input
   *
   * @requirement AIRE-234 - Other option shows text input
   */
  describe('Other option shows text input', () => {
    it('should not show text input initially', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      expect(screen.queryByTestId('custom-role-input-container')).not.toBeInTheDocument();
    });

    it('should show text input when Other is selected', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-other'));

      expect(screen.getByTestId('custom-role-input-container')).toBeInTheDocument();
      expect(screen.getByTestId('custom-role-input')).toBeInTheDocument();
    });

    it('should have Next button disabled when Other is selected without text', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-other'));

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button when Other is selected with valid text', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-other'));
      await user.type(screen.getByTestId('custom-role-input'), 'Software Architect');

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeEnabled();
    });

    it('should show error when custom role text is too short', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-other'));
      await user.type(screen.getByTestId('custom-role-input'), 'A');

      expect(screen.getByTestId('custom-role-error')).toBeInTheDocument();
      expect(screen.getByText('Please enter at least 2 characters')).toBeInTheDocument();
    });

    it('should call onSelectionChange with custom role text', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-other'));
      await user.type(screen.getByTestId('custom-role-input'), 'PM');

      // First call is from selecting "other"
      // Subsequent calls are from typing
      const calls = mockOnSelectionChange.mock.calls;
      const lastCall = calls[calls.length - 1][0] as OnboardingStep1Data;

      expect(lastCall.currentRole).toBe('other');
      expect(lastCall.customRoleText).toBe('PM');
    });
  });

  /**
   * Test: Visual feedback on selection
   *
   * @requirement AIRE-234 - Visual feedback on selection
   */
  describe('visual feedback on selection', () => {
    it('should add selected class to clicked role card', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const roleCard = screen.getByTestId('role-card-backend_developer');
      await user.click(roleCard);

      expect(roleCard).toHaveClass('role-card--selected');
    });

    it('should remove selected class from previously selected card', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const firstCard = screen.getByTestId('role-card-backend_developer');
      const secondCard = screen.getByTestId('role-card-qa_engineer');

      await user.click(firstCard);
      expect(firstCard).toHaveClass('role-card--selected');

      await user.click(secondCard);
      expect(firstCard).not.toHaveClass('role-card--selected');
      expect(secondCard).toHaveClass('role-card--selected');
    });

    it('should have aria-checked attribute for accessibility', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const roleCard = screen.getByTestId('role-card-backend_developer');
      expect(roleCard).toHaveAttribute('aria-checked', 'false');

      await user.click(roleCard);
      expect(roleCard).toHaveAttribute('aria-checked', 'true');
    });
  });

  /**
   * Test: Initial data hydration
   */
  describe('initial data hydration', () => {
    it('should pre-select role from initial data', () => {
      render(
        <Step1CurrentRole
          initialData={{ currentRole: 'data_analyst' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const roleCard = screen.getByTestId('role-card-data_analyst');
      expect(roleCard).toHaveClass('role-card--selected');
    });

    it('should show custom role text input when initial data has other role', () => {
      render(
        <Step1CurrentRole
          initialData={{ currentRole: 'other', customRoleText: 'Project Manager' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      expect(screen.getByTestId('custom-role-input-container')).toBeInTheDocument();
      expect(screen.getByTestId('custom-role-input')).toHaveValue('Project Manager');
    });

    it('should have Next button enabled with valid initial data', () => {
      render(
        <Step1CurrentRole
          initialData={{ currentRole: 'backend_developer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeEnabled();
    });
  });

  /**
   * Test: Loading states
   */
  describe('loading states', () => {
    it('should disable all role cards when loading', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('role-card-backend_developer')).toBeDisabled();
      expect(screen.getByTestId('role-card-qa_engineer')).toBeDisabled();
    });

    it('should show Loading text on Next button when loading', () => {
      render(
        <Step1CurrentRole
          initialData={{ currentRole: 'backend_developer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('next-button')).toHaveTextContent('Loading...');
    });

    it('should show saving indicator when isSaving is true', () => {
      render(
        <Step1CurrentRole
          initialData={{ currentRole: 'backend_developer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          isSaving={true}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  /**
   * Test: Single selection behavior
   *
   * @requirement AIRE-234 - Single selection required
   */
  describe('single selection behavior', () => {
    it('should only allow one selection at a time', async () => {
      const user = userEvent.setup();

      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      await user.click(screen.getByTestId('role-card-backend_developer'));
      await user.click(screen.getByTestId('role-card-qa_engineer'));

      const backendCard = screen.getByTestId('role-card-backend_developer');
      const qaCard = screen.getByTestId('role-card-qa_engineer');

      expect(backendCard).not.toHaveClass('role-card--selected');
      expect(qaCard).toHaveClass('role-card--selected');
      expect(backendCard).toHaveAttribute('aria-checked', 'false');
      expect(qaCard).toHaveAttribute('aria-checked', 'true');
    });
  });

  /**
   * Test: Accessibility
   */
  describe('accessibility', () => {
    it('should have proper role="radiogroup" on container', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should have proper role="radio" on cards', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(6);
    });

    it('should have proper aria-label on radiogroup', () => {
      render(
        <Step1CurrentRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
        />
      );

      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-label',
        'Select your current role'
      );
    });
  });
});
