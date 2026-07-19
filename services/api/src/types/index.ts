import { Request } from 'express';

/**
 * Standard API error response shape.
 */
export interface APIError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    retryAfter?: number;
    action?: 'retry' | 'reload' | 'contact_support' | 'none';
  };
}

/**
 * Authenticated user payload from JWT.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
  role: string;
}

/**
 * Extended Express request with authenticated user.
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * JWT token payload structure.
 */
export interface JWTPayload {
  sub: string;
  email: string;
  name: string | null;
  tenantId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Annotation types supported by the system.
 */
export type AnnotationType = 
  | 'highlight' 
  | 'underline' 
  | 'strikethrough' 
  | 'text_comment' 
  | 'area_comment' 
  | 'ink' 
  | 'signature';

/**
 * Knowledge graph node types.
 */
export type NodeType = 
  | 'document' 
  | 'note' 
  | 'highlight' 
  | 'concept' 
  | 'entity' 
  | 'topic' 
  | 'question';

/**
 * Knowledge graph edge types.
 */
export type EdgeType = 
  | 'cites' 
  | 'supports' 
  | 'contradicts' 
  | 'relates_to' 
  | 'contains' 
  | 'derived_from' 
  | 'answers';

/**
 * Export formats supported.
 */
export type ExportFormat = 
  | 'pdf' 
  | 'word' 
  | 'markdown' 
  | 'html' 
  | 'latex' 
  | 'powerpoint' 
  | 'bibliography';

/**
 * Export scope options.
 */
export type ExportScope = 'project' | 'document' | 'selection' | 'graph';

/**
 * AI provider interface.
 */
export interface AIProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  embed(texts: string[], options?: EmbedOptions): Promise<number[][]>;
  summarize(text: string, options?: SummarizeOptions): Promise<string>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  citations?: CitationSource[];
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export interface CitationSource {
  documentId: string;
  chunkId: string;
  text: string;
  pageNumber: number;
}

export interface EmbedOptions {
  model?: string;
}

export interface SummarizeOptions {
  type?: 'executive' | 'detailed' | 'bullets';
  maxLength?: number;
}

/**
 * Search request parameters.
 */
export interface SearchRequest {
  query: string;
  projectId: string;
  filters?: {
    documentIds?: string[];
    pageRange?: [number, number];
    dateRange?: [Date, Date];
    authors?: string[];
    tags?: string[];
  };
  searchType?: 'semantic' | 'lexical' | 'hybrid';
  topK?: number;
  includeHighlights?: boolean;
  rerank?: boolean;
}

/**
 * Search result shape.
 */
export interface SearchResult {
  id: string;
  documentId: string;
  pageNumber: number;
  textContent: string;
  score: number;
  document?: {
    title: string;
    authors: string[];
  };
}

/**
 * Document processing status.
 */
export type ProcessingStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'ocr_required';

/**
 * Export job status.
 */
export type ExportStatus = 
  | 'queued' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';
