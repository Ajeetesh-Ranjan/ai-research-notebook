import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { chunkText } from '../utils/helpers.js';
import { aiProvider } from './aiProvider.js';
import { ProcessingStatus } from '../types/index.js';

/**
 * Service for processing uploaded PDF documents.
 */
export class DocumentProcessingService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = env.UPLOAD_DIR;
  }

  /**
   * Process a newly uploaded PDF document.
   * Extracts text, generates chunks, and creates embeddings.
   */
  async processDocument(documentId: string): Promise<void> {
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'processing' as ProcessingStatus },
      });

      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      const filePath = path.join(this.uploadDir, document.storageKey);
      const buffer = await fs.readFile(filePath);

      // Extract text and metadata
      const { info, numPages } = await this.extractPDF(buffer);
      const metadata = {
        title: info?.Title || null,
        author: info?.Author || null,
        subject: info?.Subject || null,
        keywords: info?.Keywords || null,
        creator: info?.Creator || null,
        producer: info?.Producer || null,
        creationDate: info?.CreationDate || null,
        modDate: info?.ModDate || null,
      };

      // Update document with metadata
      await prisma.document.update({
        where: { id: documentId },
        data: {
          title: document.title || metadata.title || 'Untitled Document',
          authors: metadata.author ? [metadata.author] : document.authors,
          pageCount: numPages,
          metadata: metadata as any,
        },
      });

      // Extract per-page text and create pages
      const pageTexts = await this.extractPageTexts(buffer, numPages);
      for (const { pageNumber, text: pageText } of pageTexts) {
        await prisma.documentPage.create({
          data: {
            documentId,
            pageNumber,
            textContent: pageText,
            width: 612,
            height: 792,
          },
        });
      }

      // Chunk text and generate embeddings
      await this.chunkAndEmbed(document, pageTexts);

      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'completed' as ProcessingStatus },
      });
    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: 'failed' as ProcessingStatus,
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Extract text and metadata from PDF buffer.
   */
  private async extractPDF(buffer: Buffer): Promise<{
    text: string;
    info: Record<string, any> | null;
    numPages: number;
  }> {
    try {
      const pdf = await pdfParse(buffer);
      return {
        text: pdf.text,
        info: pdf.info as Record<string, any> | null,
        numPages: pdf.numpages,
      };
    } catch (error) {
      console.error('PDF parse error:', error);
      return { text: '', info: null, numPages: 0 };
    }
  }

  /**
   * Extract text per page from PDF.
   */
  private async extractPageTexts(
    buffer: Buffer,
    numPages: number
  ): Promise<{ pageNumber: number; text: string }[]> {
    try {
      const pdf = await pdfParse(buffer);
      const fullText = pdf.text;
      const pages: { pageNumber: number; text: string }[] = [];

      // Simple page splitting by form feed character
      const pageTexts = fullText.split('\f');
      for (let i = 0; i < Math.min(numPages, pageTexts.length); i++) {
        pages.push({
          pageNumber: i + 1,
          text: pageTexts[i].trim(),
        });
      }

      // If no pages were split, put all text in page 1
      if (pages.length === 0 && numPages > 0) {
        pages.push({ pageNumber: 1, text: fullText });
      }

      return pages;
    } catch (error) {
      console.error('Page text extraction error:', error);
      return [];
    }
  }

  /**
   * Chunk document text and store chunks with embeddings.
   */
  private async chunkAndEmbed(
    document: { tenantId: string; projectId: string; id: string },
    pageTexts: { pageNumber: number; text: string }[]
  ): Promise<void> {
    const allChunks: { pageNumber: number; text: string; chunkIndex: number }[] = [];

    for (const { pageNumber, text } of pageTexts) {
      const chunks = chunkText(text, 512, 50);
      chunks.forEach((chunk, index) => {
        allChunks.push({ pageNumber, text: chunk, chunkIndex: index });
      });
    }

    // Generate embeddings in batches of 100
    const batchSize = 100;
    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      const embeddings = await aiProvider.embed(batch.map((c) => c.text));

      for (let j = 0; j < batch.length; j++) {
        await prisma.documentChunk.create({
          data: {
            tenantId: document.tenantId,
            projectId: document.projectId,
            documentId: document.id,
            pageNumber: batch[j].pageNumber,
            chunkIndex: batch[j].chunkIndex,
            textContent: batch[j].text,
            metadata: { embedding: embeddings[j] },
          },
        });
      }
    }
  }

  /**
   * Get document file path.
   */
  getDocumentPath(storageKey: string): string {
    return path.join(this.uploadDir, storageKey);
  }

  /**
   * Ensure upload directory exists.
   */
  async ensureUploadDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }
}

export const documentProcessingService = new DocumentProcessingService();
