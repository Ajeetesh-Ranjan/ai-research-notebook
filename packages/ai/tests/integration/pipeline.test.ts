import { describe, it, expect, beforeAll } from 'vitest';
import {
  createAIProvider,
  processDocumentBuffer,
  documentChat,
  semanticSearch,
  buildKnowledgeGraph,
  extractCitationsFromText,
  formatCitation,
} from '../../src/index.js';
import type { DocumentChunk } from '../../src/types/index.js';
import { MockProvider } from '../../src/providers/mock.js';

describe('Integration: Full Pipeline', () => {
  let ai: MockProvider;
  let sampleChunks: DocumentChunk[];
  let sampleBuffer: Buffer;

  beforeAll(() => {
    ai = new MockProvider();

    // Create sample chunks for testing
    sampleChunks = [
      {
        id: 'chunk_1',
        documentId: 'doc_1',
        projectId: 'proj_1',
        tenantId: 'tenant_1',
        pageNumber: 1,
        chunkIndex: 0,
        textContent: 'This paper presents a novel approach to machine learning using transformer architectures. The results show significant improvements over baseline methods.',
        createdAt: new Date(),
      },
      {
        id: 'chunk_2',
        documentId: 'doc_1',
        projectId: 'proj_1',
        tenantId: 'tenant_1',
        pageNumber: 2,
        chunkIndex: 1,
        textContent: 'The methodology section describes the experimental setup, including data collection and model training procedures. We used a dataset of 10,000 samples.',
        createdAt: new Date(),
      },
      {
        id: 'chunk_3',
        documentId: 'doc_1',
        projectId: 'proj_1',
        tenantId: 'tenant_1',
        pageNumber: 3,
        chunkIndex: 2,
        textContent: 'Our findings indicate that the proposed method achieves 95% accuracy, outperforming previous approaches by 15%. The limitations include sample size constraints.',
        createdAt: new Date(),
      },
    ];

    // Create a minimal PDF-like buffer (not a real PDF, but sufficient for the mock)
    sampleBuffer = Buffer.from(
      'This is a sample PDF text. It contains information about research methods and findings. The study was conducted by Smith et al. (2024).'
    );
  });

  describe('Provider Creation', () => {
    it('should create a mock provider by default', () => {
      const provider = createAIProvider({ provider: 'mock' });
      expect(provider).toBeInstanceOf(MockProvider);
      expect(provider.name).toBe('mock');
    });

    it('should create a mock provider when no API key is provided for openai', () => {
      const provider = createAIProvider({ provider: 'openai' });
      expect(provider).toBeInstanceOf(MockProvider);
    });
  });

  describe('Document Processing', () => {
    it('should process a document buffer end-to-end', async () => {
      const result = await processDocumentBuffer({
        ai,
        buffer: sampleBuffer,
        documentId: 'doc_test',
        projectId: 'proj_test',
        tenantId: 'tenant_test',
        chunkSize: 100,
        chunkOverlap: 20,
      });

      expect(result.documentId).toBe('doc_test');
      expect(result.projectId).toBe('proj_test');
      expect(result.text).toBeTruthy();
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.embeddings.length).toBeGreaterThan(0);
      expect(result.embeddings[0].length).toBe(1536); // mock embedding dimension
      expect(result.metadata).toBeDefined();
      expect(result.metadata.extractedAt).toBeInstanceOf(Date);
    });

    it('should handle empty buffer gracefully', async () => {
      await expect(
        processDocumentBuffer({
          ai,
          buffer: Buffer.from(''),
          documentId: 'doc_empty',
          projectId: 'proj_test',
          tenantId: 'tenant_test',
        })
      ).rejects.toThrow('No text extracted');
    });
  });

  describe('RAG Document Chat', () => {
    it('should answer a question using document chunks', async () => {
      const result = await documentChat({
        ai,
        query: 'What are the main findings?',
        documentChunks: sampleChunks,
        topK: 3,
      });

      expect(result.response).toBeTruthy();
      expect(result.response.length).toBeGreaterThan(10);
      expect(result.sources).toBeInstanceOf(Array);
      expect(result.tokensUsed.totalTokens).toBeGreaterThan(0);
      expect(result.suggestedFollowups).toBeInstanceOf(Array);
    });

    it('should include conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'What methodology was used?' },
        { role: 'assistant' as const, content: 'The study used machine learning methods.' },
      ];

      const result = await documentChat({
        ai,
        query: 'What were the results?',
        documentChunks: sampleChunks,
        conversationHistory: history,
        topK: 2,
      });

      expect(result.response).toBeTruthy();
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should throw error with no chunks', async () => {
      await expect(
        documentChat({
          ai,
          query: 'What?',
          documentChunks: [],
        })
      ).rejects.toThrow('No document chunks provided');
    });
  });

  describe('Semantic Search', () => {
    it('should perform semantic search on chunks', async () => {
      // First generate embeddings for chunks
      const chunksWithEmbeddings = await ai.embed(sampleChunks.map((c) => c.textContent));
      const chunks = sampleChunks.map((c, i) => ({
        ...c,
        embedding: chunksWithEmbeddings[i],
      }));

      const results = await semanticSearch({
        ai,
        query: 'machine learning accuracy',
        chunks,
        topK: 2,
        searchType: 'hybrid',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(2);
      expect(results[0].chunk).toBeDefined();
      expect(results[0].fusedScore).toBeGreaterThan(0);
    });

    it('should return empty for empty chunks', async () => {
      const results = await semanticSearch({
        ai,
        query: 'test',
        chunks: [],
        topK: 5,
      });
      expect(results).toEqual([]);
    });
  });

  describe('Knowledge Graph', () => {
    it('should build a knowledge graph from chunks', async () => {
      const graph = await buildKnowledgeGraph({
        ai,
        documentId: 'doc_test',
        projectId: 'proj_test',
        tenantId: 'tenant_test',
        chunks: sampleChunks,
      });

      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);

      // Should have a document node
      const docNode = graph.nodes.find((n) => n.id === 'doc_test');
      expect(docNode).toBeDefined();
      expect(docNode?.type).toBe('document');

      // Should have contains edges
      const containsEdges = graph.edges.filter((e) => e.type === 'contains');
      expect(containsEdges.length).toBeGreaterThan(0);
    });
  });

  describe('Citations', () => {
    it('should extract and format citations end-to-end', () => {
      const text = 'Smith (2024) found that the method works. See also Jones & Lee (2023).';
      const citations = extractCitationsFromText(text);
      expect(citations.length).toBeGreaterThan(0);

      const formatted = formatCitation(citations[0], 'apa-7');
      expect(formatted.inText).toBeTruthy();
      expect(formatted.bibliography).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors gracefully', async () => {
      const errorMock = new MockProvider({ errorRate: 1.0 });
      await expect(
        documentChat({
          ai: errorMock,
          query: 'test',
          documentChunks: sampleChunks,
        })
      ).rejects.toThrow();
    });
  });
});
