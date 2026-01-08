/**
 * @fileoverview Tailwind CSS preset for PLPG design system.
 * Contains all design tokens including colors, spacing, typography, and component defaults.
 *
 * @module @plpg/config/tailwind
 * @description Centralized design system tokens ensuring visual consistency across the application.
 *
 * @example
 * // In your tailwind.config.js
 * module.exports = {
 *   presets: [require('@plpg/config/tailwind')],
 *   content: ['./src/**\/*.{js,ts,jsx,tsx}'],
 * };
 *
 * @see {@link https://tailwindcss.com/docs/presets|Tailwind Presets}
 *
 * Design Tokens Reference (PRD Section 3.4):
 * - Primary: Deep Blue (#1E3A8A) - Main brand color, CTAs, links
 * - Accent: Emerald (#10B981) - Success states, progress indicators
 * - Warning: Amber (#F59E0B) - Warnings, attention states
 * - Spacing: 8px base grid system
 */

/**
 * PLPG Color Palette
 * @constant {Object}
 * @description Brand colors with semantic naming and accessibility-compliant shades
 */
const colors = {
  // Primary: Deep Blue - Brand identity, CTAs, interactive elements
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A', // Primary brand color
    950: '#172554',
    DEFAULT: '#1E3A8A',
  },

  // Accent: Emerald - Success, progress, positive actions
  accent: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Accent brand color
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
    DEFAULT: '#10B981',
  },

  // Warning: Amber - Alerts, warnings, attention
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warning brand color
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
    DEFAULT: '#F59E0B',
  },

  // Error: Red - Error states, destructive actions
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
    DEFAULT: '#EF4444',
  },

  // Neutral: Slate - Text, backgrounds, borders
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
};

/**
 * Spacing Scale - 8px base grid system
 * @constant {Object}
 * @description Consistent spacing values following 8px grid
 */
const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px', // Base unit
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px', // 2x base
  5: '20px',
  6: '24px', // 3x base
  7: '28px',
  8: '32px', // 4x base
  9: '36px',
  10: '40px', // 5x base
  11: '44px',
  12: '48px', // 6x base
  14: '56px',
  16: '64px', // 8x base
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
};

/**
 * Typography Scale
 * @constant {Object}
 * @description Font sizes and line heights for consistent typography
 */
const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
};

/**
 * Border Radius Scale
 * @constant {Object}
 * @description Consistent border radius values
 */
const borderRadius = {
  none: '0px',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
};

/**
 * Box Shadow Scale
 * @constant {Object}
 * @description Elevation levels for depth perception
 */
const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',
      ...colors,
    },
    spacing,
    fontSize,
    borderRadius,
    boxShadow,
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};
