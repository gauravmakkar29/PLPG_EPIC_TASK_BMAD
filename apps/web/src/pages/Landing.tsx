/**
 * @fileoverview Landing page component for PLPG.
 * Marketing page introducing the platform to potential users.
 *
 * @module @plpg/web/pages/Landing
 */

import { Link } from 'react-router-dom';

import type { JSX } from 'react';

/**
 * Landing page component.
 * Displays the marketing content and call-to-action buttons.
 */
export function Landing(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-white text-2xl font-bold">PLPG</div>
          <div className="flex items-center gap-4">
            <Link
              className="text-white hover:text-primary-200 transition-colors"
              to="/signin"
            >
              Sign In
            </Link>
            <Link
              className="btn bg-accent-500 text-white hover:bg-accent-600 px-4 py-2 rounded-md"
              to="/signup"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6 text-balance">
            Your Personalized Path to Machine Learning Mastery
          </h1>
          <p className="text-xl text-primary-100 mb-10">
            Transform from Backend Developer to ML Engineer with a customized
            learning roadmap tailored to your experience and schedule.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              className="btn-accent px-8 py-3 text-lg rounded-lg"
              to="/signup"
            >
              Start Your Journey
            </Link>
            <Link
              className="btn text-white border border-white/30 hover:bg-white/10 px-8 py-3 text-lg rounded-lg"
              to="#features"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            description="Get a learning path customized to your current skills and available time."
            icon="🎯"
            title="Personalized Roadmap"
          />
          <FeatureCard
            description="Access hand-picked tutorials, videos, and documentation for each skill."
            icon="📚"
            title="Curated Resources"
          />
          <FeatureCard
            description="Monitor your advancement with visual progress indicators and milestones."
            icon="📈"
            title="Track Progress"
          />
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-primary-200">
        <p>&copy; 2026 PLPG. All rights reserved.</p>
      </footer>
    </div>
  );
}

/**
 * Feature card component for the landing page.
 */
function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}): JSX.Element {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-primary-100">{description}</p>
    </div>
  );
}
