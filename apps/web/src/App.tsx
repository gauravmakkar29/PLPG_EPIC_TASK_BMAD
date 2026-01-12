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
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Settings } from './pages/Settings';
import { ProfilePage } from './pages/Settings/Profile';
import { Onboarding } from './pages/Onboarding';

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
        {/* Auth routes */}
        <Route element={<SignIn />} path="/sign-in" />
        <Route element={<SignUp />} path="/signup" />
        <Route element={<SignUp />} path="/sign-up" />
        <Route element={<ForgotPassword />} path="/forgot-password" />
        <Route element={<ResetPassword />} path="/reset-password/:token" />
        {/* Onboarding routes - AIRE-234 */}
        <Route element={<Onboarding />} path="/onboarding" />
        {/* Dashboard routes - to be implemented in Epic 4 */}
        <Route element={<div>Dashboard - Coming Soon</div>} path="/dashboard" />
        {/* Settings routes */}
        <Route element={<Settings />} path="/settings" />
        <Route element={<ProfilePage />} path="/settings/profile" />
        {/* 404 fallback */}
        <Route element={<NotFound />} path="*" />
      </Routes>
    </AuthProvider>
  );
}
