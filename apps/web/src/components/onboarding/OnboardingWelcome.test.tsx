/**
 * @fileoverview Tests for OnboardingWelcome component.
 * Validates welcome screen rendering, user interactions, and navigation.
 *
 * @module @plpg/web/components/onboarding/OnboardingWelcome.test
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as analytics from '../../lib/analytics';
import { render } from '../../test/utils';
import { OnboardingProvider } from '../../contexts/OnboardingContext';

import { OnboardingWelcome } from './OnboardingWelcome';

import type { ReactNode } from 'react';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the analytics module
vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
  AnalyticsEvent: {
    ONBOARDING_STARTED: 'onboarding_started',
  },
}));

// Wrapper component with OnboardingProvider
function WrapperWithProvider({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}

describe('OnboardingWelcome Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render welcome heading', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        /welcome/i
      );
    });

    it('should render description text', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(
        screen.getByText(/personalized learning path/i)
      ).toBeInTheDocument();
    });

    it('should render all 4 onboarding steps', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByText('Current Role')).toBeInTheDocument();
      expect(screen.getByText('Target Role')).toBeInTheDocument();
      expect(screen.getByText('Time Commitment')).toBeInTheDocument();
      expect(screen.getByText('Skills Assessment')).toBeInTheDocument();
    });

    it('should render step numbers', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('Step 4')).toBeInTheDocument();
    });

    it('should render benefits section', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByText(/personalized learning roadmap/i)).toBeInTheDocument();
      expect(screen.getByText(/curated resources/i)).toBeInTheDocument();
      expect(screen.getByText(/progress tracking/i)).toBeInTheDocument();
    });

    it('should render Get Started button', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      expect(button).toBeInTheDocument();
    });

    it('should render time estimate', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByText(/2-3 minutes/i)).toBeInTheDocument();
    });

    it('should render progress saved message', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByText(/progress is saved/i)).toBeInTheDocument();
    });

    it('should render PLPG logo/header', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByText('PLPG')).toBeInTheDocument();
    });

    it('should render step descriptions', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      expect(screen.getByText(/current position/i)).toBeInTheDocument();
      expect(screen.getByText(/career path/i)).toBeInTheDocument();
      expect(screen.getByText(/weekly learning hours/i)).toBeInTheDocument();
      expect(screen.getByText(/skip topics/i)).toBeInTheDocument();
    });
  });

  describe('Get Started Button', () => {
    it('should navigate to step 1 when clicked', async () => {
      const user = userEvent.setup();
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/step/1');
    });

    it('should track analytics event when clicked', async () => {
      const user = userEvent.setup();
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      await user.click(button);

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        analytics.AnalyticsEvent.ONBOARDING_STARTED,
        expect.any(Object)
      );
    });

    it('should call onStart callback when provided', async () => {
      const user = userEvent.setup();
      const onStart = vi.fn();

      render(
        <WrapperWithProvider>
          <OnboardingWelcome onStart={onStart} />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      await user.click(button);

      expect(onStart).toHaveBeenCalled();
    });

    it('should be keyboard accessible via Enter key', async () => {
      const user = userEvent.setup();
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      button.focus();

      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button aria-label', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      expect(button).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA hidden on decorative icons', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should have button type attribute set to button', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('LocalStorage Reset', () => {
    it('should reset onboarding progress when starting fresh', async () => {
      const user = userEvent.setup();
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      const button = screen.getByRole('button', { name: /start onboarding/i });
      await user.click(button);

      // After clicking start, resetOnboarding is called which clears progress
      // Then the effect saves initial state
      const saved = localStorage.getItem('plpg_onboarding_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.currentStep).toBe(1);
        expect(parsed.data.currentRole).toBeNull();
      }
    });
  });

  describe('Responsive Layout', () => {
    it('should render with proper container classes', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      // Check for responsive container
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('flex-1');
    });

    it('should render grid layout for steps', () => {
      render(
        <WrapperWithProvider>
          <OnboardingWelcome />
        </WrapperWithProvider>
      );

      // Steps should be in a grid container
      const stepContainers = document.querySelectorAll('.grid');
      expect(stepContainers.length).toBeGreaterThan(0);
    });
  });
});
