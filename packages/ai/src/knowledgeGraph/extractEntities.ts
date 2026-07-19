/**
 * Entity Extraction for Knowledge Graph
 *
 * @module knowledgeGraph/extractEntities
 */

import type { AIProvider, DocumentChunk } from '../types/index.js';
import { extractEntitiesFromChunks } from '../chains/extractEntities.js';

/**
 * Extract entities from document chunks for knowledge graph building
 * This is a convenience re-export from the chains module.
 */
export { extractEntitiesFromChunks };

/**
 * Extract entities from a single chunk
 */
export async function extractEntitiesFromChunk(
  ai: AIProvider,
  chunk: DocumentChunk
): Promise<
  {
    entities: {
      id: string;
      type: string;
      label: string;
      confidence: number;
      occurrences: { page: number; text: string }[];
    }[];
  }
> {
  return extractEntitiesFromChunks(ai, [chunk]);
}
