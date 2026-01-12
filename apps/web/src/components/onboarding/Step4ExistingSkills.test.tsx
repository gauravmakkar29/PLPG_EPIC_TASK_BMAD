/**
 * @fileoverview Unit tests for Step4ExistingSkills component.
 * Tests the existing skills selection functionality in the onboarding flow.
 *
 * @module @plpg/web/components/onboarding/Step4ExistingSkills.test
 *
 * @requirements
 * - AIRE-237: Story 2.5 - Existing Skills Selection
 * - Test all skill checkboxes render
 * - Test checkbox selection toggles state
 * - Test multiple selections allowed
 * - Test Select All selects all skills
 * - Test Clear All deselects all skills
 * - Test skill description shows on hover
 * - Test selections call save API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Step4ExistingSkills,
  getSelectionStatusText,
  calculateTimeSaved,
  formatTimeSaved,
} from './Step4ExistingSkills';
import type { OnboardingStep4Data } from '@plpg/shared';
import {
  PREREQUISITE_SKILLS,
  getAllPrerequisiteSkillIds,
} from '@plpg/shared';

describe('Step4ExistingSkills', () => {
  // Mock callbacks
  const mockOnSelectionChange = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: All skill checkboxes render
   *
   * @requirement AIRE-237 - Checkbox list of common prerequisite skills
   */
  describe('all skill checkboxes render', () => {
    it('should render all prerequisite skills', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Check each skill is rendered
      PREREQUISITE_SKILLS.forEach((skill) => {
        expect(screen.getByTestId(`skill-item-${skill.slug}`)).toBeInTheDocument();
        expect(screen.getByText(skill.name)).toBeInTheDocument();
      });
    });

    it('should render Python Basics skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Python Basics')).toBeInTheDocument();
    });

    it('should render Linear Algebra skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Linear Algebra')).toBeInTheDocument();
    });

    it('should render Statistics & Probability skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Statistics & Probability')).toBeInTheDocument();
    });

    it('should render SQL/Databases skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('SQL/Databases')).toBeInTheDocument();
    });

    it('should render Git Version Control skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Git Version Control')).toBeInTheDocument();
    });

    it('should render Data Manipulation skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Data Manipulation (Pandas/NumPy)')).toBeInTheDocument();
    });

    it('should render Basic Calculus skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Basic Calculus')).toBeInTheDocument();
    });

    it('should render skills grouped by category', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('category-programming')).toBeInTheDocument();
      expect(screen.getByTestId('category-math')).toBeInTheDocument();
      expect(screen.getByTestId('category-tools')).toBeInTheDocument();
    });
  });

  /**
   * Test: Checkbox selection toggles state
   *
   * @requirement AIRE-237 - Multi-select allowed
   */
  describe('checkbox selection toggles state', () => {
    it('should toggle checkbox when clicked', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const pythonCheckbox = screen.getByTestId('skill-checkbox-python-basics');
      expect(pythonCheckbox).not.toBeChecked();

      await user.click(pythonCheckbox);
      expect(pythonCheckbox).toBeChecked();

      await user.click(pythonCheckbox);
      expect(pythonCheckbox).not.toBeChecked();
    });

    it('should update skill item styling when selected', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const skillItem = screen.getByTestId('skill-item-python-basics');
      const checkbox = screen.getByTestId('skill-checkbox-python-basics');

      expect(skillItem).not.toHaveClass('skill-item--selected');

      await user.click(checkbox);
      expect(skillItem).toHaveClass('skill-item--selected');
    });

    it('should call onSelectionChange when checkbox is toggled', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const pythonCheckbox = screen.getByTestId('skill-checkbox-python-basics');
      await user.click(pythonCheckbox);

      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
      expect(mockOnSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          skillsToSkip: expect.arrayContaining([PREREQUISITE_SKILLS[0].id]),
        })
      );
    });
  });

  /**
   * Test: Multiple selections allowed
   *
   * @requirement AIRE-237 - Multi-select allowed
   */
  describe('multiple selections allowed', () => {
    it('should allow selecting multiple skills', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const pythonCheckbox = screen.getByTestId('skill-checkbox-python-basics');
      const linearAlgebraCheckbox = screen.getByTestId('skill-checkbox-linear-algebra');
      const gitCheckbox = screen.getByTestId('skill-checkbox-git-version-control');

      await user.click(pythonCheckbox);
      await user.click(linearAlgebraCheckbox);
      await user.click(gitCheckbox);

      expect(pythonCheckbox).toBeChecked();
      expect(linearAlgebraCheckbox).toBeChecked();
      expect(gitCheckbox).toBeChecked();
    });

    it('should preserve initial selections', () => {
      const initialData: OnboardingStep4Data = {
        skillsToSkip: [PREREQUISITE_SKILLS[0].id, PREREQUISITE_SKILLS[2].id],
      };

      render(
        <Step4ExistingSkills
          initialData={initialData}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const pythonCheckbox = screen.getByTestId('skill-checkbox-python-basics');
      const statsCheckbox = screen.getByTestId('skill-checkbox-statistics-probability');

      expect(pythonCheckbox).toBeChecked();
      expect(statsCheckbox).toBeChecked();
    });
  });

  /**
   * Test: Select All selects all skills
   *
   * @requirement AIRE-237 - Select All / Clear All shortcuts
   */
  describe('Select All selects all skills', () => {
    it('should render Select All button', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('select-all-btn')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('should select all skills when Select All is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const selectAllBtn = screen.getByTestId('select-all-btn');
      await user.click(selectAllBtn);

      // All checkboxes should be checked
      PREREQUISITE_SKILLS.forEach((skill) => {
        const checkbox = screen.getByTestId(`skill-checkbox-${skill.slug}`);
        expect(checkbox).toBeChecked();
      });
    });

    it('should call onSelectionChange with all skill IDs when Select All is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const selectAllBtn = screen.getByTestId('select-all-btn');
      await user.click(selectAllBtn);

      const allIds = getAllPrerequisiteSkillIds();
      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        skillsToSkip: expect.arrayContaining(allIds),
      });
    });

    it('should disable Select All when all skills are selected', async () => {
      const allIds = getAllPrerequisiteSkillIds();
      render(
        <Step4ExistingSkills
          initialData={{ skillsToSkip: allIds }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const selectAllBtn = screen.getByTestId('select-all-btn');
      expect(selectAllBtn).toBeDisabled();
    });
  });

  /**
   * Test: Clear All deselects all skills
   *
   * @requirement AIRE-237 - Select All / Clear All shortcuts
   */
  describe('Clear All deselects all skills', () => {
    it('should render Clear All button', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('clear-all-btn')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should deselect all skills when Clear All is clicked', async () => {
      const user = userEvent.setup();
      const allIds = getAllPrerequisiteSkillIds();

      render(
        <Step4ExistingSkills
          initialData={{ skillsToSkip: allIds }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const clearAllBtn = screen.getByTestId('clear-all-btn');
      await user.click(clearAllBtn);

      // All checkboxes should be unchecked
      PREREQUISITE_SKILLS.forEach((skill) => {
        const checkbox = screen.getByTestId(`skill-checkbox-${skill.slug}`);
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should call onSelectionChange with empty array when Clear All is clicked', async () => {
      const user = userEvent.setup();
      const allIds = getAllPrerequisiteSkillIds();

      render(
        <Step4ExistingSkills
          initialData={{ skillsToSkip: allIds }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const clearAllBtn = screen.getByTestId('clear-all-btn');
      await user.click(clearAllBtn);

      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        skillsToSkip: [],
      });
    });

    it('should disable Clear All when no skills are selected', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const clearAllBtn = screen.getByTestId('clear-all-btn');
      expect(clearAllBtn).toBeDisabled();
    });
  });

  /**
   * Test: Skill description shows on hover
   *
   * @requirement AIRE-237 - Brief description of what each skill covers (on hover/click)
   */
  describe('skill description shows on hover', () => {
    it('should show tooltip when hovering over skill', async () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const skillItem = screen.getByTestId('skill-item-python-basics');
      fireEvent.mouseEnter(skillItem);

      await waitFor(() => {
        const tooltip = screen.getByTestId('skill-tooltip-python-basics');
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('should hide tooltip when mouse leaves skill', async () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const skillItem = screen.getByTestId('skill-item-python-basics');
      fireEvent.mouseEnter(skillItem);

      await waitFor(() => {
        expect(screen.getByTestId('skill-tooltip-python-basics')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(skillItem);

      await waitFor(() => {
        expect(screen.queryByTestId('skill-tooltip-python-basics')).not.toBeInTheDocument();
      });
    });

    it('should show expanded description when info button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const infoBtn = screen.getByTestId('skill-info-btn-python-basics');
      await user.click(infoBtn);

      await waitFor(() => {
        expect(screen.getByTestId('skill-expanded-python-basics')).toBeInTheDocument();
      });
    });

    it('should render info button for each skill', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      PREREQUISITE_SKILLS.forEach((skill) => {
        expect(screen.getByTestId(`skill-info-btn-${skill.slug}`)).toBeInTheDocument();
      });
    });
  });

  /**
   * Test: Selections call save API
   *
   * @requirement AIRE-237 - Skills saved and passed to roadmap engine
   */
  describe('selections call save API', () => {
    it('should call onSelectionChange on each selection change', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const pythonCheckbox = screen.getByTestId('skill-checkbox-python-basics');
      await user.click(pythonCheckbox);

      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const nextBtn = screen.getByTestId('next-button');
      await user.click(nextBtn);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should call onBack when Back button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const backBtn = screen.getByTestId('back-button');
      await user.click(backBtn);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test: Selection status display
   */
  describe('selection status display', () => {
    it('should display status when no skills selected', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const status = screen.getByTestId('selection-status');
      expect(status).toHaveTextContent('No skills selected');
    });

    it('should display count when some skills selected', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const pythonCheckbox = screen.getByTestId('skill-checkbox-python-basics');
      await user.click(pythonCheckbox);

      const status = screen.getByTestId('selection-status');
      expect(status).toHaveTextContent('1 of 7 skills selected');
    });

    it('should display all selected message when all skills selected', () => {
      const allIds = getAllPrerequisiteSkillIds();
      render(
        <Step4ExistingSkills
          initialData={{ skillsToSkip: allIds }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const status = screen.getByTestId('selection-status');
      expect(status).toHaveTextContent('All skills selected');
    });
  });

  /**
   * Test: Not Sure info panel
   */
  describe('Not Sure info panel', () => {
    it('should render Not Sure button', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('not-sure-btn')).toBeInTheDocument();
    });

    it('should expand Not Sure content when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const notSureBtn = screen.getByTestId('not-sure-btn');
      await user.click(notSureBtn);

      expect(screen.getByTestId('not-sure-content')).toBeInTheDocument();
    });

    it('should contain recommendation text', async () => {
      const user = userEvent.setup();
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const notSureBtn = screen.getByTestId('not-sure-btn');
      await user.click(notSureBtn);

      const content = screen.getByTestId('not-sure-content');
      expect(content).toHaveTextContent('leave it unchecked');
    });
  });

  /**
   * Test: Loading and saving states
   */
  describe('loading and saving states', () => {
    it('should disable checkboxes when isLoading is true', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      PREREQUISITE_SKILLS.forEach((skill) => {
        const checkbox = screen.getByTestId(`skill-checkbox-${skill.slug}`);
        expect(checkbox).toBeDisabled();
      });
    });

    it('should disable navigation buttons when isLoading is true', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('back-button')).toBeDisabled();
      expect(screen.getByTestId('next-button')).toBeDisabled();
    });

    it('should show saving indicator when isSaving is true', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isSaving={true}
        />
      );

      expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
    });

    it('should not show saving indicator when isSaving is false', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isSaving={false}
        />
      );

      expect(screen.queryByTestId('saving-indicator')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Helper functions
   */
  describe('helper functions', () => {
    describe('getSelectionStatusText', () => {
      it('should return correct text for no selections', () => {
        expect(getSelectionStatusText(0, 7)).toContain('No skills selected');
      });

      it('should return correct text for some selections', () => {
        expect(getSelectionStatusText(3, 7)).toContain('3 of 7 skills selected');
      });

      it('should return correct text for all selections', () => {
        expect(getSelectionStatusText(7, 7)).toContain('All skills selected');
      });
    });

    describe('calculateTimeSaved', () => {
      it('should return 0 for empty array', () => {
        expect(calculateTimeSaved([])).toBe(0);
      });

      it('should calculate time saved for single skill', () => {
        const pythonId = PREREQUISITE_SKILLS[0].id;
        expect(calculateTimeSaved([pythonId])).toBeGreaterThan(0);
      });

      it('should calculate cumulative time saved for multiple skills', () => {
        const pythonId = PREREQUISITE_SKILLS[0].id;
        const gitId = PREREQUISITE_SKILLS[4].id;
        const singleTime = calculateTimeSaved([pythonId]);
        const combinedTime = calculateTimeSaved([pythonId, gitId]);
        expect(combinedTime).toBeGreaterThan(singleTime);
      });
    });

    describe('formatTimeSaved', () => {
      it('should return empty string for 0 hours', () => {
        expect(formatTimeSaved(0)).toBe('');
      });

      it('should format small hours', () => {
        expect(formatTimeSaved(5)).toBe('~5 hours');
      });

      it('should format larger hours with weeks', () => {
        expect(formatTimeSaved(20)).toContain('weeks');
      });
    });
  });

  /**
   * Test: Accessibility
   */
  describe('accessibility', () => {
    it('should have accessible labels for checkboxes', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      PREREQUISITE_SKILLS.forEach((skill) => {
        const checkbox = screen.getByTestId(`skill-checkbox-${skill.slug}`);
        expect(checkbox).toHaveAttribute('aria-label');
      });
    });

    it('should have accessible info buttons', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      PREREQUISITE_SKILLS.forEach((skill) => {
        const infoBtn = screen.getByTestId(`skill-info-btn-${skill.slug}`);
        expect(infoBtn).toHaveAttribute('aria-label');
      });
    });

    it('should have aria-expanded on Not Sure button', () => {
      render(
        <Step4ExistingSkills
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const notSureBtn = screen.getByTestId('not-sure-btn');
      expect(notSureBtn).toHaveAttribute('aria-expanded');
    });
  });
});
