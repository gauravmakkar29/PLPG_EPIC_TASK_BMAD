/**
 * @fileoverview Main App component with route definitions.
 * Configures React Router routes for the PLPG application.
 *
 * @module @plpg/web/App
 */

import { Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

import type { JSX } from 'react';

/**
 * Main application component.
 * Defines the route structure for the application.
 * Wraps all routes with AuthProvider to provide authentication context.
 *
 * @returns {JSX.Element} Application component with routes
 */
export function App(): JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Landing />} path="/" />
        {/* Auth routes - to be implemented in Epic 1 */}
        <Route element={<div>Sign In - Coming Soon</div>} path="/signin" />
        <Route element={<div>Sign Up - Coming Soon</div>} path="/signup" />
        {/* Onboarding routes - to be implemented in Epic 2 */}
        <Route
          element={<div>Onboarding - Coming Soon</div>}
          path="/onboarding"
        />
        {/* Dashboard routes - to be implemented in Epic 4 */}
        <Route element={<div>Dashboard - Coming Soon</div>} path="/dashboard" />
        {/* Settings routes - to be implemented in Epic 5 */}
        <Route element={<div>Settings - Coming Soon</div>} path="/settings" />
        {/* 404 fallback */}
        <Route element={<NotFound />} path="*" />
      </Routes>
    </AuthProvider>
  );
}
