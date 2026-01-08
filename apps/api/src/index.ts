/**
 * @fileoverview Main entry point for the PLPG API server.
 * Re-exports server startup for programmatic usage.
 *
 * @module @plpg/api
 */

// Start the server
import './server';

// Export app for testing
export { createApp } from './app';
