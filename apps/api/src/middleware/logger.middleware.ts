/**
 * @fileoverview HTTP request logging middleware using Pino.
 * Logs all incoming requests with relevant metadata.
 *
 * @module @plpg/api/middleware/logger
 */

import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

/**
 * HTTP request logging middleware.
 * Logs request/response details including method, URL, status, and duration.
 */
export const loggerMiddleware = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => {
      // Don't log health check requests in production
      return req.url === '/api/v1/health' && process.env.NODE_ENV === 'production';
    },
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
