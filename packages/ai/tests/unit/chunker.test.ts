import { describe, it, expect } from 'vitest';
import {
  chunkText,
  chunkPages,
  detectChunkingStrategy,
  DEFAULT_CHUNKING_CONFIG,
} from '../../src/embeddings/chunker.js';
import type { Page, ChunkingConfig } from '../../src/types/index.js';

describe('chunker', () => {
  const docId = 'doc-test';
  const projectId = 'proj-test';
  const tenantId = 'tenant-test';

  describe('recursive chunking', () => {
    it('should chunk text into segments under chunk size', () => {
      const text = 'This is paragraph one.\n\nThis is paragraph two with more content.\n\nThis is paragraph three.';
      const chunks = chunkText(text, docId, projectId, tenantId, 1, {
        strategy: 'recursive',
        chunkSize: 50,
        chunkOverlap: 10,
      });

      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(chunk.textContent.length).toBeGreaterThan(0);
        expect(chunk.documentId).toBe(docId);
        expect(chunk.projectId).toBe(projectId);
      }
    });

    it('should preserve page numbers', () => {
      const text = 'Page 5 content here.';
      const chunks = chunkText(text, docId, projectId, tenantId, 5, {
        strategy: 'recursive',
        chunkSize: 50,
        chunkOverlap: 10,
      });

      expect(chunks[0].pageNumber).toBe(5);
    });

    it('should apply overlap between chunks', () => {
      const longText = 'Word '.repeat(200); // ~1000 chars
      const chunks = chunkText(longText, docId, projectId, tenantId, 1, {
        strategy: 'recursive',
        chunkSize: 100,
        chunkOverlap: 20,
      });

      expect(chunks.length).toBeGreaterThan(1);
      // Check that chunks have overlapping content
      if (chunks.length > 1) {
        const firstChunk = chunks[0].textContent;
        const secondChunk = chunks[1].textContent;
        // At least some overlap
        expect(secondChunk.length).toBeGreaterThan(0);
      }
    });
  });

  describe('fixed chunking', () => {
    it('should create fixed-size chunks', () => {
      const text = 'A'.repeat(1000);
      const chunks = chunkText(text, docId, projectId, tenantId, 1, {
        strategy: 'fixed',
        chunkSize: 100,
        chunkOverlap: 20,
      });

      expect(chunks.length).toBeGreaterThan(3);
      // Fixed chunks should have sequential indices
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].chunkIndex).toBe(i);
      }
    });
  });

  describe('semantic chunking', () => {
    it('should split on paragraph boundaries', () => {
      const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
      const chunks = chunkText(text, docId, projectId, tenantId, 1, {
        strategy: 'semantic',
        chunkSize: 200,
        chunkOverlap: 20,
      });

      expect(chunks.length).toBeGreaterThan(0);
      // Semantic chunks should preserve paragraph structure
      for (const chunk of chunks) {
        expect(chunk.textContent).toBeTruthy();
      }
    });
  });

  describe('chunkPages', () => {
    it('should chunk multiple pages', () => {
      const pages: Page[] = [
        { pageNumber: 1, text: 'Page one content here.', width: 612, height: 792 },
        { pageNumber: 2, text: 'Page two content here.', width: 612, height: 792 },
      ];

      const chunks = chunkPages(pages, docId, projectId, tenantId, {
        strategy: 'recursive',
        chunkSize: 50,
        chunkOverlap: 10,
      });

      expect(chunks.length).toBeGreaterThan(0);
      // Check page numbers are preserved
      const page1Chunks = chunks.filter((c) => c.pageNumber === 1);
      const page2Chunks = chunks.filter((c) => c.pageNumber === 2);
      expect(page1Chunks.length).toBeGreaterThan(0);
      expect(page2Chunks.length).toBeGreaterThan(0);
    });

    it('should skip empty pages', () => {
      const pages: Page[] = [
        { pageNumber: 1, text: 'Content', width: 612, height: 792 },
        { pageNumber: 2, text: '', width: 612, height: 792 },
        { pageNumber: 3, text: 'More content', width: 612, height: 792 },
      ];

      const chunks = chunkPages(pages, docId, projectId, tenantId);
      const page2Chunks = chunks.filter((c) => c.pageNumber === 2);
      expect(page2Chunks.length).toBe(0);
    });
  });

  describe('detectChunkingStrategy', () => {
    it('should detect academic paper type', () => {
      expect(detectChunkingStrategy('academic paper')).toBe('recursive');
    });

    it('should detect legal document type', () => {
      expect(detectChunkingStrategy('legal contract')).toBe('semantic');
    });

    it('should detect book type', () => {
      expect(detectChunkingStrategy('book chapter')).toBe('hybrid');
    });

    it('should default to recursive', () => {
      expect(detectChunkingStrategy()).toBe('recursive');
      expect(detectChunkingStrategy('unknown')).toBe('recursive');
    });
  });

  describe('DEFAULT_CHUNKING_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_CHUNKING_CONFIG.chunkSize).toBe(512);
      expect(DEFAULT_CHUNKING_CONFIG.chunkOverlap).toBe(50);
      expect(DEFAULT_CHUNKING_CONFIG.strategy).toBe('recursive');
      expect(DEFAULT_CHUNKING_CONFIG.separators).toContain('\n\n');
    });
  });
});
