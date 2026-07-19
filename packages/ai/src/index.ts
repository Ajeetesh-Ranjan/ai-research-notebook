/**
 * CiteMind AI Package
 *
 * Main entry point — exports all AI capabilities.
 *
 * @package @citemind/ai
 */

// Types
export type {
  AIProviderName,
  MessageRole,
  ChatMessage,
  ToolCall,
  ChatOptions,
  ToolDefinition,
  ChatResponse,
  TokenUsage,
  EmbedOptions,
  SummarizeOptions,
  ExtractOptions,
  SourceCitation,
  DocumentChunk,
  ChunkMetadata,
  BoundingBox,
  Page,
  PDFChar,
  DocumentMetadata,
  ProcessDocumentInput,
  ProcessDocumentOutput,
  ChunkingStrategy,
  ChunkingConfig,
  DocumentChatInput,
  DocumentChatOutput,
  SemanticSearchInput,
  SemanticSearchResult,
  MultiDocumentInput,
  MultiDocumentOutput,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  KnowledgeGraph,
  BuildGraphInput,
  ParsedCitation,
  CitationStyle,
  FormattedCitation,
  AIProviderConfig,
  AIPackageConfig,
} from './types/index.js';

// Providers
export { AIProvider } from './providers/base.js';
export { OpenAIProvider } from './providers/openai.js';
export { AnthropicProvider } from './providers/anthropic.js';
export { MockProvider, type MockProviderConfig } from './providers/mock.js';

// Chains
export { documentChat, estimateChatCost } from './chains/documentChat.js';
export { summarizeDocument, summarizeDocumentMulti, extractSections, type SummaryResult } from './chains/summarize.js';
export { multiDocumentSynthesis } from './chains/multiDocument.js';
export { extractEntitiesFromChunks, extractEntitiesFromText } from './chains/extractEntities.js';

// Embeddings
export { chunkText, chunkPages, detectChunkingStrategy, DEFAULT_CHUNKING_CONFIG } from './embeddings/chunker.js';
export { generateEmbeddings, generateQueryEmbedding, cosineSimilarity, dotProductSimilarity, findTopKChunks } from './embeddings/generate.js';
export { semanticSearch } from './embeddings/search.js';

// Pipeline
export { extractTextFromPDF, extractTextFromBuffer } from './pipeline/extractText.js';
export { chunkDocument, chunkTextContent } from './pipeline/chunkDocument.js';
export { processDocument, processDocumentBuffer } from './pipeline/processDocument.js';
export { prepareChunksForIndexing, normalizeForSearch, buildChunkInsertValues, validateEmbeddings } from './pipeline/indexDocument.js';

// Knowledge Graph
export { buildKnowledgeGraph, suggestConnections } from './knowledgeGraph/buildGraph.js';
export { extractEntitiesFromChunk } from './knowledgeGraph/extractEntities.js';
export { extractRelationsFromChunks } from './knowledgeGraph/extractRelations.js';

// Citations
export { extractCitationsFromText, extractCitationsFromChunk, deduplicateCitations } from './citations/extractCitations.js';
export { formatCitation, formatBibliography } from './citations/formatCitation.js';

// Prompts
export { DOCUMENT_CHAT_SYSTEM_PROMPT, buildRAGPrompt, buildMultiDocumentPrompt, generateSuggestedFollowups } from './prompts/chat.js';
export { SUMMARIZATION_SYSTEM_PROMPT, executiveSummaryPrompt, detailedSummaryPrompt, bulletSummaryPrompt, abstractSummaryPrompt, keyFindingsPrompt, methodologyPrompt, limitationsPrompt } from './prompts/summary.js';
export { QA_SYSTEM_PROMPT, directQAPrompt, factCheckPrompt, extractInfoPrompt } from './prompts/qa.js';
export { ENTITY_EXTRACTION_SYSTEM_PROMPT, EntityExtractionSchema, type EntityExtractionOutput, extractEntitiesPrompt, buildRelationsPrompt, PII_REDaction_PROMPT } from './prompts/entities.js';

// Utils
export {
  estimateTokenCount,
  estimateMessagesTokenCount,
  exceedsTokenLimit,
  truncateToTokenLimit,
  calculateAvailableContext,
  fitChunksToTokenBudget,
} from './utils/tokenizer.js';
export {
  AIError,
  ProviderError,
  RateLimitError,
  TokenLimitError,
  DocumentProcessingError,
  EmbeddingError,
  SearchError,
  CitationError,
  withRetry,
  sleep,
  safeExecute,
} from './utils/errors.js';

// Factory
import type { AIProvider, AIProviderConfig, AIProviderName } from './types/index.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { MockProvider } from './providers/mock.js';

/**
 * Create an AI provider instance based on configuration
 */
export function createAIProvider(config?: {
  provider?: AIProviderName;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  embeddingModel?: string;
}): AIProvider {
  const provider = config?.provider ?? getProviderFromEnv();
  const apiKey = config?.apiKey ?? getApiKeyFromEnv(provider);

  switch (provider) {
    case 'openai': {
      if (!apiKey) {
        console.warn('No OpenAI API key provided, falling back to mock provider');
        return new MockProvider();
      }
      return new OpenAIProvider({
        apiKey,
        baseUrl: config?.baseUrl ?? process.env.OPENAI_BASE_URL,
        model: config?.model,
        embeddingModel: config?.embeddingModel,
      });
    }
    case 'anthropic': {
      if (!apiKey) {
        console.warn('No Anthropic API key provided, falling back to mock provider');
        return new MockProvider();
      }
      return new AnthropicProvider({
        apiKey,
        baseUrl: config?.baseUrl ?? process.env.ANTHROPIC_BASE_URL,
        model: config?.model,
      });
    }
    case 'mock':
    default:
      return new MockProvider();
  }
}

/** Get provider from environment */
function getProviderFromEnv(): AIProviderName {
  const env = process.env.AI_PROVIDER?.toLowerCase();
  if (env === 'openai' || env === 'anthropic' || env === 'mock') {
    return env;
  }
  return 'mock';
}

/** Get API key from environment for provider */
function getApiKeyFromEnv(provider: AIProviderName): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'mock':
      return undefined;
    default:
      return undefined;
  }
}
