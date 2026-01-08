/**
 * @fileoverview Global error handling middleware.
 * Catches and formats all errors into consistent API responses.
 *
 * @module @plpg/api/middleware/errorHandler
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@plpg/shared';
import { logger } from '../lib/logger';

/**
 * Error response structure.
 */
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
}

/**
 * Global error handling middleware.
 * Handles AppError instances and unknown errors uniformly.
 *
 * @param err - The error that occurred
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (unused but required for error middleware signature)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error(
    {
      error: err,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    },
    'Request error'
  );

  // Handle AppError instances
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: err.name,
      message: err.message,
      code: err.code,
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    res.status(err.status).json(response);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as Error & { code?: string };
    let message = 'Database operation failed';
    let statusCode = 500;

    // Handle common Prisma error codes
    switch (prismaError.code) {
      case 'P2002':
        message = 'A record with this value already exists';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        statusCode = 400;
        break;
    }

    res.status(statusCode).json({
      error: 'DatabaseError',
      message,
      code: prismaError.code,
    });
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    error: 'InternalServerError',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}
