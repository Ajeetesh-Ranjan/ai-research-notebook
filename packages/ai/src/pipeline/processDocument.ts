/**
 * Full document processing pipeline
 *
 * Orchestrates: extract → chunk → embed → metadata
 *
 * @module pipeline/processDocument
 */

import type {
  AIProvider,
  ProcessDocumentInput,
  ProcessDocumentOutput,
} from '../types/index.js';
import { extractTextFromPDF, extractTextFromBuffer } from './extractText.js';
import { chunkDocument } from './chunkDocument.js';
import { generateEmbeddings } from '../embeddings/generate.js';
import { detectChunkingStrategy } from '../embeddings/chunker.js';
import { DocumentProcessingError } from '../utils/errors.js';

/**
 * Process a PDF document through the full pipeline
 *
 * Pipeline stages:
 * 1. Extract text from PDF
 * 2. Chunk into segments
 * 3. Generate embeddings
 * 4. Enrich metadata with AI
 */
export async function processDocument(
  input: ProcessDocumentInput & { ai: AIProvider }
): Promise<ProcessDocumentOutput> {
  const {
    filePath,
    documentId,
    projectId,
    tenantId,
    ai,
    chunkSize = 512,
    chunkOverlap = 50,
    strategy,
  } = input;

  try {
    // Stage 1: Extract text
    const { text, pages, metadata } = await extractTextFromPDF(filePath, documentId);

    if (!text || text.trim().length === 0) {
      throw new DocumentProcessingError(
        'No text extracted from PDF (may be scanned/image-based)',
        documentId
      );
    }

    // Stage 2: Chunk
    const detectedStrategy = strategy ?? detectChunkingStrategy('academic');
    const chunks = chunkDocument(pages, documentId, projectId, tenantId, {
      strategy: detectedStrategy,
      chunkSize,
      chunkOverlap,
    });

    // Stage 3: Generate embeddings
    const chunksWithEmbeddings = await generateEmbeddings(ai, chunks);

    // Stage 4: Enrich metadata with AI
    const enrichedMetadata = await enrichMetadata(ai, text, metadata);

    return {
      documentId,
      projectId,
      tenantId,
      text,
      pages,
      chunks: chunksWithEmbeddings,
      embeddings: chunksWithEmbeddings.map((c) => c.embedding!),
      metadata: enrichedMetadata,
    };
  } catch (error) {
    if (error instanceof DocumentProcessingError) {
      throw error;
    }
    throw new DocumentProcessingError(
      `Document processing failed: ${error instanceof Error ? error.message : String(error)}`,
      documentId
    );
  }
}

/**
 * Process a PDF from a buffer (for uploads)
 */
export async function processDocumentBuffer(
  input: Omit<ProcessDocumentInput, 'filePath'> & {
    ai: AIProvider;
    buffer: Buffer;
  }
): Promise<ProcessDocumentOutput> {
  const {
    buffer,
    documentId,
    projectId,
    tenantId,
    ai,
    chunkSize = 512,
    chunkOverlap = 50,
    strategy,
  } = input;

  const { text, pages, metadata } = await extractTextFromBuffer(buffer, documentId);

  if (!text || text.trim().length === 0) {
    throw new DocumentProcessingError('No text extracted from PDF buffer', documentId);
  }

  const detectedStrategy = strategy ?? detectChunkingStrategy('academic');
  const chunks = chunkDocument(pages, documentId, projectId, tenantId, {
    strategy: detectedStrategy,
    chunkSize,
    chunkOverlap,
  });

  const chunksWithEmbeddings = await generateEmbeddings(ai, chunks);
  const enrichedMetadata = await enrichMetadata(ai, text, metadata);

  return {
    documentId,
    projectId,
    tenantId,
    text,
    pages,
    chunks: chunksWithEmbeddings,
    embeddings: chunksWithEmbeddings.map((c) => c.embedding!),
    metadata: enrichedMetadata,
  };
}

/**
 * Enrich metadata with AI-extracted information
 */
async function enrichMetadata(
  ai: AIProvider,
  text: string,
  existing: ProcessDocumentOutput['metadata']
): Promise<ProcessDocumentOutput['metadata']> {
  try {
    // Only process if we have enough text and missing metadata
    const needsEnrichment =
      !existing.title ||
      !existing.abstract ||
      !existing.authors ||
      existing.authors.length === 0;

    if (!needsEnrichment || text.length < 200) {
      return existing;
    }

    const sampleText = text.slice(0, 4000); // First ~1000 tokens for metadata extraction

    const messages = [
      {
        role: 'system' as const,
        content: 'Extract metadata from the following academic document excerpt. Return JSON with: title, authors (array of strings), abstract (string, max 300 words), keywords (array of strings), year (number), doi (string or null).',
      },
      { role: 'user' as const, content: sampleText },
    ];

    const response = await ai.chat(messages, { temperature: 0, maxTokens: 800 });

    // Try to parse JSON from response
    let extracted: Record<string, unknown> = {};
    try {
      const cleaned = response.content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      extracted = JSON.parse(cleaned);
    } catch {
      // JSON parsing failed, return existing metadata
      return existing;
    }

    return {
      ...existing,
      title: (extracted.title as string) || existing.title,
      authors: Array.isArray(extracted.authors)
        ? (extracted.authors as string[])
        : existing.authors,
      abstract: (extracted.abstract as string) || existing.abstract,
      keywords: Array.isArray(extracted.keywords)
        ? (extracted.keywords as string[])
        : existing.keywords,
      year: (extracted.year as number) || existing.year,
      doi: (extracted.doi as string) || existing.doi,
      extractedAt: existing.extractedAt,
    };
  } catch {
    // If AI enrichment fails, return existing metadata
    return existing;
  }
}
