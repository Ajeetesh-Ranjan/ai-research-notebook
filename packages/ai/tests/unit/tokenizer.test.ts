import { describe, it, expect } from 'vitest';
import {
  estimateTokenCount,
  estimateMessagesTokenCount,
  exceedsTokenLimit,
  truncateToTokenLimit,
  calculateAvailableContext,
  fitChunksToTokenBudget,
} from '../../src/utils/tokenizer.js';

describe('tokenizer', () => {
  describe('estimateTokenCount', () => {
    it('should estimate tokens for English text', () => {
      const text = 'This is a test sentence with about twelve words.';
      const tokens = estimateTokenCount(text);
      // ~48 chars / 4 = ~12 tokens
      expect(tokens).toBeGreaterThan(5);
      expect(tokens).toBeLessThan(20);
    });

    it('should return 0 for empty string', () => {
      expect(estimateTokenCount('')).toBe(0);
    });

    it('should handle long text', () => {
      const text = 'word '.repeat(1000); // ~5000 chars
      const tokens = estimateTokenCount(text);
      expect(tokens).toBeGreaterThan(1000);
    });
  });

  describe('estimateMessagesTokenCount', () => {
    it('should estimate tokens for conversation', () => {
      const messages = [
        { content: 'Hello there', role: 'user' },
        { content: 'Hi! How can I help?', role: 'assistant' },
      ];
      const tokens = estimateMessagesTokenCount(messages);
      expect(tokens).toBeGreaterThan(0);
      // Should include overhead per message
      expect(tokens).toBeGreaterThan(10);
    });
  });

  describe('exceedsTokenLimit', () => {
    it('should detect when text exceeds limit', () => {
      const shortText = 'Short';
      expect(exceedsTokenLimit(shortText, 1000)).toBe(false);

      const longText = 'word '.repeat(1000);
      expect(exceedsTokenLimit(longText, 100)).toBe(true);
    });
  });

  describe('truncateToTokenLimit', () => {
    it('should return original text if under limit', () => {
      const text = 'Short text';
      expect(truncateToTokenLimit(text, 1000)).toBe(text);
    });

    it('should truncate text over limit', () => {
      const text = 'word '.repeat(500); // ~2500 chars
      const truncated = truncateToTokenLimit(text, 100);
      expect(truncated.length).toBeLessThan(text.length);
      expect(estimateTokenCount(truncated)).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateAvailableContext', () => {
    it('should calculate available context after reservations', () => {
      const available = calculateAvailableContext(
        4000,
        'You are a helpful assistant.',
        [{ content: 'Hello', role: 'user' }]
      );
      expect(available).toBeGreaterThan(0);
      expect(available).toBeLessThan(4000);
    });

    it('should return 0 when context is exhausted', () => {
      const available = calculateAvailableContext(
        100,
        'A very long system prompt that takes up all the space and more.',
        [{ content: 'Hello there this is a long message', role: 'user' }]
      );
      expect(available).toBe(0);
    });
  });

  describe('fitChunksToTokenBudget', () => {
    it('should select chunks within budget', () => {
      const chunks = ['word '.repeat(100), 'word '.repeat(100), 'word '.repeat(100)];
      const budget = 150; // tokens
      const result = fitChunksToTokenBudget(chunks, budget);

      expect(result.selected.length).toBeGreaterThan(0);
      expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
      expect(result.remainingBudget).toBeLessThanOrEqual(budget);
    });

    it('should handle empty chunks', () => {
      const result = fitChunksToTokenBudget([], 1000);
      expect(result.selected).toEqual([]);
      expect(result.remainingBudget).toBe(1000);
    });
  });
});
