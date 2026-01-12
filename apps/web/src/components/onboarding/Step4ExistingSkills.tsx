/**
 * @fileoverview Step 4 Existing Skills Selection Component for onboarding flow.
 * Allows users to indicate skills they already have to skip redundant content.
 *
 * @module @plpg/web/components/onboarding/Step4ExistingSkills
 * @description Fourth step of onboarding - prerequisite skills assessment.
 *
 * @requirements
 * - AIRE-237: Story 2.5 - Existing Skills Selection
 * - Checkbox list of common prerequisite skills
 * - Multi-select allowed
 * - Select All / Clear All shortcuts
 * - Brief description of what each skill covers (on hover/click)
 * - Optional: Not sure option with recommendation to include
 * - Skills saved and passed to roadmap engine
 *
 * @designPrinciples
 * - SRP: Component handles only skill selection logic
 * - OCP: Extensible via PREREQUISITE_SKILLS constant without code changes
 * - LSP: Follows consistent interface with other onboarding steps
 * - ISP: Focused props interface without unnecessary dependencies
 * - DIP: Depends on shared constants abstraction, not concrete values
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import {
  PREREQUISITE_SKILLS,
  SKILL_CATEGORIES,
  getSkillsByCategory,
  getAllPrerequisiteSkillIds,
} from '@plpg/shared';
import type { OnboardingStep4Data } from '@plpg/shared';
import type { PrerequisiteSkill } from '@plpg/shared';

/**
 * Props interface for Step4ExistingSkills component.
 * Follows Interface Segregation Principle with focused, minimal props.
 *
 * @interface Step4ExistingSkillsProps
 * @property {OnboardingStep4Data | null} initialData - Initial skills data if returning to step
 * @property {function} onSelectionChange - Callback when selections change (for auto-save)
 * @property {function} onNext - Callback when Next button is clicked
 * @property {function} onBack - Callback when Back button is clicked
 * @property {boolean} isLoading - Whether save operation is in progress
 * @property {boolean} isSaving - Whether auto-save is in progress
 */
export interface Step4ExistingSkillsProps {
  initialData: OnboardingStep4Data | null;
  onSelectionChange: (data: OnboardingStep4Data) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

/**
 * Skill checkbox item state.
 * Tracks selection and hover state for each skill.
 *
 * @interface SkillSelectionState
 */
interface SkillSelectionState {
  selectedIds: Set<string>;
  hoveredId: string | null;
  expandedId: string | null;
}

/**
 * Determines the selection status label.
 * Single Responsibility: Only handles status text generation.
 *
 * @param {number} selectedCount - Number of selected skills
 * @param {number} totalCount - Total number of skills
 * @returns {string} Selection status text
 */
export function getSelectionStatusText(
  selectedCount: number,
  totalCount: number
): string {
  if (selectedCount === 0) {
    return 'No skills selected - all content will be included in your path';
  }
  if (selectedCount === totalCount) {
    return 'All skills selected - you will skip all prerequisite content';
  }
  return `${selectedCount} of ${totalCount} skills selected to skip`;
}

/**
 * Calculates estimated time saved by skipping selected skills.
 * Single Responsibility: Only handles time calculation.
 *
 * @param {string[]} selectedIds - Array of selected skill IDs
 * @returns {number} Estimated hours saved
 */
export function calculateTimeSaved(selectedIds: string[]): number {
  // Approximate hours per skill (average based on typical prerequisite depth)
  const hoursPerSkill: Record<string, number> = {
    'python-basics': 20,
    'linear-algebra': 15,
    'statistics-probability': 15,
    'sql-databases': 10,
    'git-version-control': 5,
    'data-manipulation': 12,
    'basic-calculus': 10,
  };

  return selectedIds.reduce((total, id) => {
    const skill = PREREQUISITE_SKILLS.find((s) => s.id === id);
    if (skill && hoursPerSkill[skill.slug]) {
      return total + hoursPerSkill[skill.slug];
    }
    return total;
  }, 0);
}

/**
 * Formats hours into a readable duration string.
 * Single Responsibility: Only handles duration formatting.
 *
 * @param {number} hours - Hours to format
 * @returns {string} Formatted duration string
 */
export function formatTimeSaved(hours: number): string {
  if (hours === 0) return '';
  if (hours < 10) return `~${hours} hours`;
  return `~${hours} hours (${Math.ceil(hours / 10)} weeks at 10hr/week)`;
}

/**
 * Step 4 Existing Skills Selection Component.
 *
 * Renders a checkbox-based skill selection UI with the following features:
 * - List of prerequisite skills organized by category
 * - Multi-select checkboxes for each skill
 * - Select All / Clear All buttons
 * - Skill descriptions on hover/click
 * - "Not sure" recommendation banner
 * - Estimated time saved indicator
 * - Back and Next navigation buttons
 *
 * @param {Step4ExistingSkillsProps} props - Component props
 * @returns {JSX.Element} Rendered Step 4 component
 *
 * @example
 * ```tsx
 * <Step4ExistingSkills
 *   initialData={{ skillsToSkip: ['skill-id-1', 'skill-id-2'] }}
 *   onSelectionChange={(data) => saveToApi(data)}
 *   onNext={() => goToStep5()}
 *   onBack={() => goToStep3()}
 *   isLoading={false}
 *   isSaving={false}
 * />
 * ```
 */
export function Step4ExistingSkills({
  initialData,
  onSelectionChange,
  onNext,
  onBack,
  isLoading = false,
  isSaving = false,
}: Step4ExistingSkillsProps): JSX.Element {
  // State for skill selection
  const [selectionState, setSelectionState] = useState<SkillSelectionState>({
    selectedIds: new Set(initialData?.skillsToSkip || []),
    hoveredId: null,
    expandedId: null,
  });

  // State for "Not Sure" modal visibility
  const [showNotSureInfo, setShowNotSureInfo] = useState<boolean>(false);

  /**
   * Memoized array of selected skill IDs.
   */
  const selectedSkillIds = useMemo(
    (): string[] => Array.from(selectionState.selectedIds),
    [selectionState.selectedIds]
  );

  /**
   * Memoized count of selected skills.
   */
  const selectedCount = useMemo(
    (): number => selectionState.selectedIds.size,
    [selectionState.selectedIds]
  );

  /**
   * Memoized total skill count.
   */
  const totalCount = useMemo((): number => PREREQUISITE_SKILLS.length, []);

  /**
   * Memoized selection status text.
   */
  const statusText = useMemo(
    (): string => getSelectionStatusText(selectedCount, totalCount),
    [selectedCount, totalCount]
  );

  /**
   * Memoized time saved calculation.
   */
  const timeSaved = useMemo(
    (): number => calculateTimeSaved(selectedSkillIds),
    [selectedSkillIds]
  );

  /**
   * Memoized formatted time saved string.
   */
  const formattedTimeSaved = useMemo(
    (): string => formatTimeSaved(timeSaved),
    [timeSaved]
  );

  /**
   * Memoized skills grouped by category.
   */
  const skillsByCategory = useMemo(() => {
    return {
      programming: getSkillsByCategory('programming'),
      math: getSkillsByCategory('math'),
      tools: getSkillsByCategory('tools'),
    };
  }, []);

  /**
   * Handles individual skill checkbox toggle.
   * Updates selection state and triggers auto-save.
   *
   * @param {string} skillId - ID of the skill to toggle
   */
  const handleSkillToggle = useCallback(
    (skillId: string): void => {
      setSelectionState((prev) => {
        const newSelectedIds = new Set(prev.selectedIds);
        if (newSelectedIds.has(skillId)) {
          newSelectedIds.delete(skillId);
        } else {
          newSelectedIds.add(skillId);
        }

        // Trigger auto-save callback
        const data: OnboardingStep4Data = {
          skillsToSkip: Array.from(newSelectedIds),
        };
        onSelectionChange(data);

        return {
          ...prev,
          selectedIds: newSelectedIds,
        };
      });
    },
    [onSelectionChange]
  );

  /**
   * Handles Select All button click.
   * Selects all prerequisite skills.
   */
  const handleSelectAll = useCallback((): void => {
    const allIds = getAllPrerequisiteSkillIds();
    setSelectionState((prev) => ({
      ...prev,
      selectedIds: new Set(allIds),
    }));

    // Trigger auto-save callback
    const data: OnboardingStep4Data = {
      skillsToSkip: allIds,
    };
    onSelectionChange(data);
  }, [onSelectionChange]);

  /**
   * Handles Clear All button click.
   * Deselects all skills.
   */
  const handleClearAll = useCallback((): void => {
    setSelectionState((prev) => ({
      ...prev,
      selectedIds: new Set(),
    }));

    // Trigger auto-save callback
    const data: OnboardingStep4Data = {
      skillsToSkip: [],
    };
    onSelectionChange(data);
  }, [onSelectionChange]);

  /**
   * Handles mouse enter on skill item.
   * Shows tooltip with skill description.
   *
   * @param {string} skillId - ID of the hovered skill
   */
  const handleSkillHover = useCallback((skillId: string): void => {
    setSelectionState((prev) => ({
      ...prev,
      hoveredId: skillId,
    }));
  }, []);

  /**
   * Handles mouse leave on skill item.
   * Hides tooltip.
   */
  const handleSkillLeave = useCallback((): void => {
    setSelectionState((prev) => ({
      ...prev,
      hoveredId: null,
    }));
  }, []);

  /**
   * Handles click on skill item for mobile (expand/collapse).
   *
   * @param {string} skillId - ID of the clicked skill
   */
  const handleSkillClick = useCallback((skillId: string): void => {
    setSelectionState((prev) => ({
      ...prev,
      expandedId: prev.expandedId === skillId ? null : skillId,
    }));
  }, []);

  /**
   * Handles Next button click.
   * Proceeds to next step.
   */
  const handleNextClick = useCallback((): void => {
    onNext();
  }, [onNext]);

  /**
   * Handles Back button click.
   * Navigates to previous step.
   */
  const handleBackClick = useCallback((): void => {
    onBack();
  }, [onBack]);

  /**
   * Toggles "Not Sure" info panel visibility.
   */
  const handleToggleNotSureInfo = useCallback((): void => {
    setShowNotSureInfo((prev) => !prev);
  }, []);

  // Sync initial data on mount or when initialData changes
  useEffect(() => {
    if (initialData?.skillsToSkip) {
      setSelectionState((prev) => ({
        ...prev,
        selectedIds: new Set(initialData.skillsToSkip),
      }));
    }
  }, [initialData]);

  /**
   * Renders a single skill checkbox item.
   *
   * @param {PrerequisiteSkill} skill - Skill to render
   * @returns {JSX.Element} Skill checkbox item
   */
  const renderSkillItem = (skill: PrerequisiteSkill): JSX.Element => {
    const isSelected = selectionState.selectedIds.has(skill.id);
    const isHovered = selectionState.hoveredId === skill.id;
    const isExpanded = selectionState.expandedId === skill.id;

    return (
      <div
        key={skill.id}
        className={`skill-item ${isSelected ? 'skill-item--selected' : ''} ${isHovered ? 'skill-item--hovered' : ''}`}
        onMouseEnter={() => handleSkillHover(skill.id)}
        onMouseLeave={handleSkillLeave}
        data-testid={`skill-item-${skill.slug}`}
      >
        <label className="skill-label">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleSkillToggle(skill.id)}
            disabled={isLoading}
            className="skill-checkbox"
            data-testid={`skill-checkbox-${skill.slug}`}
            aria-label={`${skill.name} - ${skill.description}`}
          />
          <span className="skill-checkmark" aria-hidden="true">
            {isSelected && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <span className="skill-name">{skill.name}</span>
          <button
            type="button"
            className="skill-info-btn"
            onClick={(e) => {
              e.preventDefault();
              handleSkillClick(skill.id);
            }}
            aria-label={`More info about ${skill.name}`}
            data-testid={`skill-info-btn-${skill.slug}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </label>

        {/* Tooltip on hover (desktop) */}
        {isHovered && !isExpanded && (
          <div
            className="skill-tooltip"
            role="tooltip"
            data-testid={`skill-tooltip-${skill.slug}`}
          >
            <p>{skill.description}</p>
          </div>
        )}

        {/* Expanded description (mobile) */}
        {isExpanded && (
          <div
            className="skill-expanded"
            data-testid={`skill-expanded-${skill.slug}`}
          >
            <p>{skill.description}</p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders a category section with its skills.
   *
   * @param {PrerequisiteSkill['category']} category - Category key
   * @returns {JSX.Element} Category section
   */
  const renderCategory = (category: PrerequisiteSkill['category']): JSX.Element => {
    const categoryConfig = SKILL_CATEGORIES[category];
    const skills = skillsByCategory[category];

    return (
      <div
        key={category}
        className="skill-category"
        data-testid={`category-${category}`}
      >
        <div className="category-header">
          <h3 className="category-title">{categoryConfig.label}</h3>
          <p className="category-description">{categoryConfig.description}</p>
        </div>
        <div className="category-skills">
          {skills.map(renderSkillItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="step-4-existing-skills" data-testid="step-4-existing-skills">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">What skills do you already have?</h2>
        <p className="step-description">
          Select any skills you&apos;re already comfortable with. We&apos;ll skip this content
          in your learning path so you can focus on what&apos;s new.
        </p>
      </div>

      {/* Selection Actions */}
      <div className="selection-actions" data-testid="selection-actions">
        <button
          type="button"
          className="action-btn action-btn--select-all"
          onClick={handleSelectAll}
          disabled={isLoading || selectedCount === totalCount}
          data-testid="select-all-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Select All
        </button>
        <button
          type="button"
          className="action-btn action-btn--clear-all"
          onClick={handleClearAll}
          disabled={isLoading || selectedCount === 0}
          data-testid="clear-all-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Status Indicator */}
      <div className="selection-status" data-testid="selection-status">
        <span className="status-text">{statusText}</span>
        {formattedTimeSaved && (
          <span className="time-saved" data-testid="time-saved">
            Estimated time saved: {formattedTimeSaved}
          </span>
        )}
      </div>

      {/* Skills List by Category */}
      <div className="skills-container" data-testid="skills-container">
        {renderCategory('programming')}
        {renderCategory('math')}
        {renderCategory('tools')}
      </div>

      {/* Not Sure Info Panel */}
      <div className="not-sure-panel" data-testid="not-sure-panel">
        <button
          type="button"
          className="not-sure-trigger"
          onClick={handleToggleNotSureInfo}
          aria-expanded={showNotSureInfo}
          data-testid="not-sure-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Not sure about a skill?</span>
          <svg
            className={`chevron ${showNotSureInfo ? 'chevron--open' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showNotSureInfo && (
          <div className="not-sure-content" data-testid="not-sure-content">
            <p>
              <strong>Our recommendation:</strong> If you&apos;re unsure about a skill,
              it&apos;s better to <em>leave it unchecked</em>. The content will be
              included in your learning path as a refresher.
            </p>
            <p>
              You can always update your selections later in your profile settings
              if you find certain content too basic.
            </p>
          </div>
        )}
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="saving-indicator" aria-live="polite" data-testid="saving-indicator">
          <span className="saving-spinner" aria-hidden="true" />
          <span>Saving...</span>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="step-footer">
        <button
          type="button"
          className="btn btn--secondary btn--back"
          onClick={handleBackClick}
          disabled={isLoading}
          data-testid="back-button"
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn--primary btn--next"
          onClick={handleNextClick}
          disabled={isLoading}
          data-testid="next-button"
        >
          {isLoading ? 'Loading...' : 'Next'}
        </button>
      </div>

      {/* Scoped Styles */}
      <style>{`
        .step-4-existing-skills {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px;
        }

        .step-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .step-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 8px;
        }

        .step-description {
          font-size: 1rem;
          color: #6b7280;
          max-width: 480px;
          margin: 0 auto;
        }

        .selection-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #374151;
        }

        .action-btn svg {
          width: 16px;
          height: 16px;
        }

        .action-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn--select-all:hover:not(:disabled) {
          border-color: #22c55e;
          color: #16a34a;
        }

        .action-btn--clear-all:hover:not(:disabled) {
          border-color: #ef4444;
          color: #dc2626;
        }

        .selection-status {
          text-align: center;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .status-text {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .time-saved {
          display: block;
          font-size: 0.8125rem;
          color: #22c55e;
          margin-top: 4px;
          font-weight: 500;
        }

        .skills-container {
          margin-bottom: 24px;
        }

        .skill-category {
          margin-bottom: 20px;
        }

        .category-header {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .category-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .category-description {
          font-size: 0.8125rem;
          color: #9ca3af;
          margin: 0;
        }

        .category-skills {
          display: grid;
          gap: 8px;
        }

        .skill-item {
          position: relative;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 16px;
          transition: all 0.2s ease;
        }

        .skill-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .skill-item--selected {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .skill-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          gap: 12px;
        }

        .skill-checkbox {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .skill-checkmark {
          width: 22px;
          height: 22px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
          background: #ffffff;
        }

        .skill-item--selected .skill-checkmark {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .skill-checkmark svg {
          width: 14px;
          height: 14px;
          color: #ffffff;
        }

        .skill-checkbox:focus + .skill-checkmark {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        .skill-checkbox:disabled + .skill-checkmark {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .skill-name {
          flex: 1;
          font-size: 0.9375rem;
          color: #1a1a2e;
          font-weight: 500;
        }

        .skill-info-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .skill-info-btn:hover {
          background: #f3f4f6;
          color: #3b82f6;
        }

        .skill-info-btn svg {
          width: 18px;
          height: 18px;
        }

        .skill-tooltip {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: #ffffff;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.8125rem;
          width: 280px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          z-index: 100;
          animation: tooltipFadeIn 0.15s ease;
          line-height: 1.5;
        }

        .skill-tooltip::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 8px solid transparent;
          border-bottom-color: #1f2937;
        }

        .skill-tooltip p {
          margin: 0;
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .skill-expanded {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .skill-expanded p {
          margin: 0;
        }

        .not-sure-panel {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .not-sure-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          color: #92400e;
          font-weight: 500;
        }

        .not-sure-trigger svg {
          width: 18px;
          height: 18px;
        }

        .not-sure-trigger span {
          flex: 1;
          text-align: left;
        }

        .chevron {
          transition: transform 0.2s ease;
        }

        .chevron--open {
          transform: rotate(180deg);
        }

        .not-sure-content {
          padding: 0 16px 16px;
          font-size: 0.875rem;
          color: #78350f;
          line-height: 1.5;
        }

        .not-sure-content p {
          margin: 0 0 8px 0;
        }

        .not-sure-content p:last-child {
          margin-bottom: 0;
        }

        .saving-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 16px;
        }

        .saving-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .step-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn--primary {
          background: #3b82f6;
          color: #ffffff;
        }

        .btn--primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn--primary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }

        .btn--primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn--secondary {
          background: #ffffff;
          color: #374151;
          border: 2px solid #e5e7eb;
        }

        .btn--secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .btn--secondary:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.25);
        }

        .btn--secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .step-4-existing-skills {
            padding: 16px;
          }

          .step-title {
            font-size: 1.5rem;
          }

          .selection-actions {
            flex-direction: column;
          }

          .action-btn {
            justify-content: center;
          }

          .skill-tooltip {
            display: none;
          }

          .skill-item {
            padding: 10px 12px;
          }

          .step-footer {
            flex-direction: column-reverse;
            gap: 12px;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Step4ExistingSkills;
