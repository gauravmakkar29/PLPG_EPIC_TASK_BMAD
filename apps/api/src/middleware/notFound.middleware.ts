/**
 * @fileoverview 404 Not Found handler middleware.
 * Returns a consistent error response for unknown routes.
 *
 * @module @plpg/api/middleware/notFound
 */

import type { Request, Response } from 'express';

/**
 * Not found handler middleware.
 * Returns 404 for any route not matched by the router.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
