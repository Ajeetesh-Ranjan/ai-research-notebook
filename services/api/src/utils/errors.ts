/**
 * Custom API errors with structured error codes.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly retryAfter?: number;
  public readonly action?: 'retry' | 'reload' | 'contact_support' | 'none';

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: unknown,
    retryAfter?: number,
    action?: 'retry' | 'reload' | 'contact_support' | 'none'
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.retryAfter = retryAfter;
    this.action = action;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details, undefined, 'none');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message, 401, undefined, undefined, 'reload');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403, undefined, undefined, 'none');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404, undefined, undefined, 'none');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super('RATE_LIMITED', 'Too many requests. Please try again later.', 429, undefined, retryAfter, 'retry');
  }
}

export class AIProviderError extends AppError {
  constructor(message: string = 'AI service temporarily unavailable') {
    super('AI_ERROR', message, 502, undefined, 5, 'retry');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict detected') {
    super('CONFLICT', message, 409, undefined, undefined, 'none');
  }
}

/**
 * Generate a unique request ID.
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
