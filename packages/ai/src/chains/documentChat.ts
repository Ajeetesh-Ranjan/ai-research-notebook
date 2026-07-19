/**
 * Document Chat Chain — RAG-based Q&A over documents
 *
 * Implements retrieval-augmented generation for single-document
 * and multi-document chat with source citations.
 *
 * @module chains/documentChat
 */

import type {
  AIProvider,
  ChatMessage,
  DocumentChunk,
  DocumentChatInput,
  DocumentChatOutput,
  SourceCitation,
} from '../types/index.js';
import {
  buildRAGPrompt,
  generateSuggestedFollowups,
} from '../prompts/chat.js';
import {
  estimateTokenCount,
  calculateAvailableContext,
  fitChunksToTokenBudget,
} from '../utils/tokenizer.js';
import { DocumentProcessingError } from '../utils/errors.js';

/**
 * Run a RAG-based chat over document chunks
 */
export async function documentChat(
  input: DocumentChatInput
): Promise<DocumentChatOutput> {
  const {
    ai,
    query,
    documentChunks,
    conversationHistory = [],
    topK = 5,
    systemPrompt,
    temperature = 0.2,
  } = input;

  if (documentChunks.length === 0) {
    throw new DocumentProcessingError(
      'No document chunks provided for chat',
      'unknown'
    );
  }

  // Select top chunks by simple relevance (in production, use vector similarity)
  const selectedChunks = selectRelevantChunks(query, documentChunks, topK);

  // Build the RAG prompt with context
  const messages = buildRAGPrompt(query, selectedChunks, conversationHistory);

  // Override system prompt if provided
  if (systemPrompt) {
    messages[0] = { role: 'system', content: systemPrompt };
  }

  // Call the AI provider
  const response = await ai.chat(messages, {
    temperature,
    maxTokens: 2048,
  });

  // Extract citations from the response
  const sources = extractCitationsFromResponse(response.content, selectedChunks);

  // Generate suggested follow-ups
  const suggestedFollowups = generateSuggestedFollowups(query, response.content);

  return {
    response: response.content,
    sources,
    tokensUsed: response.usage,
    suggestedFollowups,
  };
}

/**
 * Select relevant chunks for a query using keyword overlap
 * In production, this uses vector similarity search from the database.
 */
function selectRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number
): DocumentChunk[] {
  const queryWords = new Set(
    query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  const scored = chunks.map((chunk) => {
    const chunkWords = new Set(
      chunk.textContent
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
    );

    let overlap = 0;
    for (const word of queryWords) {
      if (chunkWords.has(word)) overlap++;
    }

    // Boost chunks with section headers or from early pages
    const sectionBoost = chunk.metadata?.isHeader ? 0.5 : 0;
    const pageBoost = chunk.pageNumber <= 3 ? 0.3 : 0;

    return { chunk, score: overlap + sectionBoost + pageBoost };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.chunk);
}

/**
 * Extract source citations from the AI response
 * Maps [1], [2] etc. back to actual chunk sources.
 */
function extractCitationsFromResponse(
  response: string,
  chunks: DocumentChunk[]
): SourceCitation[] {
  const citations: SourceCitation[] = [];
  const seen = new Set<string>();

  // Find all citation markers like [1], [2], etc.
  const matches = response.matchAll(/\[(\d+)\]/g);
  for (const match of matches) {
    const index = parseInt(match[1], 10) - 1;
    if (index >= 0 && index < chunks.length) {
      const chunk = chunks[index];
      if (!seen.has(chunk.id)) {
        seen.add(chunk.id);
        citations.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          pageNumber: chunk.pageNumber,
          text: chunk.textContent.slice(0, 300),
          score: 1.0,
        });
      }
    }
  }

  return citations;
}

/**
 * Estimate token cost for a document chat session
 */
export function estimateChatCost(
  query: string,
  chunks: DocumentChunk[],
  history: ChatMessage[]
): { estimatedTokens: number; estimatedCost: number } {
  const queryTokens = estimateTokenCount(query);
  const chunksTokens = chunks.reduce(
    (sum, c) => sum + estimateTokenCount(c.textContent),
    0
  );
  const historyTokens = history.reduce(
    (sum, m) => sum + estimateTokenCount(m.content),
    0
  );
  const total = queryTokens + chunksTokens + historyTokens + 500; // 500 for system prompt

  // Rough cost estimate: $0.005 per 1K tokens for GPT-4o
  const cost = (total / 1000) * 0.005;

  return { estimatedTokens: total, estimatedCost: cost };
}
