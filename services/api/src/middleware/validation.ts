import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware factory for validating request body against a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const details = result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid request body', details);
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory for validating request query parameters.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const details = result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid query parameters', details);
      }
      req.query = result.data as unknown as typeof req.query;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory for validating request parameters.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const details = result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Invalid URL parameters', details);
      }
      req.params = result.data as unknown as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware for parsing JSON fields that may be stringified in multipart/form-data.
 */
export function parseJSONFields(fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      fields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch {
            // Leave as string if not valid JSON
          }
        }
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
