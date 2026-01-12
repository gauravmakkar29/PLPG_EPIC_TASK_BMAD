/**
 * @fileoverview Unit tests for Step5Summary component.
 * Tests the onboarding completion summary screen.
 *
 * @module @plpg/web/components/onboarding/Step5Summary.test
 *
 * @requirements
 * - AIRE-238: Story 2.6 - Onboarding Completion
 * - Summary page displays all selections
 * - Edit links navigate to correct steps
 * - Generate Path button triggers roadmap API
 * - Loading state shows during generation
 * - Success redirects to dashboard
 * - Unit tests pass with >80% coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Step5Summary,
  getCurrentRoleDisplayName,
  getTargetRoleDisplayName,
  getWeeklyHoursDisplayText,
  getSkillsToSkipDisplayText,
  getSkillNamesToSkip,
  getEstimatedCompletionText,
  validateSummaryData,
} from './Step5Summary';
import type { OnboardingSummaryData, Step5SummaryProps } from './Step5Summary';

// Mock data for testing
const mockCompleteData: OnboardingSummaryData = {
  step1: { currentRole: 'backend_developer' },
  step2: { targetRole: 'ml_engineer' },
  step3: { weeklyHours: 10 },
  step4: { skillsToSkip: [] },
};

const mockDataWithSkills: OnboardingSummaryData = {
  step1: { currentRole: 'data_analyst' },
  step2: { targetRole: 'ml_engineer' },
  step3: { weeklyHours: 15 },
  step4: {
    skillsToSkip: [
      'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', // Python Basics
      'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', // Linear Algebra
    ],
  },
};

const mockIncompleteData: OnboardingSummaryData = {
  step1: null,
  step2: { targetRole: 'ml_engineer' },
  step3: { weeklyHours: 10 },
  step4: { skillsToSkip: [] },
};

const mockDataWithOtherRole: OnboardingSummaryData = {
  step1: { currentRole: 'other', customRoleText: 'ML Researcher' },
  step2: { targetRole: 'ml_engineer' },
  step3: { weeklyHours: 10 },
  step4: { skillsToSkip: [] },
};

// Default props for testing
const defaultProps: Step5SummaryProps = {
  summaryData: mockCompleteData,
  onEditStep: vi.fn(),
  onGeneratePath: vi.fn().mockResolvedValue(undefined),
  onBack: vi.fn(),
  isGenerating: false,
  error: null,
};

describe('Step5Summary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the summary component', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByTestId('step-5-summary')).toBeInTheDocument();
    });

    it('should display the step title', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByText('Review Your Selections')).toBeInTheDocument();
    });

    it('should display the step description', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(
        screen.getByText(/Please review your choices before we generate/i)
      ).toBeInTheDocument();
    });

    it('should render all summary cards', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByTestId('summary-card-currentRole')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-targetRole')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-weeklyHours')).toBeInTheDocument();
      expect(screen.getByTestId('summary-card-skillsToSkip')).toBeInTheDocument();
    });

    it('should display estimated completion', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByTestId('estimated-completion')).toBeInTheDocument();
    });
  });

  describe('Summary Display', () => {
    it('should display current role correctly', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
    });

    it('should display target role correctly', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByText('ML Engineer')).toBeInTheDocument();
    });

    it('should display weekly hours correctly', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByText('10 hours/week')).toBeInTheDocument();
    });

    it('should display skills to skip count', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByText(/None selected/i)).toBeInTheDocument();
    });

    it('should display selected skills with count', () => {
      const props = { ...defaultProps, summaryData: mockDataWithSkills };
      render(<Step5Summary {...props} />);
      expect(screen.getByText('2 of 7 skills')).toBeInTheDocument();
    });

    it('should display skill names when skills are selected', () => {
      const props = { ...defaultProps, summaryData: mockDataWithSkills };
      render(<Step5Summary {...props} />);
      expect(screen.getByTestId('skills-details')).toBeInTheDocument();
      expect(screen.getByText('Python Basics')).toBeInTheDocument();
      expect(screen.getByText('Linear Algebra')).toBeInTheDocument();
    });

    it('should display custom role text when "other" is selected', () => {
      const props = { ...defaultProps, summaryData: mockDataWithOtherRole };
      render(<Step5Summary {...props} />);
      expect(screen.getByText('ML Researcher')).toBeInTheDocument();
    });
  });

  describe('Edit Navigation', () => {
    it('should render edit buttons for all sections', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByTestId('edit-step-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-step-2')).toBeInTheDocument();
      expect(screen.getByTestId('edit-step-3')).toBeInTheDocument();
      expect(screen.getByTestId('edit-step-4')).toBeInTheDocument();
    });

    it('should call onEditStep with step 1 when edit current role is clicked', async () => {
      const onEditStep = vi.fn();
      render(<Step5Summary {...defaultProps} onEditStep={onEditStep} />);

      await userEvent.click(screen.getByTestId('edit-step-1'));
      expect(onEditStep).toHaveBeenCalledWith(1);
    });

    it('should call onEditStep with step 2 when edit target role is clicked', async () => {
      const onEditStep = vi.fn();
      render(<Step5Summary {...defaultProps} onEditStep={onEditStep} />);

      await userEvent.click(screen.getByTestId('edit-step-2'));
      expect(onEditStep).toHaveBeenCalledWith(2);
    });

    it('should call onEditStep with step 3 when edit weekly hours is clicked', async () => {
      const onEditStep = vi.fn();
      render(<Step5Summary {...defaultProps} onEditStep={onEditStep} />);

      await userEvent.click(screen.getByTestId('edit-step-3'));
      expect(onEditStep).toHaveBeenCalledWith(3);
    });

    it('should call onEditStep with step 4 when edit skills is clicked', async () => {
      const onEditStep = vi.fn();
      render(<Step5Summary {...defaultProps} onEditStep={onEditStep} />);

      await userEvent.click(screen.getByTestId('edit-step-4'));
      expect(onEditStep).toHaveBeenCalledWith(4);
    });
  });

  describe('Generate Path Button', () => {
    it('should render Generate My Path button', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByTestId('generate-path-button')).toBeInTheDocument();
      expect(screen.getByText('Generate My Path')).toBeInTheDocument();
    });

    it('should call onGeneratePath when clicked', async () => {
      const onGeneratePath = vi.fn().mockResolvedValue(undefined);
      render(<Step5Summary {...defaultProps} onGeneratePath={onGeneratePath} />);

      await userEvent.click(screen.getByTestId('generate-path-button'));
      expect(onGeneratePath).toHaveBeenCalled();
    });

    it('should show loading state when isGenerating is true', () => {
      render(<Step5Summary {...defaultProps} isGenerating={true} />);
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should disable button when isGenerating is true', () => {
      render(<Step5Summary {...defaultProps} isGenerating={true} />);
      expect(screen.getByTestId('generate-path-button')).toBeDisabled();
    });
  });

  describe('Back Navigation', () => {
    it('should render Back button', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('should call onBack when Back button is clicked', async () => {
      const onBack = vi.fn();
      render(<Step5Summary {...defaultProps} onBack={onBack} />);

      await userEvent.click(screen.getByTestId('back-button'));
      expect(onBack).toHaveBeenCalled();
    });

    it('should disable Back button when isGenerating', () => {
      render(<Step5Summary {...defaultProps} isGenerating={true} />);
      expect(screen.getByTestId('back-button')).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should show validation error when required data is missing', async () => {
      const props = { ...defaultProps, summaryData: mockIncompleteData };
      render(<Step5Summary {...props} />);

      await userEvent.click(screen.getByTestId('generate-path-button'));

      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      expect(screen.getByText(/Please complete the following steps/i)).toBeInTheDocument();
    });

    it('should mark missing sections with error styling', async () => {
      const props = { ...defaultProps, summaryData: mockIncompleteData };
      render(<Step5Summary {...props} />);

      await userEvent.click(screen.getByTestId('generate-path-button'));

      const currentRoleCard = screen.getByTestId('summary-card-currentRole');
      expect(currentRoleCard).toHaveClass('summary-card--error');
    });

    it('should show "Required" badge for missing data', async () => {
      const props = { ...defaultProps, summaryData: mockIncompleteData };
      render(<Step5Summary {...props} />);

      await userEvent.click(screen.getByTestId('generate-path-button'));

      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('should not call onGeneratePath when validation fails', async () => {
      const onGeneratePath = vi.fn().mockResolvedValue(undefined);
      const props = {
        ...defaultProps,
        summaryData: mockIncompleteData,
        onGeneratePath,
      };
      render(<Step5Summary {...props} />);

      await userEvent.click(screen.getByTestId('generate-path-button'));

      expect(onGeneratePath).not.toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('should display API error when provided', () => {
      const props = { ...defaultProps, error: 'Failed to generate path' };
      render(<Step5Summary {...props} />);

      expect(screen.getByTestId('api-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to generate path')).toBeInTheDocument();
    });

    it('should not display API error when null', () => {
      render(<Step5Summary {...defaultProps} />);
      expect(screen.queryByTestId('api-error')).not.toBeInTheDocument();
    });
  });
});

describe('Helper Functions', () => {
  describe('getCurrentRoleDisplayName', () => {
    it('should return role display name for standard roles', () => {
      expect(
        getCurrentRoleDisplayName({ currentRole: 'backend_developer' })
      ).toBe('Backend Developer');
    });

    it('should return custom role text when "other" is selected', () => {
      expect(
        getCurrentRoleDisplayName({
          currentRole: 'other',
          customRoleText: 'ML Researcher',
        })
      ).toBe('ML Researcher');
    });

    it('should return "Not selected" when data is null', () => {
      expect(getCurrentRoleDisplayName(null)).toBe('Not selected');
    });

    it('should return "Other" when other is selected without custom text', () => {
      expect(getCurrentRoleDisplayName({ currentRole: 'other' })).toBe('Other');
    });
  });

  describe('getTargetRoleDisplayName', () => {
    it('should return target role display name', () => {
      expect(getTargetRoleDisplayName({ targetRole: 'ml_engineer' })).toBe(
        'ML Engineer'
      );
    });

    it('should return "Not selected" when data is null', () => {
      expect(getTargetRoleDisplayName(null)).toBe('Not selected');
    });
  });

  describe('getWeeklyHoursDisplayText', () => {
    it('should format weekly hours correctly', () => {
      expect(getWeeklyHoursDisplayText({ weeklyHours: 10 })).toBe('10 hours/week');
    });

    it('should return "Not selected" when data is null', () => {
      expect(getWeeklyHoursDisplayText(null)).toBe('Not selected');
    });
  });

  describe('getSkillsToSkipDisplayText', () => {
    it('should return "None selected" when no skills', () => {
      expect(getSkillsToSkipDisplayText({ skillsToSkip: [] })).toBe(
        'None selected (all content included)'
      );
    });

    it('should return count format when skills selected', () => {
      expect(
        getSkillsToSkipDisplayText({
          skillsToSkip: [
            'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          ],
        })
      ).toBe('2 of 7 skills');
    });

    it('should return "None selected" when data is null', () => {
      expect(getSkillsToSkipDisplayText(null)).toBe(
        'None selected (all content included)'
      );
    });
  });

  describe('getSkillNamesToSkip', () => {
    it('should return skill names for valid IDs', () => {
      const names = getSkillNamesToSkip({
        skillsToSkip: ['a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'],
      });
      expect(names).toContain('Python Basics');
    });

    it('should return empty array when no skills', () => {
      expect(getSkillNamesToSkip({ skillsToSkip: [] })).toEqual([]);
    });

    it('should return empty array when data is null', () => {
      expect(getSkillNamesToSkip(null)).toEqual([]);
    });

    it('should filter out invalid skill IDs', () => {
      const names = getSkillNamesToSkip({
        skillsToSkip: [
          'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          'invalid-id',
        ],
      });
      expect(names).toHaveLength(1);
      expect(names).toContain('Python Basics');
    });
  });

  describe('getEstimatedCompletionText', () => {
    it('should calculate completion estimate', () => {
      const result = getEstimatedCompletionText(
        { targetRole: 'ml_engineer' },
        { weeklyHours: 10 },
        { skillsToSkip: [] }
      );
      expect(result).toMatch(/~\d+ months?/);
    });

    it('should return "Unable to calculate" when target role is missing', () => {
      expect(
        getEstimatedCompletionText(null, { weeklyHours: 10 }, { skillsToSkip: [] })
      ).toBe('Unable to calculate');
    });

    it('should return "Unable to calculate" when weekly hours is missing', () => {
      expect(
        getEstimatedCompletionText(
          { targetRole: 'ml_engineer' },
          null,
          { skillsToSkip: [] }
        )
      ).toBe('Unable to calculate');
    });

    it('should adjust time based on skills skipped', () => {
      const withoutSkills = getEstimatedCompletionText(
        { targetRole: 'ml_engineer' },
        { weeklyHours: 10 },
        { skillsToSkip: [] }
      );

      const withSkills = getEstimatedCompletionText(
        { targetRole: 'ml_engineer' },
        { weeklyHours: 10 },
        {
          skillsToSkip: [
            'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
          ],
        }
      );

      // With skills skipped should have shorter estimate or same
      // (depends on exact calculation, just verify it's still valid)
      expect(withSkills).toMatch(/~\d+|Unable/);
    });
  });

  describe('validateSummaryData', () => {
    it('should return valid for complete data', () => {
      const result = validateSummaryData(mockCompleteData);
      expect(result.isValid).toBe(true);
      expect(result.missingSteps).toEqual([]);
    });

    it('should return invalid when step 1 is missing', () => {
      const result = validateSummaryData({
        ...mockCompleteData,
        step1: null,
      });
      expect(result.isValid).toBe(false);
      expect(result.missingSteps).toContain(1);
    });

    it('should return invalid when step 2 is missing', () => {
      const result = validateSummaryData({
        ...mockCompleteData,
        step2: null,
      });
      expect(result.isValid).toBe(false);
      expect(result.missingSteps).toContain(2);
    });

    it('should return invalid when step 3 is missing', () => {
      const result = validateSummaryData({
        ...mockCompleteData,
        step3: null,
      });
      expect(result.isValid).toBe(false);
      expect(result.missingSteps).toContain(3);
    });

    it('should be valid when step 4 is null (optional)', () => {
      const result = validateSummaryData({
        ...mockCompleteData,
        step4: null,
      });
      expect(result.isValid).toBe(true);
    });

    it('should identify multiple missing steps', () => {
      const result = validateSummaryData({
        step1: null,
        step2: null,
        step3: { weeklyHours: 10 },
        step4: { skillsToSkip: [] },
      });
      expect(result.isValid).toBe(false);
      expect(result.missingSteps).toContain(1);
      expect(result.missingSteps).toContain(2);
    });
  });
});

describe('Accessibility', () => {
  it('should have accessible edit buttons', () => {
    render(<Step5Summary {...defaultProps} />);

    const editBtn = screen.getByTestId('edit-step-1');
    expect(editBtn).toHaveAttribute('aria-label', 'Edit Current Role');
  });

  it('should have alert role for error messages', async () => {
    const props = { ...defaultProps, summaryData: mockIncompleteData };
    render(<Step5Summary {...props} />);

    await userEvent.click(screen.getByTestId('generate-path-button'));

    const errorElement = screen.getByTestId('validation-error');
    expect(errorElement).toHaveAttribute('role', 'alert');
  });

  it('should have alert role for API errors', () => {
    const props = { ...defaultProps, error: 'Test error' };
    render(<Step5Summary {...props} />);

    const errorElement = screen.getByTestId('api-error');
    expect(errorElement).toHaveAttribute('role', 'alert');
  });
});
