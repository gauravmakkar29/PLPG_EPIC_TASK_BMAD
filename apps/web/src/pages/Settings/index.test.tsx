/**
 * @fileoverview Tests for Settings page component.
 *
 * @module @plpg/web/pages/Settings/index.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Settings } from './index';
import { render } from '../../test/utils';

// Mock auth context
let mockUser: { id: string; email: string; name: string } | null = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

vi.mock('../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      isLoading: false,
      isAuthenticated: !!mockUser,
      logout: vi.fn(),
    }),
  };
});

// Mock auth service for logoutUser
vi.mock('../../services/auth.service', () => ({
  logoutUser: vi.fn().mockResolvedValue({ success: true, message: 'Successfully logged out' }),
}));

/**
 * Renders the Settings page with necessary providers.
 *
 * @returns Render result
 */
const renderSettings = () => {
  return render(<Settings />);
};

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };
  });

  describe('Header', () => {
    it('renders page title', () => {
      renderSettings();

      expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
    });

    it('displays user email when authenticated', () => {
      renderSettings();

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('does not display email when user is not authenticated', () => {
      mockUser = null;

      renderSettings();

      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Menu', () => {
    it('renders profile settings link', () => {
      renderSettings();

      expect(screen.getByRole('link', { name: /navigate to profile settings/i })).toBeInTheDocument();
    });

    it('renders billing settings link', () => {
      renderSettings();

      expect(screen.getByRole('link', { name: /navigate to subscription & billing settings/i })).toBeInTheDocument();
    });

    it('displays profile menu item title', () => {
      renderSettings();

      expect(screen.getByRole('heading', { name: 'Profile', level: 2 })).toBeInTheDocument();
    });

    it('displays billing menu item title', () => {
      renderSettings();

      expect(screen.getByRole('heading', { name: 'Subscription & Billing', level: 2 })).toBeInTheDocument();
    });

    it('displays profile menu item description', () => {
      renderSettings();

      expect(screen.getByText(/manage your display name and profile information/i)).toBeInTheDocument();
    });

    it('displays billing menu item description', () => {
      renderSettings();

      expect(screen.getByText(/manage your subscription plan and payment methods/i)).toBeInTheDocument();
    });

    it('profile link points to /settings/profile', () => {
      renderSettings();

      const link = screen.getByRole('link', { name: /navigate to profile settings/i });
      expect(link).toHaveAttribute('href', '/settings/profile');
    });

    it('billing link points to /settings/billing', () => {
      renderSettings();

      const link = screen.getByRole('link', { name: /navigate to subscription & billing settings/i });
      expect(link).toHaveAttribute('href', '/settings/billing');
    });
  });

  describe('Back to Dashboard', () => {
    it('renders back to dashboard link', () => {
      renderSettings();

      expect(screen.getByRole('link', { name: /back to dashboard/i })).toBeInTheDocument();
    });

    it('back link points to /dashboard', () => {
      renderSettings();

      const link = screen.getByRole('link', { name: /back to dashboard/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Accessibility', () => {
    it('has proper landmark roles', () => {
      renderSettings();

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has navigation landmark', () => {
      renderSettings();

      expect(screen.getByRole('navigation', { name: /settings navigation/i })).toBeInTheDocument();
    });

    it('settings menu items are in a list', () => {
      renderSettings();

      const list = screen.getByRole('list');
      const listItems = screen.getAllByRole('listitem');

      expect(list).toBeInTheDocument();
      expect(listItems.length).toBe(2);
    });

    it('links have focus styles', () => {
      renderSettings();

      const links = screen.getAllByRole('link');

      // Settings links should have focus ring classes
      const settingsLinks = links.filter(link => link.getAttribute('href')?.startsWith('/settings/'));
      settingsLinks.forEach(link => {
        expect(link).toHaveClass('focus:ring-2');
      });
    });
  });
});
