/**
 * @fileoverview Tests for Profile page component.
 *
 * @module @plpg/web/pages/Settings/Profile.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfilePage } from './Profile';
import type { Session } from '../../services/user.service';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth context
let mockUser: { id: string; email: string; name: string | null } | null = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};
let mockAuthLoading = false;

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: mockAuthLoading,
    isAuthenticated: !!mockUser,
  }),
}));

// Mock session data
const mockSession: Session = {
  userId: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  subscriptionStatus: 'active',
  trialEndsAt: '2026-02-01T00:00:00.000Z',
  isVerified: true,
  role: 'free',
  createdAt: '2026-01-01T00:00:00.000Z',
};

let mockSessionData: Session | undefined = mockSession;
let mockIsLoadingSession = false;

vi.mock('../../hooks/useSession', () => ({
  useSession: () => ({
    data: mockSessionData,
    isLoading: mockIsLoadingSession,
  }),
}));

// Mock useProfile hook
vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
    isUpdating: false,
    updateError: null,
    isSuccess: false,
    reset: vi.fn(),
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
 * Renders the ProfilePage with necessary providers.
 *
 * @returns Render result
 */
const renderProfilePage = () => {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionData = mockSession;
    mockIsLoadingSession = false;
    mockAuthLoading = false;
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };
  });

  describe('Loading State', () => {
    it('shows loading spinner while session is loading', () => {
      mockIsLoadingSession = true;

      renderProfilePage();

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /loading profile/i })).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('renders page title', () => {
      renderProfilePage();

      expect(screen.getByRole('heading', { name: 'Profile', level: 1 })).toBeInTheDocument();
    });

    it('renders back button with correct aria-label', () => {
      renderProfilePage();

      const backButton = screen.getByRole('button', { name: /back to settings/i });
      expect(backButton).toBeInTheDocument();
    });

    it('navigates to settings when back button is clicked', () => {
      renderProfilePage();

      const backButton = screen.getByRole('button', { name: /back to settings/i });
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Profile Information Section', () => {
    it('renders profile information heading', () => {
      renderProfilePage();

      expect(screen.getByRole('heading', { name: 'Profile Information', level: 2 })).toBeInTheDocument();
    });

    it('displays user name', () => {
      renderProfilePage();

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays user email', () => {
      renderProfilePage();

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays user initials in avatar', () => {
      renderProfilePage();

      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('displays email initial when name is not available', () => {
      mockSessionData = { ...mockSession, name: null };
      mockUser = { ...mockUser!, name: null };

      renderProfilePage();

      // Should show email initial 'T' from test@example.com
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Account Created Date', () => {
    it('displays formatted account creation date', () => {
      renderProfilePage();

      expect(screen.getByText('Account Created')).toBeInTheDocument();
      expect(screen.getByText('January 1, 2026')).toBeInTheDocument();
    });

    it('shows "Unknown" when createdAt is missing', () => {
      mockSessionData = { ...mockSession, createdAt: undefined as unknown as string };

      renderProfilePage();

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Subscription Badge', () => {
    it('displays trial badge for trial users', () => {
      mockSessionData = { ...mockSession, trialEndsAt: '2026-02-01T00:00:00.000Z' };

      renderProfilePage();

      expect(screen.getByText('Trial')).toBeInTheDocument();
    });

    it('displays pro badge for pro users', () => {
      mockSessionData = { ...mockSession, role: 'pro' };

      renderProfilePage();

      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('displays free badge for free users without trial', () => {
      mockSessionData = { ...mockSession, trialEndsAt: null };

      renderProfilePage();

      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('applies correct styling for trial badge', () => {
      mockSessionData = { ...mockSession, trialEndsAt: '2026-02-01T00:00:00.000Z' };

      renderProfilePage();

      const badge = screen.getByText('Trial');
      expect(badge).toHaveClass('bg-amber-500');
    });

    it('applies correct styling for pro badge', () => {
      mockSessionData = { ...mockSession, role: 'pro' };

      renderProfilePage();

      const badge = screen.getByText('Pro');
      expect(badge).toHaveClass('bg-primary-600');
    });

    it('applies correct styling for free badge', () => {
      mockSessionData = { ...mockSession, trialEndsAt: null };

      renderProfilePage();

      const badge = screen.getByText('Free');
      expect(badge).toHaveClass('bg-secondary-200');
    });
  });

  describe('Trial Expiration', () => {
    it('displays trial expiration date for trial users', () => {
      mockSessionData = { ...mockSession, trialEndsAt: '2026-02-01T00:00:00.000Z' };

      renderProfilePage();

      expect(screen.getByText(/Trial ends:/)).toBeInTheDocument();
      expect(screen.getByText(/February 1, 2026/)).toBeInTheDocument();
    });

    it('displays upgrade prompt for trial users', () => {
      mockSessionData = { ...mockSession, trialEndsAt: '2026-02-01T00:00:00.000Z' };

      renderProfilePage();

      expect(screen.getByText(/Upgrade to Pro to continue after your trial ends/)).toBeInTheDocument();
    });

    it('does not display trial section for pro users', () => {
      mockSessionData = { ...mockSession, role: 'pro' };

      renderProfilePage();

      expect(screen.queryByText(/Trial ends:/)).not.toBeInTheDocument();
    });

    it('does not display trial section when trialEndsAt is null', () => {
      mockSessionData = { ...mockSession, trialEndsAt: null };

      renderProfilePage();

      expect(screen.queryByText(/Trial ends:/)).not.toBeInTheDocument();
    });
  });

  describe('Edit Profile Section', () => {
    it('renders edit profile heading', () => {
      renderProfilePage();

      expect(screen.getByRole('heading', { name: 'Edit Profile', level: 2 })).toBeInTheDocument();
    });

    it('renders profile edit form', () => {
      renderProfilePage();

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    it('pre-populates form with current user name', () => {
      renderProfilePage();

      const input = screen.getByLabelText(/display name/i);
      expect(input).toHaveValue('Test User');
    });

    it('renders save button', () => {
      renderProfilePage();

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  describe('Billing Settings Section', () => {
    it('renders billing section heading', () => {
      renderProfilePage();

      expect(screen.getByRole('heading', { name: 'Subscription & Billing', level: 2 })).toBeInTheDocument();
    });

    it('renders billing link button', () => {
      renderProfilePage();

      expect(screen.getByRole('button', { name: /navigate to billing settings/i })).toBeInTheDocument();
    });

    it('navigates to billing settings when button is clicked', () => {
      renderProfilePage();

      const billingButton = screen.getByRole('button', { name: /navigate to billing settings/i });
      fireEvent.click(billingButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings/billing');
    });
  });

  describe('Accessibility', () => {
    it('has proper landmark roles', () => {
      renderProfilePage();

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderProfilePage();

      const headings = screen.getAllByRole('heading');
      const h1 = headings.find((h) => h.tagName === 'H1');
      const h2s = headings.filter((h) => h.tagName === 'H2');

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(3);
    });

    it('sections are properly labeled', () => {
      renderProfilePage();

      expect(screen.getByRole('region', { name: /profile information/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /subscription & billing/i })).toBeInTheDocument();
    });
  });
});
