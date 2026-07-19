import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { RateLimitError } from '../utils/errors.js';

/**
 * Global rate limiter for API requests.
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
  handler: (_req: Request, _res: Response, _next: NextFunction): void => {
    throw new RateLimitError(Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000));
  },
});

/**
 * Stricter rate limiter for auth endpoints.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || 'unknown';
  },
  handler: (_req: Request, _res: Response, _next: NextFunction): void => {
    throw new RateLimitError(15 * 60);
  },
});

/**
 * Rate limiter for AI endpoints (higher latency, more expensive).
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
  handler: (_req: Request, _res: Response, _next: NextFunction): void => {
    throw new RateLimitError(60);
  },
});
