/**
 * Document indexing utilities
 *
 * Prepares chunks for storage in pgvector and full-text search.
 *
 * @module pipeline/indexDocument
 */

import type { DocumentChunk } from '../types/index.js';

/**
 * Prepare chunks for database indexing
 *
 * Adds search_vector (tsvector) content and validates embeddings.
 */
export function prepareChunksForIndexing(chunks: DocumentChunk[]): {
  chunk: DocumentChunk;
  searchVector: string;
  validated: boolean;
}[] {
  return chunks.map((chunk) => {
    // Validate embedding
    const validated =
      chunk.embedding != null &&
      Array.isArray(chunk.embedding) &&
      chunk.embedding.length > 0 &&
      chunk.embedding.every((n) => typeof n === 'number' && !isNaN(n));

    // Generate PostgreSQL tsvector content
    // In production, this is done by a DB trigger. Here we prepare the text.
    const searchVector = normalizeForSearch(chunk.textContent);

    return { chunk, searchVector, validated };
  });
}

/**
 * Normalize text for full-text search
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build PostgreSQL insert values for document chunks
 */
export function buildChunkInsertValues(
  chunks: DocumentChunk[],
  tenantId: string
): {
  id: string;
  tenant_id: string;
  project_id: string;
  document_id: string;
  page_number: number;
  chunk_index: number;
  text_content: string;
  embedding: number[];
  search_vector: string;
  metadata: string;
}[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    tenant_id: tenantId,
    project_id: chunk.projectId,
    document_id: chunk.documentId,
    page_number: chunk.pageNumber,
    chunk_index: chunk.chunkIndex,
    text_content: chunk.textContent,
    embedding: chunk.embedding ?? [],
    search_vector: normalizeForSearch(chunk.textContent),
    metadata: JSON.stringify(chunk.metadata ?? {}),
  }));
}

/**
 * Validate that all chunks have valid embeddings
 */
export function validateEmbeddings(chunks: DocumentChunk[]): {
  valid: DocumentChunk[];
  invalid: DocumentChunk[];
} {
  const valid: DocumentChunk[] = [];
  const invalid: DocumentChunk[] = [];

  for (const chunk of chunks) {
    if (
      chunk.embedding &&
      Array.isArray(chunk.embedding) &&
      chunk.embedding.length > 0 &&
      chunk.embedding.every((n) => typeof n === 'number' && !isNaN(n))
    ) {
      valid.push(chunk);
    } else {
      invalid.push(chunk);
    }
  }

  return { valid, invalid };
}
