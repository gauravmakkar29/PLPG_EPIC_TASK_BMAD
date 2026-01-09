/**
 * @fileoverview Tests for the Landing page component.
 * Example test demonstrating component testing patterns.
 *
 * @module @plpg/web/pages/Landing.test
 */

import { describe, it, expect } from 'vitest';

import { render, screen } from '../test/utils';

import { Landing } from './Landing';

describe('Landing Page', () => {
  /**
   * Tests that the Landing page renders the main heading.
   */
  it('renders the main heading', () => {
    render(<Landing />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /personalized path to machine learning/i,
      })
    ).toBeInTheDocument();
  });

  /**
   * Tests that the page contains the main content area.
   */
  it('displays the main content area', () => {
    render(<Landing />);

    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
  });

  /**
   * Tests that navigation Sign In link is present.
   */
  it('has a Sign In navigation link', () => {
    render(<Landing />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/signin');
  });

  /**
   * Tests that Get Started button links to signup.
   */
  it('has a Get Started button linking to signup', () => {
    render(<Landing />);

    const getStartedLink = screen.getByRole('link', { name: /get started/i });
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink).toHaveAttribute('href', '/signup');
  });

  /**
   * Tests that feature cards are rendered.
   */
  it('displays feature cards', () => {
    render(<Landing />);

    expect(screen.getByText('Personalized Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Curated Resources')).toBeInTheDocument();
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
  });

  /**
   * Tests that the footer is present.
   */
  it('displays the footer', () => {
    render(<Landing />);

    expect(screen.getByText(/2026 PLPG/)).toBeInTheDocument();
  });
});
