/**
 * Prompt templates for entity and knowledge graph extraction
 *
 * @module prompts/entities
 */

import { z } from 'zod';

/** System prompt for entity extraction */
export const ENTITY_EXTRACTION_SYSTEM_PROMPT = `You are an expert in natural language processing and knowledge extraction. Your task is to extract entities and relations from academic and professional documents.

ENTITY TYPES:
- person: Named individuals (researchers, authors, historical figures)
- organization: Institutions, companies, labs, universities
- concept: Theories, methods, frameworks, models, algorithms
- topic: Research areas, domains, fields of study
- method: Specific research methods, techniques, or procedures
- material: Physical or digital materials, datasets, tools
- finding: Specific results, discoveries, or conclusions
- claim: Assertions, hypotheses, or arguments made by authors

RELATION TYPES:
- authored_by: Document → Person
- published_in: Document → Organization
- uses_method: Document → Method
- studies_topic: Document → Topic
- proposes_concept: Document → Concept
- supports: Finding → Claim
- contradicts: Finding → Claim
- relates_to: Concept → Concept
- part_of: Concept → Topic
- evaluates: Document → Method
- applies: Method → Topic
- cites: Document → Document`;

/** Zod schema for entity extraction output */
export const EntityExtractionSchema = z.object({
  entities: z.array(
    z.object({
      id: z.string().describe('Unique identifier for the entity'),
      type: z.enum([
        'person',
        'organization',
        'concept',
        'topic',
        'method',
        'material',
        'finding',
        'claim',
      ]),
      label: z.string().describe('Human-readable name of the entity'),
      confidence: z.number().min(0).max(1).describe('Confidence score'),
      occurrences: z.array(
        z.object({
          page: z.number(),
          text: z.string(),
        })
      ),
    })
  ),
  relations: z.array(
    z.object({
      source: z.string().describe('Source entity ID'),
      target: z.string().describe('Target entity ID'),
      type: z.enum([
        'authored_by',
        'published_in',
        'uses_method',
        'studies_topic',
        'proposes_concept',
        'supports',
        'contradicts',
        'relates_to',
        'part_of',
        'evaluates',
        'applies',
        'cites',
      ]),
      confidence: z.number().min(0).max(1),
      evidence: z.string().describe('Text evidence for this relation'),
    })
  ),
});

export type EntityExtractionOutput = z.infer<typeof EntityExtractionSchema>;

/** Prompt for extracting entities from a document chunk */
export function extractEntitiesPrompt(chunk: string, pageNumber: number): string {
  return `Extract all entities and their relations from the following text excerpt (Page ${pageNumber}).

Return a JSON object with:
1. "entities": array of objects with {id, type, label, confidence, occurrences}
2. "relations": array of objects with {source, target, type, confidence, evidence}

Text excerpt:\n\n---\n\n${chunk}`;
}

/** Prompt for building relations between entities across chunks */
export function buildRelationsPrompt(
  entities: { id: string; label: string; type: string }[],
  chunks: { page: number; text: string }[]
): string {
  const entityList = entities.map((e) => `- ${e.id} (${e.type}): ${e.label}`).join('\n');
  const chunkList = chunks.map((c) => `Page ${c.page}:\n${c.text}`).join('\n\n---\n\n');

  return `Given the following entities and text excerpts, identify all relations between the entities.

Entities:\n${entityList}\n\nText Excerpts:\n${chunkList}\n\nReturn a JSON array of relations: {source, target, type, confidence, evidence}`;
}

/** Prompt for PII redaction */
export const PII_REDaction_PROMPT = `You are a privacy protection assistant. Review the following text and identify any personally identifiable information (PII).

PII CATEGORIES TO DETECT:
- Full names of individuals (not public figures in context)
- Email addresses
- Phone numbers
- Physical addresses
- Social security numbers or national IDs
- Dates of birth
- Financial account numbers
- Medical record numbers
- Biometric identifiers

INSTRUCTIONS:
1. Identify all PII in the text.
2. Return the exact text segments that contain PII.
3. Suggest redaction replacements (e.g., [REDACTED NAME], [REDACTED EMAIL]).
4. Do NOT redact: author names in academic citations, public figure names, institutional affiliations, or journal names.

Format your response as JSON: { "pii_segments": [{ "text": "...", "type": "...", "replacement": "..." }] }`;
