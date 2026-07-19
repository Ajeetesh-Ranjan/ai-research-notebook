# @citemind/ai — AI Engineering Package

CiteMind's AI abstraction layer providing document processing, RAG-based chat, semantic search, knowledge graph extraction, and citation management.

## Overview

This package is designed to be a **standalone library** that powers CiteMind's AI capabilities. It abstracts LLM providers (OpenAI, Anthropic), manages document pipelines (extract → chunk → embed → index), and provides intelligent research workflows.

## Features

- **AI Provider Abstraction** — Pluggable providers with automatic fallback
- **Document Processing Pipeline** — PDF text extraction, semantic chunking, embedding generation
- **Semantic Search** — Hybrid vector + full-text search with re-ranking
- **RAG Document Chat** — Grounded AI conversations with source citations
- **Summarization** — Executive, detailed, and bullet-point summaries
- **Multi-Document Synthesis** — Cross-document reasoning and comparison
- **Knowledge Graph Builder** — Entity and relation extraction for visual graph rendering
- **Citation Extraction** — Parse and format academic citations (APA, MLA, Chicago, IEEE)

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No* | OpenAI API key for GPT-4o and embeddings |
| `ANTHROPIC_API_KEY` | No* | Anthropic API key for Claude 3.5 Sonnet |
| `AI_PROVIDER` | No | Preferred provider: `openai`, `anthropic`, `mock` (default: `mock`) |
| `EMBEDDING_MODEL` | No | Embedding model name (default: `text-embedding-3-small`) |
| `CHAT_MODEL` | No | Chat model name (default: `gpt-4o`) |
| `MAX_TOKENS` | No | Max tokens per request (default: `4096`) |
| `CHUNK_SIZE` | No | Chunk size in tokens (default: `512`) |
| `CHUNK_OVERLAP` | No | Chunk overlap in tokens (default: `50`) |

\* At least one provider key required for production. Mock provider works offline.

## Quick Start

```typescript
import {
  createAIProvider,
  processDocument,
  documentChat,
  semanticSearch,
  buildKnowledgeGraph,
  extractCitations,
  formatCitation
} from '@citemind/ai';

// Initialize AI provider
const ai = createAIProvider({ provider: 'openai' });

// Process a PDF document
const doc = await processDocument({
  filePath: './paper.pdf',
  documentId: 'doc-123',
  projectId: 'proj-456',
  tenantId: 'tenant-abc'
});

// Chat with document context
const response = await documentChat({
  ai,
  query: 'What are the main findings?',
  documentChunks: doc.chunks,
  conversationHistory: []
});

// Search across documents
const results = await semanticSearch({
  ai,
  query: 'transformer architecture',
  projectId: 'proj-456',
  topK: 10
});
```

## Architecture

```
providers/     — LLM abstraction (OpenAI, Anthropic, Mock)
chains/        — LangChain-style orchestration (RAG, summarization, synthesis)
embeddings/    — Chunking, embedding generation, vector search
pipeline/      — Document processing (extract → chunk → embed → index)
knowledgeGraph/ — Entity/relation extraction and graph building
citations/     — Citation parsing and formatting
prompts/       — Prompt templates for all AI operations
types/         — Shared TypeScript interfaces
utils/         — Token counting, error handling, helpers
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:ci
```

## API Reference

### AI Provider

```typescript
interface AIProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  embed(texts: string[], options?: EmbedOptions): Promise<number[][]>;
  summarize(text: string, options?: SummarizeOptions): Promise<string>;
  extract<T>(text: string, schema: ZodSchema<T>): Promise<T>;
}
```

### Document Processing

```typescript
interface ProcessDocumentInput {
  filePath: string;
  documentId: string;
  projectId: string;
  tenantId: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

interface ProcessDocumentOutput {
  documentId: string;
  text: string;
  pages: Page[];
  chunks: DocumentChunk[];
  embeddings: number[][];
  metadata: DocumentMetadata;
}
```

### RAG Chat

```typescript
interface DocumentChatInput {
  ai: AIProvider;
  query: string;
  documentChunks: DocumentChunk[];
  conversationHistory: ChatMessage[];
  topK?: number;
  systemPrompt?: string;
}

interface DocumentChatOutput {
  response: string;
  sources: SourceCitation[];
  tokensUsed: number;
}
```

## License

MIT — CiteMind Project
