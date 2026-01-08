/**
 * @fileoverview Server entry point for the PLPG API.
 * Starts the Express server and handles graceful shutdown.
 *
 * @module @plpg/api/server
 */

import { createApp } from './app';
import { logger } from './lib/logger';
import { disconnectPrisma } from './lib/prisma';

const PORT = process.env.PORT || 3001;

const app = createApp();

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, `Server started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
});

/**
 * Graceful shutdown handler.
 * Closes server connections and disconnects from database.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectPrisma();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});
