/**
 * Relation Extraction for Knowledge Graph
 *
 * @module knowledgeGraph/extractRelations
 */

import type { AIProvider, DocumentChunk } from '../types/index.js';

/**
 * Extract relations between entities from chunks
 */
export async function extractRelationsFromChunks(
  ai: AIProvider,
  chunks: DocumentChunk[]
): Promise<
  {
    relations: {
      source: string;
      target: string;
      type: string;
      confidence: number;
      evidence: string;
    }[];
  }
> {
  const allRelations: {
    source: string;
    target: string;
    type: string;
    confidence: number;
    evidence: string;
  }[] = [];

  for (const chunk of chunks) {
    if (chunk.textContent.length < 100) continue;

    try {
      const prompt = `Extract relations between concepts in the following text. Return a JSON array of relations: [{source, target, type, confidence (0-1), evidence}].\n\nText: ${chunk.textContent}`;

      const messages = [
        {
          role: 'system' as const,
          content: 'You are a relation extraction assistant. Identify how entities in the text relate to each other.',
        },
        { role: 'user' as const, content: prompt },
      ];

      const response = await ai.chat(messages, { temperature: 0.1, maxTokens: 800 });

      const parsed = parseRelationResponse(response.content);
      allRelations.push(...parsed);
    } catch {
      continue;
    }
  }

  return { relations: allRelations };
}

/** Parse relation extraction response */
function parseRelationResponse(text: string): {
  source: string;
  target: string;
  type: string;
  confidence: number;
  evidence: string;
}[] {
  try {
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (r): r is { source: string; target: string; type: string; confidence: number; evidence: string } =>
          r.source && r.target && r.type
      );
    }

    if (parsed.relations && Array.isArray(parsed.relations)) {
      return parsed.relations.filter(
        (r: Record<string, unknown>): r is { source: string; target: string; type: string; confidence: number; evidence: string } =>
          !!r.source && !!r.target && !!r.type
      );
    }

    return [];
  } catch {
    return [];
  }
}
