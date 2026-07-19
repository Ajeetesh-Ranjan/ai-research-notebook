/**
 * Core AI types for CiteMind
 *
 * @module types
 */

import { z } from 'zod';

/** Supported AI providers */
export type AIProviderName = 'openai' | 'anthropic' | 'mock' | 'azure';

/** Role in a chat conversation */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** A single chat message */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

/** A tool call from the LLM */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/** Options for chat completion */
export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  systemPrompt?: string;
  tools?: ToolDefinition[];
}

/** Definition of a tool for function calling */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: z.ZodType<unknown>;
  };
}

/** Response from a chat completion */
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: TokenUsage;
  model: string;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'other';
}

/** Token usage statistics */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Options for embedding generation */
export interface EmbedOptions {
  model?: string;
  dimensions?: number;
  batchSize?: number;
}

/** Options for summarization */
export interface SummarizeOptions {
  type?: 'executive' | 'detailed' | 'bullet' | 'abstract';
  maxLength?: number;
  focus?: string;
  language?: string;
}

/** Options for structured extraction */
export interface ExtractOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

/** A source citation returned from RAG */
export interface SourceCitation {
  chunkId: string;
  documentId: string;
  documentTitle?: string;
  pageNumber?: number;
  text: string;
  score: number;
}

/** A document chunk with embedding */
export interface DocumentChunk {
  id: string;
  documentId: string;
  projectId: string;
  tenantId: string;
  pageNumber: number;
  chunkIndex: number;
  textContent: string;
  embedding?: number[];
  metadata?: ChunkMetadata;
  createdAt: Date;
}

/** Metadata attached to a chunk */
export interface ChunkMetadata {
  section?: string;
  bbox?: BoundingBox;
  fontSize?: number;
  isHeader?: boolean;
  isFooter?: boolean;
  isCitation?: boolean;
  surroundingContext?: string;
  parentChunk?: string;
}

/** Bounding box for PDF coordinates */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A page extracted from a PDF */
export interface Page {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
  chars?: PDFChar[];
}

/** A character in PDF text layer */
export interface PDFChar {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
}

/** Document metadata extracted from PDF or AI */
export interface DocumentMetadata {
  title?: string;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
  year?: number;
  doi?: string;
  journal?: string;
  publisher?: string;
  language?: string;
  pageCount?: number;
  extractedAt: Date;
}

/** Input for document processing pipeline */
export interface ProcessDocumentInput {
  filePath: string;
  documentId: string;
  projectId: string;
  tenantId: string;
  chunkSize?: number;
  chunkOverlap?: number;
  strategy?: ChunkingStrategy;
}

/** Output from document processing pipeline */
export interface ProcessDocumentOutput {
  documentId: string;
  projectId: string;
  tenantId: string;
  text: string;
  pages: Page[];
  chunks: DocumentChunk[];
  embeddings: number[][];
  metadata: DocumentMetadata;
}

/** Chunking strategy */
export type ChunkingStrategy = 'recursive' | 'semantic' | 'fixed' | 'hybrid';

/** Configuration for chunking */
export interface ChunkingConfig {
  strategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
  preserveStructure?: boolean;
  addMetadata?: boolean;
}

/** Input for RAG document chat */
export interface DocumentChatInput {
  ai: AIProvider;
  query: string;
  documentChunks: DocumentChunk[];
  conversationHistory?: ChatMessage[];
  topK?: number;
  systemPrompt?: string;
  temperature?: number;
}

/** Output from RAG document chat */
export interface DocumentChatOutput {
  response: string;
  sources: SourceCitation[];
  tokensUsed: TokenUsage;
  suggestedFollowups?: string[];
}

/** Input for semantic search */
export interface SemanticSearchInput {
  ai: AIProvider;
  query: string;
  projectId: string;
  tenantId?: string;
  documentIds?: string[];
  topK?: number;
  searchType?: 'semantic' | 'lexical' | 'hybrid';
  rerank?: boolean;
}

/** Result from semantic search */
export interface SemanticSearchResult {
  chunk: DocumentChunk;
  semanticScore?: number;
  lexicalScore?: number;
  fusedScore: number;
  highlights?: string[];
}

/** Input for multi-document synthesis */
export interface MultiDocumentInput {
  ai: AIProvider;
  query: string;
  documents: { documentId: string; title: string; chunks: DocumentChunk[] }[];
  synthesisType?: 'compare' | 'synthesize' | 'find_gaps' | 'find_contradictions';
  conversationHistory?: ChatMessage[];
}

/** Output from multi-document synthesis */
export interface MultiDocumentOutput {
  response: string;
  sourceDocuments: { documentId: string; title: string; relevanceScore: number }[];
  tokensUsed: TokenUsage;
  synthesisType: string;
}

/** A node in the knowledge graph */
export interface KnowledgeGraphNode {
  id: string;
  type: 'document' | 'note' | 'highlight' | 'concept' | 'entity' | 'topic' | 'question' | 'author';
  label: string;
  content?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

/** An edge in the knowledge graph */
export interface KnowledgeGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'cites' | 'supports' | 'contradicts' | 'relates_to' | 'contains' | 'derived_from' | 'answers' | 'mentions' | 'authored_by';
  label?: string;
  strength?: number;
  metadata?: Record<string, unknown>;
}

/** A complete knowledge graph */
export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

/** Input for knowledge graph building */
export interface BuildGraphInput {
  ai: AIProvider;
  documentId: string;
  projectId: string;
  tenantId: string;
  chunks: DocumentChunk[];
  existingGraph?: KnowledgeGraph;
}

/** A parsed citation */
export interface ParsedCitation {
  raw: string;
  type: 'article-journal' | 'book' | 'chapter' | 'conference' | 'thesis' | 'web' | 'other';
  title?: string;
  authors?: { family?: string; given?: string; literal?: string }[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  confidence: number;
}

/** Supported citation styles */
export type CitationStyle = 'apa-7' | 'mla-9' | 'chicago-nb' | 'chicago-ad' | 'ieee' | 'harvard' | 'vancouver' | 'nature' | 'cell';

/** Formatted citation output */
export interface FormattedCitation {
  inText: string;
  bibliography: string;
  style: CitationStyle;
  footnote?: string;
}

/** AI provider interface */
export interface AIProvider {
  readonly name: string;
  readonly defaultChatModel: string;
  readonly defaultEmbeddingModel: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  embed(texts: string[], options?: EmbedOptions): Promise<number[][]>;
  summarize(text: string, options?: SummarizeOptions): Promise<string>;
  extract<T>(text: string, schema: z.ZodType<T>, options?: ExtractOptions): Promise<T>;
}

/** AI provider configuration */
export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  embeddingModel?: string;
  maxRetries?: number;
  timeout?: number;
}

/** Configuration for the AI package */
export interface AIPackageConfig {
  provider: AIProviderConfig;
  chunking: ChunkingConfig;
  search: {
    defaultTopK: number;
    rerankThreshold: number;
    hybridAlpha: number;
  };
  features: {
    enableMockFallback: boolean;
    enablePIIRedaction: boolean;
    maxConcurrentEmbeddings: number;
  };
}
