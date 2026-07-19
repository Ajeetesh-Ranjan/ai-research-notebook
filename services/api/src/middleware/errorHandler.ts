import { Request, Response, NextFunction } from 'express';
import { AppError, generateRequestId } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * Global error handling middleware.
 * Catches all errors and formats them into structured JSON responses.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  // Log error details
  console.error({
    timestamp,
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as AuthenticatedRequest).user?.id,
    tenantId: (req as AuthenticatedRequest).user?.tenantId,
  });

  // Handle known AppErrors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
        retryAfter: err.retryAfter,
        action: err.action,
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: (err as any).errors,
        requestId,
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid or expired token',
        requestId,
        action: 'reload',
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          requestId,
        },
      });
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          requestId,
        },
      });
      return;
    }
  }

  // Default: 500 Internal Server Error
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
      details: isDev ? err.message : undefined,
      requestId,
      action: 'retry',
    },
  });
}

/**
 * 404 not found handler for unmatched routes.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: generateRequestId(),
    },
  });
}
