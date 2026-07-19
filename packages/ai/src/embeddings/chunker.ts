/**
 * Text chunking utilities
 *
 * Implements recursive, semantic, fixed, and hybrid chunking strategies
 * with configurable overlap and separators.
 *
 * @module embeddings/chunker
 */

import type {
  DocumentChunk,
  ChunkingConfig,
  ChunkingStrategy,
  Page,
  ProcessDocumentInput,
} from '../types/index.js';
import { estimateTokenCount, truncateToTokenLimit } from '../utils/tokenizer.js';

/** Default chunking configuration */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  strategy: 'recursive',
  chunkSize: 512,
  chunkOverlap: 50,
  separators: ['\n\n', '\n', '. ', ' ', ''],
  preserveStructure: true,
  addMetadata: true,
};

/**
 * Chunk text from a document using the specified strategy
 */
export function chunkText(
  text: string,
  documentId: string,
  projectId: string,
  tenantId: string,
  pageNumber: number,
  config: Partial<ChunkingConfig> = {}
): DocumentChunk[] {
  const fullConfig = { ...DEFAULT_CHUNKING_CONFIG, ...config };

  switch (fullConfig.strategy) {
    case 'recursive':
      return recursiveChunk(text, documentId, projectId, tenantId, pageNumber, fullConfig);
    case 'fixed':
      return fixedChunk(text, documentId, projectId, tenantId, pageNumber, fullConfig);
    case 'semantic':
      return semanticChunk(text, documentId, projectId, tenantId, pageNumber, fullConfig);
    case 'hybrid':
      return hybridChunk(text, documentId, projectId, tenantId, pageNumber, fullConfig);
    default:
      return recursiveChunk(text, documentId, projectId, tenantId, pageNumber, fullConfig);
  }
}

/**
 * Chunk pages from a document
 */
export function chunkPages(
  pages: Page[],
  documentId: string,
  projectId: string,
  tenantId: string,
  config?: Partial<ChunkingConfig>
): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];

  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) continue;

    const pageChunks = chunkText(
      page.text,
      documentId,
      projectId,
      tenantId,
      page.pageNumber,
      config
    );

    allChunks.push(...pageChunks);
  }

  // Re-index chunks globally
  return allChunks.map((chunk, i) => ({
    ...chunk,
    chunkIndex: i,
    id: `${documentId}_chunk_${i}`,
  }));
}

/**
 * Recursive character chunking — tries separators in order,
 * splitting on the largest separator that keeps chunks under size.
 */
function recursiveChunk(
  text: string,
  documentId: string,
  projectId: string,
  tenantId: string,
  pageNumber: number,
  config: ChunkingConfig
): DocumentChunk[] {
  const separators = config.separators ?? DEFAULT_CHUNKING_CONFIG.separators!;
  const chunks: DocumentChunk[] = [];

  function split(text: string, sepIndex: number): string[] {
    if (sepIndex >= separators.length) {
      // No more separators, just hard-split by token limit
      const maxChars = config.chunkSize * 4; // Approximate
      const parts: string[] = [];
      for (let i = 0; i < text.length; i += maxChars) {
        parts.push(text.slice(i, i + maxChars));
      }
      return parts;
    }

    const sep = separators[sepIndex];
    const parts = text.split(sep);

    if (parts.length === 1) {
      return split(text, sepIndex + 1);
    }

    const result: string[] = [];
    let current = '';

    for (const part of parts) {
      const candidate = current ? current + sep + part : part;
      if (estimateTokenCount(candidate) <= config.chunkSize) {
        current = candidate;
      } else {
        if (current) result.push(current);
        current = part;
      }
    }
    if (current) result.push(current);

    // Check if any result is still too large
    const finalResult: string[] = [];
    for (const r of result) {
      if (estimateTokenCount(r) > config.chunkSize) {
        finalResult.push(...split(r, sepIndex + 1));
      } else {
        finalResult.push(r);
      }
    }

    return finalResult;
  }

  const splitTexts = split(text, 0);

  // Apply overlap
  for (let i = 0; i < splitTexts.length; i++) {
    const chunkText = splitTexts[i];
    const overlap = i > 0 ? getOverlap(splitTexts[i - 1], config.chunkOverlap) : undefined;

    chunks.push(createChunk(
      chunkText,
      documentId,
      projectId,
      tenantId,
      pageNumber,
      i,
      overlap,
      config
    ));
  }

  return chunks;
}

/**
 * Fixed-size chunking with overlap
 */
function fixedChunk(
  text: string,
  documentId: string,
  projectId: string,
  tenantId: string,
  pageNumber: number,
  config: ChunkingConfig
): DocumentChunk[] {
  const maxChars = config.chunkSize * 4;
  const overlapChars = config.chunkOverlap * 4;
  const chunks: DocumentChunk[] = [];

  let index = 0;
  for (let i = 0; i < text.length; i += maxChars - overlapChars) {
    const chunkText = text.slice(i, i + maxChars);
    chunks.push(createChunk(
      chunkText,
      documentId,
      projectId,
      tenantId,
      pageNumber,
      index++,
      undefined,
      config
    ));
  }

  return chunks;
}

/**
 * Semantic chunking — splits on paragraph boundaries and headers
 */
function semanticChunk(
  text: string,
  documentId: string,
  projectId: string,
  tenantId: string,
  pageNumber: number,
  config: ChunkingConfig
): DocumentChunk[] {
  // Split on paragraphs and section headers
  const paragraphs = text.split(/\n\n+/);
  const chunks: DocumentChunk[] = [];
  let current = '';
  let index = 0;

  for (const para of paragraphs) {
    const candidate = current ? current + '\n\n' + para : para;

    if (estimateTokenCount(candidate) <= config.chunkSize) {
      current = candidate;
    } else {
      if (current) {
        chunks.push(createChunk(
          current,
          documentId,
          projectId,
          tenantId,
          pageNumber,
          index++,
          undefined,
          config
        ));
      }
      current = para;
    }
  }

  if (current) {
    chunks.push(createChunk(
      current,
      documentId,
      projectId,
      tenantId,
      pageNumber,
      index,
      undefined,
      config
    ));
  }

  return chunks;
}

/**
 * Hybrid chunking — large semantic chunks with sub-chunks for precise retrieval
 */
function hybridChunk(
  text: string,
  documentId: string,
  projectId: string,
  tenantId: string,
  pageNumber: number,
  config: ChunkingConfig
): DocumentChunk[] {
  // First do semantic chunking with larger size
  const semanticConfig = { ...config, chunkSize: config.chunkSize * 2 };
  const largeChunks = semanticChunk(
    text, documentId, projectId, tenantId, pageNumber, semanticConfig
  );

  // Then sub-chunk each large chunk for precise retrieval
  const allChunks: DocumentChunk[] = [];
  let globalIndex = 0;

  for (const largeChunk of largeChunks) {
    const subChunks = recursiveChunk(
      largeChunk.textContent,
      documentId,
      projectId,
      tenantId,
      pageNumber,
      config
    );

    for (const sub of subChunks) {
      allChunks.push({
        ...sub,
        chunkIndex: globalIndex++,
        id: `${documentId}_chunk_${globalIndex}`,
        metadata: {
          ...sub.metadata,
          parentChunk: largeChunk.id,
        },
      });
    }
  }

  return allChunks;
}

/** Create a DocumentChunk object */
function createChunk(
  text: string,
  documentId: string,
  projectId: string,
  tenantId: string,
  pageNumber: number,
  chunkIndex: number,
  overlapText: string | undefined,
  config: ChunkingConfig
): DocumentChunk {
  const fullText = overlapText ? overlapText + ' ' + text : text;

  return {
    id: `${documentId}_chunk_${chunkIndex}`,
    documentId,
    projectId,
    tenantId,
    pageNumber,
    chunkIndex,
    textContent: fullText.trim(),
    metadata: config.addMetadata
      ? {
          isHeader: /^\s*#+\s/.test(text) || /^[A-Z][A-Z\s]{2,}\s*$/m.test(text),
          surroundingContext: overlapText,
        }
      : undefined,
    createdAt: new Date(),
  };
}

/** Get overlapping text from the end of a string */
function getOverlap(text: string, overlapTokens: number): string {
  const overlapChars = overlapTokens * 4;
  if (text.length <= overlapChars) return text;
  return text.slice(-overlapChars);
}

/**
 * Detect chunking strategy based on document type
 */
export function detectChunkingStrategy(documentType?: string): ChunkingStrategy {
  if (!documentType) return 'recursive';

  const docType = documentType.toLowerCase();

  if (docType.includes('legal') || docType.includes('contract')) return 'semantic';
  if (docType.includes('book') || docType.includes('chapter')) return 'hybrid';
  if (docType.includes('spreadsheet') || docType.includes('table')) return 'fixed';
  if (docType.includes('paper') || docType.includes('academic')) return 'recursive';

  return 'recursive';
}
