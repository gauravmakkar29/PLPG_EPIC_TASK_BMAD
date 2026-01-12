/**
 * @fileoverview Unit tests for Step3WeeklyTime component.
 * Tests the weekly time budget selection functionality in the onboarding flow.
 *
 * @module @plpg/web/components/onboarding/Step3WeeklyTime.test
 *
 * @requirements
 * - AIRE-236: Story 2.4 - Step 3 Weekly Time Budget
 * - Test slider renders with correct min/max
 * - Test default value is 10
 * - Test slider increments by 1
 * - Test completion estimate calculates correctly
 * - Test recommended range visual indicator
 * - Test tooltip displays on hover
 * - Test value change calls save API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Step3WeeklyTime,
  calculateCompletionWeeks,
  formatDuration,
  isInRecommendedRange,
  calculateSliderPercentage,
} from './Step3WeeklyTime';
import type { OnboardingStep3Data } from '@plpg/shared';
import {
  WEEKLY_HOURS_MIN,
  WEEKLY_HOURS_MAX,
  WEEKLY_HOURS_DEFAULT,
  WEEKLY_HOURS_STEP,
  WEEKLY_HOURS_RECOMMENDED_MIN,
  WEEKLY_HOURS_RECOMMENDED_MAX,
} from '@plpg/shared';

describe('Step3WeeklyTime', () => {
  // Mock callbacks
  const mockOnSelectionChange = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  // Default total estimated hours for ML Engineer path
  const defaultTotalHours = 300;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Slider renders with correct range (5-20)
   *
   * @requirement AIRE-236 - Slider input for hours (range: 5-20 hours)
   */
  describe('renders slider with correct min/max', () => {
    it('should render slider with min value of 5', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveAttribute('min', String(WEEKLY_HOURS_MIN));
    });

    it('should render slider with max value of 20', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveAttribute('max', String(WEEKLY_HOURS_MAX));
    });

    it('should display min and max labels', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(`${WEEKLY_HOURS_MIN}h`)).toBeInTheDocument();
      expect(screen.getByText(`${WEEKLY_HOURS_MAX}h`)).toBeInTheDocument();
    });
  });

  /**
   * Test: Default value is 10
   *
   * @requirement AIRE-236 - Default value: 10 hours
   */
  describe('default value is 10', () => {
    it('should have default value of 10 when no initial data', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveValue(String(WEEKLY_HOURS_DEFAULT));
    });

    it('should display 10 in the value display', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const valueDisplay = screen.getByTestId('value-display');
      expect(valueDisplay).toHaveTextContent('10');
    });
  });

  /**
   * Test: Slider increments by 1
   *
   * @requirement AIRE-236 - Step increment: 1 hour
   */
  describe('slider increments by 1', () => {
    it('should have step value of 1', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveAttribute('step', String(WEEKLY_HOURS_STEP));
    });

    it('should update value when slider changes', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      fireEvent.change(slider, { target: { value: '15' } });

      expect(slider).toHaveValue('15');
      const valueDisplay = screen.getByTestId('value-display');
      expect(valueDisplay).toHaveTextContent('15');
    });
  });

  /**
   * Test: Completion estimate calculates correctly
   *
   * @requirement AIRE-236 - Dynamic display showing estimated completion
   */
  describe('completion estimate calculates correctly', () => {
    it('should display completion estimate panel', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('estimate-panel')).toBeInTheDocument();
    });

    it('should calculate correct weeks for default value', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          totalEstimatedHours={300}
        />
      );

      // 300 hours / 10 hours per week = 30 weeks
      const estimateDetail = screen.getByTestId('estimate-detail');
      expect(estimateDetail).toHaveTextContent('30 weeks');
    });

    it('should update estimate when slider value changes', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          totalEstimatedHours={300}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      fireEvent.change(slider, { target: { value: '15' } });

      // 300 hours / 15 hours per week = 20 weeks
      const estimateDetail = screen.getByTestId('estimate-detail');
      expect(estimateDetail).toHaveTextContent('20 weeks');
    });

    it('should format duration in months for longer estimates', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 5 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          totalEstimatedHours={300}
        />
      );

      // 300 hours / 5 hours per week = 60 weeks = ~15 months
      const completionEstimate = screen.getByTestId('completion-estimate');
      expect(completionEstimate).toHaveTextContent('month');
    });
  });

  /**
   * Test: Recommended range visual indicator
   *
   * @requirement AIRE-236 - Visual indicator for recommended range (10-15 hours)
   */
  describe('recommended range visual indicator', () => {
    it('should render recommended range element', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('recommended-range')).toBeInTheDocument();
    });

    it('should show recommended indicator text', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('recommended-indicator')).toBeInTheDocument();
    });

    it('should indicate when value is within recommended range', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 12 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const indicator = screen.getByTestId('recommended-indicator');
      expect(indicator).toHaveClass('recommended-indicator--active');
      expect(indicator).toHaveTextContent('Great choice');
    });

    it('should show recommendation when value is outside range', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 5 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const indicator = screen.getByTestId('recommended-indicator');
      expect(indicator).not.toHaveClass('recommended-indicator--active');
      expect(indicator).toHaveTextContent(`Recommended: ${WEEKLY_HOURS_RECOMMENDED_MIN}-${WEEKLY_HOURS_RECOMMENDED_MAX}`);
    });

    it('should update indicator when value changes to recommended range', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 5 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      fireEvent.change(slider, { target: { value: '12' } });

      const indicator = screen.getByTestId('recommended-indicator');
      expect(indicator).toHaveClass('recommended-indicator--active');
    });
  });

  /**
   * Test: Tooltip displays on hover
   *
   * @requirement AIRE-236 - Tooltip explaining "This affects your completion timeline"
   */
  describe('tooltip displays on hover', () => {
    it('should render tooltip trigger', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
    });

    it('should NOT show tooltip initially', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.queryByTestId('timeline-tooltip')).not.toBeInTheDocument();
    });

    it('should show tooltip on mouse enter', async () => {
      const user = userEvent.setup();

      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const trigger = screen.getByTestId('tooltip-trigger');
      await user.hover(trigger);

      expect(screen.getByTestId('timeline-tooltip')).toBeInTheDocument();
      expect(screen.getByText('This affects your completion timeline')).toBeInTheDocument();
    });

    it('should hide tooltip on mouse leave', async () => {
      const user = userEvent.setup();

      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const trigger = screen.getByTestId('tooltip-trigger');
      await user.hover(trigger);
      expect(screen.getByTestId('timeline-tooltip')).toBeInTheDocument();

      await user.unhover(trigger);
      expect(screen.queryByTestId('timeline-tooltip')).not.toBeInTheDocument();
    });

    it('should show tooltip on focus', async () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const trigger = screen.getByTestId('tooltip-trigger');
      fireEvent.focus(trigger);

      expect(screen.getByTestId('timeline-tooltip')).toBeInTheDocument();
    });
  });

  /**
   * Test: Value change calls save API
   *
   * @requirement AIRE-236 - Test value change calls save API
   */
  describe('selection triggers save callback', () => {
    it('should call onSelectionChange when slider value changes', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      fireEvent.change(slider, { target: { value: '15' } });

      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        weeklyHours: 15,
      } as OnboardingStep3Data);
    });

    it('should call onSelectionChange only once per change', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      fireEvent.change(slider, { target: { value: '15' } });

      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectionChange with correct data structure', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      fireEvent.change(slider, { target: { value: '12' } });

      expect(mockOnSelectionChange).toHaveBeenCalledWith({
        weeklyHours: 12,
      });
    });
  });

  /**
   * Test: Next button functionality
   */
  describe('Next button behavior', () => {
    it('should render Next button', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('next-button')).toBeInTheDocument();
    });

    it('should have Next button enabled by default', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const nextButton = screen.getByTestId('next-button');
      expect(nextButton).toBeEnabled();
    });

    it('should call onNext when Next button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('next-button'));

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should have Next button with correct text', () => {
      render(
        <Step3WeeklyTime
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
   * Test: Back button functionality
   */
  describe('Back button behavior', () => {
    it('should render Back button', () => {
      render(
        <Step3WeeklyTime
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
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await user.click(screen.getByTestId('back-button'));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should have Back button enabled', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('back-button')).toBeEnabled();
    });
  });

  /**
   * Test: Initial data hydration
   */
  describe('initial data hydration', () => {
    it('should use initial data value when provided', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 15 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveValue('15');
    });

    it('should display initial value in value display', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 18 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const valueDisplay = screen.getByTestId('value-display');
      expect(valueDisplay).toHaveTextContent('18');
    });

    it('should calculate estimate based on initial value', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 20 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          totalEstimatedHours={300}
        />
      );

      // 300 / 20 = 15 weeks
      const estimateDetail = screen.getByTestId('estimate-detail');
      expect(estimateDetail).toHaveTextContent('15 weeks');
    });
  });

  /**
   * Test: Loading states
   */
  describe('loading states', () => {
    it('should disable slider when loading', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('weekly-hours-slider')).toBeDisabled();
    });

    it('should show Loading text on Next button when loading', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
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
        <Step3WeeklyTime
          initialData={null}
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
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('back-button')).toBeDisabled();
    });

    it('should disable Next button when loading', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('next-button')).toBeDisabled();
    });
  });

  /**
   * Test: Accessibility
   */
  describe('accessibility', () => {
    it('should have proper aria-label on slider', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveAttribute('aria-label', 'Weekly hours commitment');
    });

    it('should have proper aria-valuemin on slider', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveAttribute('aria-valuemin', String(WEEKLY_HOURS_MIN));
    });

    it('should have proper aria-valuemax on slider', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveAttribute('aria-valuemax', String(WEEKLY_HOURS_MAX));
    });

    it('should have proper aria-valuenow on slider', () => {
      render(
        <Step3WeeklyTime
          initialData={{ weeklyHours: 12 }}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const slider = screen.getByTestId('weekly-hours-slider');
      expect(slider).toHaveAttribute('aria-valuenow', '12');
    });

    it('should have aria-live on estimate panel', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const estimatePanel = screen.getByTestId('estimate-panel');
      expect(estimatePanel).toHaveAttribute('aria-live', 'polite');
    });

    it('should have role tooltip on tooltip element', async () => {
      const user = userEvent.setup();

      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const trigger = screen.getByTestId('tooltip-trigger');
      await user.hover(trigger);

      const tooltip = screen.getByTestId('timeline-tooltip');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
    });
  });

  /**
   * Test: Component rendering
   */
  describe('component rendering', () => {
    it('should render step header with correct title', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('How much time can you dedicate?')).toBeInTheDocument();
    });

    it('should render step description', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(
        screen.getByText(/Set your weekly learning commitment/)
      ).toBeInTheDocument();
    });

    it('should have data-testid on root element', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByTestId('step-3-weekly-time')).toBeInTheDocument();
    });

    it('should display hours/week unit', () => {
      render(
        <Step3WeeklyTime
          initialData={null}
          onSelectionChange={mockOnSelectionChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('hours/week')).toBeInTheDocument();
    });
  });
});

/**
 * Test: Utility functions
 */
describe('Step3WeeklyTime utility functions', () => {
  describe('calculateCompletionWeeks', () => {
    it('should calculate correct weeks', () => {
      expect(calculateCompletionWeeks(10, 300)).toBe(30);
    });

    it('should round up to nearest week', () => {
      expect(calculateCompletionWeeks(10, 305)).toBe(31);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateCompletionWeeks(0, 300)).toBe(0);
      expect(calculateCompletionWeeks(10, 0)).toBe(0);
      expect(calculateCompletionWeeks(-5, 300)).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format short durations in weeks', () => {
      expect(formatDuration(4)).toBe('~4 weeks');
    });

    it('should format long durations in months', () => {
      expect(formatDuration(30)).toBe('~8 months');
    });

    it('should handle singular week', () => {
      expect(formatDuration(1)).toBe('~1 week');
    });

    it('should handle singular month', () => {
      expect(formatDuration(4)).toBe('~4 weeks');
      // 8 weeks = 2 months
      expect(formatDuration(8)).toBe('~2 months');
    });

    it('should return dash for zero or negative', () => {
      expect(formatDuration(0)).toBe('—');
      expect(formatDuration(-1)).toBe('—');
    });
  });

  describe('isInRecommendedRange', () => {
    it('should return true for values in range', () => {
      expect(isInRecommendedRange(10)).toBe(true);
      expect(isInRecommendedRange(12)).toBe(true);
      expect(isInRecommendedRange(15)).toBe(true);
    });

    it('should return false for values outside range', () => {
      expect(isInRecommendedRange(5)).toBe(false);
      expect(isInRecommendedRange(9)).toBe(false);
      expect(isInRecommendedRange(16)).toBe(false);
      expect(isInRecommendedRange(20)).toBe(false);
    });
  });

  describe('calculateSliderPercentage', () => {
    it('should calculate correct percentage', () => {
      // (10 - 5) / (20 - 5) * 100 = 33.33...
      expect(calculateSliderPercentage(10)).toBeCloseTo(33.33, 1);
    });

    it('should return 0 for min value', () => {
      expect(calculateSliderPercentage(5)).toBe(0);
    });

    it('should return 100 for max value', () => {
      expect(calculateSliderPercentage(20)).toBe(100);
    });

    it('should handle custom min/max', () => {
      expect(calculateSliderPercentage(15, 10, 20)).toBe(50);
    });
  });
});
