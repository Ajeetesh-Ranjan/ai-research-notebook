/**
 * Entity Extraction Chain
 *
 * Extracts structured entities and relations from document text.
 *
 * @module chains/extractEntities
 */

import type { AIProvider, DocumentChunk } from '../types/index.js';
import {
  EntityExtractionSchema,
  type EntityExtractionOutput,
  extractEntitiesPrompt,
} from '../prompts/entities.js';

/**
 * Extract entities and relations from document chunks
 */
export async function extractEntitiesFromChunks(
  ai: AIProvider,
  chunks: DocumentChunk[]
): Promise<EntityExtractionOutput> {
  const allEntities: EntityExtractionOutput['entities'] = [];
  const allRelations: EntityExtractionOutput['relations'] = [];
  let entityIdCounter = 0;

  for (const chunk of chunks) {
    if (chunk.textContent.length < 50) continue; // Skip very short chunks

    try {
      const prompt = extractEntitiesPrompt(chunk.textContent, chunk.pageNumber);
      const result = await ai.extract(
        prompt,
        EntityExtractionSchema,
        { temperature: 0.1, maxRetries: 2 }
      );

      // Merge entities, deduplicating by label + type
      for (const entity of result.entities) {
        const existing = allEntities.find(
          (e) => e.label.toLowerCase() === entity.label.toLowerCase() && e.type === entity.type
        );

        if (existing) {
          // Merge occurrences
          existing.occurrences.push(...entity.occurrences);
          existing.confidence = Math.max(existing.confidence, entity.confidence);
        } else {
          const newId = `e${entityIdCounter++}`;
          allEntities.push({ ...entity, id: newId });
        }
      }

      // Map relations to global IDs and add
      for (const relation of result.relations) {
        const sourceEntity = allEntities.find(
          (e) => e.label.toLowerCase() === relation.source.toLowerCase()
        );
        const targetEntity = allEntities.find(
          (e) => e.label.toLowerCase() === relation.target.toLowerCase()
        );

        if (sourceEntity && targetEntity) {
          allRelations.push({
            ...relation,
            source: sourceEntity.id,
            target: targetEntity.id,
          });
        }
      }
    } catch {
      // Skip chunks that fail extraction
      continue;
    }
  }

  return { entities: allEntities, relations: allRelations };
}

/**
 * Extract entities from a single text passage (for highlights, notes, etc.)
 */
export async function extractEntitiesFromText(
  ai: AIProvider,
  text: string
): Promise<Pick<EntityExtractionOutput, 'entities'>> {
  const prompt = `Extract named entities from the following text. Return JSON with entities array: {id, type, label, confidence, occurrences}.\n\nText: ${text}`;

  const result = await ai.extract(
    prompt,
    EntityExtractionSchema.pick({ entities: true }),
    { temperature: 0.1 }
  );

  return result;
}
