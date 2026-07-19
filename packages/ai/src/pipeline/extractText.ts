/**
 * PDF text extraction
 *
 * Uses pdf-parse to extract text and metadata from PDF files.
 *
 * @module pipeline/extractText
 */

import type { Page, DocumentMetadata } from '../types/index.js';
import { DocumentProcessingError } from '../utils/errors.js';

/**
 * Extract text from a PDF file
 *
 * @param filePath - Path to the PDF file
 * @param documentId - Unique document identifier
 */
export async function extractTextFromPDF(
  filePath: string,
  documentId: string
): Promise<{ text: string; pages: Page[]; metadata: DocumentMetadata }> {
  try {
    // Dynamic import to handle pdf-parse's quirks
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js').then(
      (m) => m.default ?? m
    );

    const fs = await import('fs');
    const dataBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(dataBuffer);

    const text = parsed.text ?? '';
    const info = parsed.info ?? {};

    // Build metadata
    const metadata: DocumentMetadata = {
      title: info.Title ?? undefined,
      authors: info.Author ? [info.Author] : undefined,
      abstract: undefined, // pdf-parse doesn't extract abstracts well
      keywords: info.Keywords ? info.Keywords.split(/[,;]/) : undefined,
      year: info.CreationDate ? extractYear(info.CreationDate) : undefined,
      doi: undefined,
      journal: undefined,
      publisher: info.Producer ?? undefined,
      language: undefined,
      pageCount: parsed.numpages ?? 0,
      extractedAt: new Date(),
    };

    // Build pages (pdf-parse gives us total text, we approximate pages)
    const pages = approximatePages(text, parsed.numpages ?? 1);

    return { text, pages, metadata };
  } catch (error) {
    throw new DocumentProcessingError(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`,
      documentId
    );
  }
}

/**
 * Extract text from a PDF buffer (for uploads)
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  documentId: string
): Promise<{ text: string; pages: Page[]; metadata: DocumentMetadata }> {
  try {
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js').then(
      (m) => m.default ?? m
    );

    const parsed = await pdfParse(buffer);
    const text = parsed.text ?? '';
    const info = parsed.info ?? {};

    const metadata: DocumentMetadata = {
      title: info.Title ?? undefined,
      authors: info.Author ? [info.Author] : undefined,
      keywords: info.Keywords ? info.Keywords.split(/[,;]/) : undefined,
      year: info.CreationDate ? extractYear(info.CreationDate) : undefined,
      publisher: info.Producer ?? undefined,
      pageCount: parsed.numpages ?? 0,
      extractedAt: new Date(),
    };

    const pages = approximatePages(text, parsed.numpages ?? 1);

    return { text, pages, metadata };
  } catch (error) {
    // pdf-parse failed — treat non-empty buffer as plain text, empty as error
    if (buffer.length === 0) {
      throw new DocumentProcessingError(
        'No text extracted',
        documentId
      );
    }

    const text = buffer.toString('utf-8');
    const metadata: DocumentMetadata = {
      pageCount: 1,
      extractedAt: new Date(),
    };
    const pages = approximatePages(text, 1);
    return { text, pages, metadata };
  }
}

/**
 * Approximate page boundaries from text
 * pdf-parse doesn't give per-page text, so we estimate.
 */
function approximatePages(text: string, numPages: number): Page[] {
  if (numPages <= 0) return [];

  const pages: Page[] = [];

  // Try to split on form feed characters first
  const formFeedSplit = text.split('\f');
  if (formFeedSplit.length >= numPages) {
    for (let i = 0; i < formFeedSplit.length; i++) {
      pages.push({
        pageNumber: i + 1,
        text: formFeedSplit[i].trim(),
        width: 612, // Default PDF width (letter)
        height: 792, // Default PDF height (letter)
      });
    }
    return pages;
  }

  // Otherwise, approximate by splitting text evenly
  const avgLength = Math.ceil(text.length / numPages);
  for (let i = 0; i < numPages; i++) {
    const start = i * avgLength;
    const end = Math.min((i + 1) * avgLength, text.length);
    // Try to find a sentence boundary near the split point
    let actualEnd = end;
    if (end < text.length) {
      const nextPeriod = text.indexOf('. ', end);
      if (nextPeriod !== -1 && nextPeriod < end + 200) {
        actualEnd = nextPeriod + 2;
      }
    }

    pages.push({
      pageNumber: i + 1,
      text: text.slice(start, actualEnd).trim(),
      width: 612,
      height: 792,
    });
  }

  return pages;
}

/** Extract year from PDF date string */
function extractYear(dateStr: string): number | undefined {
  const match = dateStr.match(/(\d{4})/);
  if (match) {
    const year = parseInt(match[1], 10);
    return year > 1900 && year < 2100 ? year : undefined;
  }
  return undefined;
}
