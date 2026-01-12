/**
 * @fileoverview Express application configuration.
 * Sets up middleware pipeline and routes for the PLPG API.
 *
 * @module @plpg/api/app
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { loggerMiddleware } from './middleware/logger.middleware';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { routes } from './routes';

/**
 * Creates and configures the Express application.
 *
 * @returns {Express} Configured Express application
 */
export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );

  // Request parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Logging
  app.use(loggerMiddleware);

  // Rate limiting
  app.use(rateLimiter);

  // API routes
  app.use('/api/v1', routes);

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
