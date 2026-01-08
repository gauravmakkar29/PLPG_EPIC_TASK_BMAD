/**
 * @fileoverview Tailwind CSS configuration for PLPG web application.
 * Extends the shared Tailwind preset from @plpg/config.
 *
 * @module @plpg/web/tailwind.config
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@plpg/config/tailwind')],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
