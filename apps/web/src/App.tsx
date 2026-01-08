/**
 * @fileoverview Main App component with route definitions.
 * Configures React Router routes for the PLPG application.
 *
 * @module @plpg/web/App
 */

import { Routes, Route } from 'react-router-dom';

import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

/**
 * Main application component.
 * Defines the route structure for the application.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* Auth routes - to be implemented in Epic 1 */}
      <Route path="/signin" element={<div>Sign In - Coming Soon</div>} />
      <Route path="/signup" element={<div>Sign Up - Coming Soon</div>} />
      {/* Onboarding routes - to be implemented in Epic 2 */}
      <Route path="/onboarding" element={<div>Onboarding - Coming Soon</div>} />
      {/* Dashboard routes - to be implemented in Epic 4 */}
      <Route path="/dashboard" element={<div>Dashboard - Coming Soon</div>} />
      {/* Settings routes - to be implemented in Epic 5 */}
      <Route path="/settings" element={<div>Settings - Coming Soon</div>} />
      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
