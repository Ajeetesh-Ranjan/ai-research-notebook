import { describe, it, expect } from 'vitest';
import { MockProvider } from '../../src/providers/mock.js';
import type { ChatMessage } from '../../src/types/index.js';

describe('MockProvider', () => {
  const mock = new MockProvider();

  describe('chat', () => {
    it('should return a response for a general query', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'What is this document about?' },
      ];
      const response = await mock.chat(messages);

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(20);
      expect(response.usage.totalTokens).toBeGreaterThan(0);
      expect(response.finishReason).toBe('stop');
      expect(response.model).toBe('mock-gpt-4o');
    });

    it('should return a summary for summarize queries', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Summarize the main points' },
      ];
      const response = await mock.chat(messages);

      expect(response.content).toBeTruthy();
      expect(response.content).toContain('summary');
    });

    it('should return citations for citation queries', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'List all citations' },
      ];
      const response = await mock.chat(messages);

      expect(response.content).toBeTruthy();
      expect(response.content).toContain('Smith');
    });

    it('should handle methodology queries', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'What methodology was used?' },
      ];
      const response = await mock.chat(messages);

      expect(response.content).toBeTruthy();
      expect(response.content).toContain('method');
    });

    it('should handle comparison queries', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Compare the two approaches' },
      ];
      const response = await mock.chat(messages);

      expect(response.content).toBeTruthy();
      expect(response.content).toContain('Approach');
    });

    it('should include conversation history in context', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
        { role: 'user', content: 'Follow up' },
      ];
      const response = await mock.chat(messages);

      expect(response.content).toBeTruthy();
      // Mock provider should acknowledge history context
    });
  });

  describe('embed', () => {
    it('should generate normalized embeddings', async () => {
      const texts = ['hello world', 'test sentence', 'another text'];
      const embeddings = await mock.embed(texts);

      expect(embeddings.length).toBe(3);
      for (const emb of embeddings) {
        expect(emb.length).toBe(1536); // default dimension
        // Check normalization (unit vector)
        const norm = Math.sqrt(emb.reduce((sum, v) => sum + v * v, 0));
        expect(Math.abs(norm - 1)).toBeLessThan(0.01);
      }
    });

    it('should handle custom dimensions', async () => {
      const texts = ['test'];
      const embeddings = await mock.embed(texts, { dimensions: 256 });

      expect(embeddings[0].length).toBe(256);
    });

    it('should handle empty array', async () => {
      const embeddings = await mock.embed([]);
      expect(embeddings).toEqual([]);
    });
  });

  describe('summarize', () => {
    it('should generate executive summary', async () => {
      const text = 'This is a long document about research findings...';
      const summary = await mock.summarize(text, { type: 'executive' });

      expect(summary).toBeTruthy();
      expect(summary.length).toBeGreaterThan(10);
    });

    it('should generate bullet summary', async () => {
      const text = 'Document with multiple key points...';
      const summary = await mock.summarize(text, { type: 'bullet' });

      expect(summary).toBeTruthy();
      expect(summary).toContain('•');
    });

    it('should generate abstract summary', async () => {
      const text = 'Academic paper text...';
      const summary = await mock.summarize(text, { type: 'abstract' });

      expect(summary).toBeTruthy();
    });

    it('should respect maxLength', async () => {
      const text = 'A document with some content...';
      const summary = await mock.summarize(text, { type: 'detailed', maxLength: 100 });

      expect(summary.length).toBeLessThanOrEqual(100);
    });
  });

  describe('provider properties', () => {
    it('should return correct name', () => {
      expect(mock.name).toBe('mock');
    });

    it('should return default models', () => {
      expect(mock.defaultChatModel).toBe('mock-gpt-4o');
      expect(mock.defaultEmbeddingModel).toBe('mock-text-embedding-3-small');
    });
  });

  describe('with error simulation', () => {
    it('should throw error when error rate is set', async () => {
      const errorMock = new MockProvider({ errorRate: 1.0 }); // 100% error rate
      await expect(errorMock.chat([{ role: 'user', content: 'test' }])).rejects.toThrow('Mock provider simulated error');
    });
  });

  describe('with latency simulation', () => {
    it('should complete despite latency', async () => {
      const latencyMock = new MockProvider({ latency: 50 });
      const start = Date.now();
      const response = await latencyMock.chat([{ role: 'user', content: 'test' }]);
      const elapsed = Date.now() - start;

      expect(response.content).toBeTruthy();
      expect(elapsed).toBeGreaterThanOrEqual(45); // Should have waited ~50ms
    });
  });
});
