/**
 * Embedding generation utilities
 *
 * @module embeddings/generate
 */

import type { AIProvider, DocumentChunk, EmbedOptions } from '../types/index.js';
import { EmbeddingError } from '../utils/errors.js';

/**
 * Generate embeddings for document chunks in batches
 */
export async function generateEmbeddings(
  ai: AIProvider,
  chunks: DocumentChunk[],
  options?: EmbedOptions
): Promise<DocumentChunk[]> {
  if (chunks.length === 0) return [];

  const batchSize = options?.batchSize ?? 100;
  const embeddings: number[][] = [];

  // Process in batches
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.textContent);

    try {
      const batchEmbeddings = await ai.embed(texts, options);
      embeddings.push(...batchEmbeddings);
    } catch (error) {
      throw new EmbeddingError(
        `Failed to generate embeddings for batch ${i / batchSize + 1}: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  // Attach embeddings to chunks
  return chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));
}

/**
 * Generate embedding for a single query string
 */
export async function generateQueryEmbedding(
  ai: AIProvider,
  query: string,
  options?: EmbedOptions
): Promise<number[]> {
  const embeddings = await ai.embed([query], options);
  if (embeddings.length === 0) {
    throw new EmbeddingError('Failed to generate query embedding');
  }
  return embeddings[0];
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute dot product similarity (for normalized vectors)
 */
export function dotProductSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Find top-k most similar chunks to a query embedding
 */
export function findTopKChunks(
  queryEmbedding: number[],
  chunks: DocumentChunk[],
  topK: number
): { chunk: DocumentChunk; score: number }[] {
  const scored = chunks
    .filter((c) => c.embedding != null)
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
