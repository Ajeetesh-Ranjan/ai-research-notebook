/**
 * Multi-Document Synthesis Chain
 *
 * Compares, synthesizes, or analyzes contradictions across multiple documents.
 *
 * @module chains/multiDocument
 */

import type {
  AIProvider,
  ChatMessage,
  DocumentChunk,
  MultiDocumentInput,
  MultiDocumentOutput,
} from '../types/index.js';
import { MULTI_DOCUMENT_SYSTEM_PROMPT, buildMultiDocumentPrompt } from '../prompts/chat.js';

/**
 * Synthesize information across multiple documents
 */
export async function multiDocumentSynthesis(
  input: MultiDocumentInput
): Promise<MultiDocumentOutput> {
  const {
    ai,
    query,
    documents,
    synthesisType = 'synthesize',
    conversationHistory = [],
  } = input;

  if (documents.length === 0) {
    throw new Error('At least one document is required for synthesis');
  }

  // Select top chunks from each document
  const selectedDocs = documents.map((doc, i) => {
    const label = String.fromCharCode(65 + i); // A, B, C...
    const topChunks = selectTopChunks(query, doc.chunks, 3);
    return {
      label,
      title: doc.title,
      chunks: topChunks,
    };
  });

  // Build the synthesis prompt
  const prompt = buildSynthesisPrompt(query, selectedDocs, synthesisType);

  const messages: ChatMessage[] = [
    { role: 'system', content: MULTI_DOCUMENT_SYSTEM_PROMPT },
    ...conversationHistory.slice(-4),
    { role: 'user', content: prompt },
  ];

  const response = await ai.chat(messages, {
    temperature: 0.2,
    maxTokens: 2048,
  });

  // Calculate relevance scores for each document
  const sourceDocuments = documents.map((doc, i) => ({
    documentId: doc.documentId,
    title: doc.title,
    relevanceScore: calculateRelevanceScore(query, doc.chunks),
  }));

  sourceDocuments.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    response: response.content,
    sourceDocuments,
    tokensUsed: response.usage,
    synthesisType,
  };
}

/**
 * Build a synthesis prompt based on the type of analysis requested
 */
function buildSynthesisPrompt(
  query: string,
  docs: { label: string; title: string; chunks: DocumentChunk[] }[],
  synthesisType: string
): string {
  const basePrompt = buildMultiDocumentPrompt(query, docs);

  const typeInstructions: Record<string, string> = {
    compare:
      'Focus on comparing and contrasting the approaches, findings, and conclusions across documents. Highlight similarities and differences.',
    synthesize:
      'Synthesize the information into a coherent whole. Identify overarching themes and integrated conclusions.',
    find_gaps:
      'Identify gaps in the literature. What questions remain unanswered? What areas need further research?',
    find_contradictions:
      'Explicitly identify contradictions, disagreements, or conflicting findings between the documents. Assess the strength of evidence on each side.',
  };

  const instruction = typeInstructions[synthesisType] ?? typeInstructions.synthesize;

  return `${basePrompt}\n\nINSTRUCTION: ${instruction}`;
}

/**
 * Select top chunks from a document based on keyword relevance
 */
function selectTopChunks(
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

    let score = 0;
    for (const word of queryWords) {
      if (chunkWords.has(word)) score++;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.chunk);
}

/**
 * Calculate a simple relevance score for a document
 */
function calculateRelevanceScore(query: string, chunks: DocumentChunk[]): number {
  const queryWords = new Set(
    query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  let totalScore = 0;
  for (const chunk of chunks) {
    const chunkWords = new Set(
      chunk.textContent
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
    );

    for (const word of queryWords) {
      if (chunkWords.has(word)) totalScore += 1;
    }
  }

  return totalScore / Math.max(chunks.length, 1);
}
