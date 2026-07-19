/**
 * Document chunking pipeline step
 *
 * @module pipeline/chunkDocument
 */

import type { DocumentChunk, Page, ChunkingConfig } from '../types/index.js';
import { chunkPages, DEFAULT_CHUNKING_CONFIG } from '../embeddings/chunker.js';

/**
 * Chunk document pages into retrievable segments
 */
export function chunkDocument(
  pages: Page[],
  documentId: string,
  projectId: string,
  tenantId: string,
  config?: Partial<ChunkingConfig>
): DocumentChunk[] {
  return chunkPages(pages, documentId, projectId, tenantId, config);
}

/**
 * Chunk raw text (for non-PDF sources)
 */
export function chunkTextContent(
  text: string,
  documentId: string,
  projectId: string,
  tenantId: string,
  config?: Partial<ChunkingConfig>
): DocumentChunk[] {
  const singlePage = [{ pageNumber: 1, text, width: 0, height: 0 }];
  return chunkPages(singlePage, documentId, projectId, tenantId, config);
}
