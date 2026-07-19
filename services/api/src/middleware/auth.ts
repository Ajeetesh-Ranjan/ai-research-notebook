import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { verifyJWT, extractBearerToken } from '../utils/helpers.js';
import { AuthenticationError } from '../utils/errors.js';

/**
 * JWT authentication middleware.
 * Verifies the Bearer token and attaches the user to the request.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new AuthenticationError('Missing authentication token');
    }

    const payload = verifyJWT(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      tenantId: payload.tenantId,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Invalid or expired token'));
    }
  }
}

/**
 * Optional authentication middleware.
 * Attaches user if token is present, but allows anonymous requests.
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (token) {
      const payload = verifyJWT(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        tenantId: payload.tenantId,
        role: payload.role,
      };
    }

    next();
  } catch {
    next();
  }
}
