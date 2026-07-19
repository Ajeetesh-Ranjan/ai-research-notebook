/**
 * Error classes and error handling utilities
 *
 * @module utils/errors
 */

/** Base error for AI package */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/** Error when an AI provider fails */
export class ProviderError extends AIError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    cause?: unknown
  ) {
    super(message, 'PROVIDER_ERROR', cause);
    this.name = 'ProviderError';
  }
}

/** Error when rate limit is exceeded */
export class RateLimitError extends AIError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, cause?: unknown) {
    super(message, 'RATE_LIMIT', cause);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/** Error when token limit is exceeded */
export class TokenLimitError extends AIError {
  constructor(message: string, public readonly requestedTokens: number, public readonly maxTokens: number) {
    super(message, 'TOKEN_LIMIT');
    this.name = 'TokenLimitError';
  }
}

/** Error when document processing fails */
export class DocumentProcessingError extends AIError {
  constructor(message: string, public readonly documentId: string, cause?: unknown) {
    super(message, 'DOCUMENT_PROCESSING_ERROR', cause);
    this.name = 'DocumentProcessingError';
  }
}

/** Error when embedding generation fails */
export class EmbeddingError extends AIError {
  constructor(message: string, cause?: unknown) {
    super(message, 'EMBEDDING_ERROR', cause);
    this.name = 'EmbeddingError';
  }
}

/** Error when search fails */
export class SearchError extends AIError {
  constructor(message: string, cause?: unknown) {
    super(message, 'SEARCH_ERROR', cause);
    this.name = 'SearchError';
  }
}

/** Error when citation parsing fails */
export class CitationError extends AIError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CITATION_ERROR', cause);
    this.name = 'CitationError';
  }
}

/** Retry a function with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Safely execute a function, returning null on failure */
export async function safeExecute<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
