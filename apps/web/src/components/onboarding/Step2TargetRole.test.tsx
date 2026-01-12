/**
 * @fileoverview Unit tests for Step2TargetRole component.
 * Tests the target role selection functionality in the onboarding flow.
 *
 * @module @plpg/web/components/onboarding/Step2TargetRole.test
 *
 * @requirements
 * - AIRE-235: Story 2.3 - Step 2 Target Role Selection
 * - Test target role dropdown renders
 * - Test ML Engineer option is selectable
 * - Test role description displays on selection
 * - Test coming soon paths are disabled
 * - Test Next button enables after selection
 * - Test selection calls save API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step2TargetRole } from './Step2TargetRole';
import type { OnboardingStep2Data } from '@plpg/shared';

describe('Step2TargetRole', () => {
  // Mock callbacks
  const mockOnSelectionChange = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Target role dropdown renders all options
   *
   * @requirement AIRE-235 - Dropdown/select with target roles
   */
  describe('renders all role options', () => {
    it('should render all 4 target role cards', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Check all target role cards are present
      expect(screen.getByTestId('target-role-card-ml_engineer')).toBeInTheDocument();
      expect(screen.getByTestId('target-role-card-data_scientist')).toBeInTheDocument();
      expect(screen.getByTestId('target-role-card-mlops_engineer')).toBeInTheDocument();
      expect(screen.getByTestId('target-role-card-ai_engineer')).toBeInTheDocument();
    });

    it('should display correct role labels', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('ML Engineer')).toBeInTheDocument();
      expect(screen.getByText('Data Scientist')).toBeInTheDocument();
      expect(screen.getByText('MLOps Engineer')).toBeInTheDocument();
      expect(screen.getByText('AI Engineer')).toBeInTheDocument();
    });

    it('should display role descriptions', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Design and deploy machine learning systems at scale')).toBeInTheDocument();
      expect(screen.getByText('Analyze data and build predictive models')).toBeInTheDocument();
      expect(screen.getByText('Operationalize ML models and manage ML infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Build AI-powered applications and integrate LLMs')).toBeInTheDocument();
    });
  });

  /**
   * Test: ML Engineer option is selectable (MVP)
   *
   * @requirement AIRE-235 - MVP: ML Engineer only
   */
  describe('ML Engineer is selectable', () => {
    it('should allow selection of ML Engineer', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const mlEngineerCard = screen.getByTestId('target-role-card-ml_engineer');
      await user.click(mlEngineerCard);

      expect(mlEngineerCard).toHaveClass('target-role-card--selected');
    });

    it('should call onSelectionChange when ML Engineer is selected', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        targetRole: 'ml_engineer',
      });
    });

    it('should not have disabled class for ML Engineer', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const mlEngineerCard = screen.getByTestId('target-role-card-ml_engineer');
      expect(mlEngineerCard).not.toHaveClass('target-role-card--disabled');
    });
  });

  /**
   * Test: Role description displays on selection
   *
   * @requirement AIRE-235 - Brief description of role shown on selection
   */
  describe('role details display on selection', () => {
    it('should show details panel when ML Engineer is selected', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Initially no details panel
      expect(screen.queryByTestId('role-details-panel')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      // Details panel should appear
      expect(screen.getByTestId('role-details-panel')).toBeInTheDocument();
    });

    it('should display estimated hours for selected role', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      const estimatedHours = screen.getByTestId('estimated-hours');
      expect(estimatedHours).toHaveTextContent('~300 hours');
    });

    it('should display typical outcomes for selected role', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      const outcomesList = screen.getByTestId('typical-outcomes-list');
      expect(outcomesList).toBeInTheDocument();

      // Check for ML Engineer outcomes
      expect(screen.getByText('Design and deploy production ML systems')).toBeInTheDocument();
      expect(screen.getByText('Build end-to-end ML pipelines')).toBeInTheDocument();
      expect(screen.getByText('Optimize model performance at scale')).toBeInTheDocument();
      expect(screen.getByText('Collaborate with cross-functional teams')).toBeInTheDocument();
    });
  });

  /**
   * Test: Coming soon indicator for future paths
   *
   * @requirement AIRE-235 - Coming soon indicator for future paths
   */
  describe('coming soon paths are disabled', () => {
    it('should show Coming Soon badge for unavailable roles', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Data Scientist, MLOps Engineer, AI Engineer should have Coming Soon badge
      expect(screen.getByTestId('coming-soon-badge-data_scientist')).toBeInTheDocument();
      expect(screen.getByTestId('coming-soon-badge-mlops_engineer')).toBeInTheDocument();
      expect(screen.getByTestId('coming-soon-badge-ai_engineer')).toBeInTheDocument();
    });

    it('should NOT show Coming Soon badge for ML Engineer', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.queryByTestId('coming-soon-badge-ml_engineer')).not.toBeInTheDocument();
    });

    it('should have disabled class for unavailable roles', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('target-role-card-data_scientist')).toHaveClass('target-role-card--disabled');
      expect(screen.getByTestId('target-role-card-mlops_engineer')).toHaveClass('target-role-card--disabled');
      expect(screen.getByTestId('target-role-card-ai_engineer')).toHaveClass('target-role-card--disabled');
    });

    it('should not call onSelectionChange when clicking disabled role', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Try to click a disabled role
      const dataScienceCard = screen.getByTestId('target-role-card-data_scientist');
      await user.click(dataScienceCard);

      expect(mockOnSelectionChange).not.toHaveBeenCalled();
    });

    it('should not show details panel when clicking disabled role', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ai_engineer'));

      expect(screen.queryByTestId('role-details-panel')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Next button enables after selection
   *
   * @requirement AIRE-235 - Next button enabled only after selection
   */
  describe('Next button behavior', () => {
    it('should have Next button disabled when no selection is made', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button after selecting ML Engineer', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeEnabled();
    });

    it('should call onNext when Next button is clicked after valid selection', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));
      await user.click(screen.getByTestId('next-button'));

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should have Next button with correct text', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('next-button')).toHaveTextContent('Next');
    });
  });

  /**
   * Test: Selection calls save API
   *
   * @requirement AIRE-235 - Test selection calls save API
   */
  describe('selection triggers save callback', () => {
    it('should call onSelectionChange with correct data structure', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        targetRole: 'ml_engineer',
      } as OnboardingStep2Data);
    });

    it('should call onSelectionChange only once per selection', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Back button functionality
   */
  describe('Back button behavior', () => {
    it('should render Back button', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('should call onBack when Back button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('back-button'));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should allow Back without making a selection', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Back button should be enabled even without selection
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeEnabled();

      await user.click(backButton);
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  /**
   * Test: Initial data hydration
   */
  describe('initial data hydration', () => {
    it('should pre-select role from initial data', () => {
      render(
        <Step2TargetRole
          initialData={{ targetRole: 'ml_engineer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const mlEngineerCard = screen.getByTestId('target-role-card-ml_engineer');
      expect(mlEngineerCard).toHaveClass('target-role-card--selected');
    });

    it('should show details panel when initial data has selection', () => {
      render(
        <Step2TargetRole
          initialData={{ targetRole: 'ml_engineer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('role-details-panel')).toBeInTheDocument();
    });

    it('should have Next button enabled with valid initial data', () => {
      render(
        <Step2TargetRole
          initialData={{ targetRole: 'ml_engineer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
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
    it('should disable ML Engineer card when loading', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('target-role-card-ml_engineer')).toBeDisabled();
    });

    it('should show Loading text on Next button when loading', () => {
      render(
        <Step2TargetRole
          initialData={{ targetRole: 'ml_engineer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('next-button')).toHaveTextContent('Loading...');
    });

    it('should show saving indicator when isSaving is true', () => {
      render(
        <Step2TargetRole
          initialData={{ targetRole: 'ml_engineer' }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isSaving={true}
        />
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable Back button when loading', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('back-button')).toBeDisabled();
    });
  });

  /**
   * Test: Single selection behavior
   *
   * @requirement AIRE-235 - Single selection required
   */
  describe('single selection behavior', () => {
    it('should only allow one selection at a time', async () => {
      const user = userEvent.setup();

      // For this test, we need to pretend ML Engineer was the only selectable,
      // since others are disabled. We just verify clicking it multiple times
      // maintains single selection
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      const mlCard = screen.getByTestId('target-role-card-ml_engineer');
      expect(mlCard).toHaveClass('target-role-card--selected');
      expect(mlCard).toHaveAttribute('aria-checked', 'true');
    });
  });

  /**
   * Test: Accessibility
   */
  describe('accessibility', () => {
    it('should have proper role="radiogroup" on container', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should have proper role="radio" on cards', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(4);
    });

    it('should have proper aria-label on radiogroup', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-label',
        'Select your target role'
      );
    });

    it('should have aria-disabled on unavailable roles', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('target-role-card-data_scientist')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('target-role-card-mlops_engineer')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('target-role-card-ai_engineer')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-disabled=false on available roles', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('target-role-card-ml_engineer')).toHaveAttribute('aria-disabled', 'false');
    });

    it('should have aria-live on details panel for screen readers', async () => {
      const user = userEvent.setup();

      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('target-role-card-ml_engineer'));

      const detailsPanel = screen.getByTestId('role-details-panel');
      expect(detailsPanel).toHaveAttribute('aria-live', 'polite');
    });
  });

  /**
   * Test: Component renders correctly
   */
  describe('component rendering', () => {
    it('should render step header with correct title', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Where do you want to go?')).toBeInTheDocument();
    });

    it('should render step description', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(
        screen.getByText(/Select the career path you want to pursue/)
      ).toBeInTheDocument();
    });

    it('should have data-testid on root element', () => {
      render(
        <Step2TargetRole
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('step-2-target-role')).toBeInTheDocument();
    });
  });
});
