/**
 * Abstract base class for all AI providers
 *
 * Defines the contract that every AI provider must implement.
 * This enables seamless switching between OpenAI, Anthropic, Azure, and local models.
 *
 * @module providers/base
 */

import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbedOptions,
  ExtractOptions,
  SummarizeOptions,
  TokenUsage,
  AIProviderConfig,
} from '../types/index.js';
import { z } from 'zod';

/** Abstract base class for AI providers */
export abstract class AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  /** Get provider name */
  abstract get name(): string;

  /** Get the default chat model */
  abstract get defaultChatModel(): string;

  /** Get the default embedding model */
  abstract get defaultEmbeddingModel(): string;

  /**
   * Send a chat completion request
   * @param messages - Array of chat messages
   * @param options - Optional chat parameters
   */
  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Generate embeddings for a batch of texts
   * @param texts - Array of texts to embed
   * @param options - Optional embedding parameters
   */
  abstract embed(texts: string[], options?: EmbedOptions): Promise<number[][]>;

  /**
   * Generate a summary of the provided text
   * @param text - Text to summarize
   * @param options - Summarization options
   */
  abstract summarize(text: string, options?: SummarizeOptions): Promise<string>;

  /**
   * Extract structured data from text using a Zod schema
   * @param text - Text to extract from
   * @param schema - Zod schema defining the output shape
   * @param options - Extraction options
   */
  async extract<T>(
    text: string,
    schema: z.ZodType<T>,
    options?: ExtractOptions
  ): Promise<T> {
    const instructions = this.buildExtractionInstructions(schema);

    const messages: ChatMessage[] = [
      { role: 'system', content: instructions },
      { role: 'user', content: `Extract structured data from the following text.\n\n---\n\n${text}` },
    ];

    const response = await this.chat(messages, {
      temperature: options?.temperature ?? 0.1,
      maxTokens: options?.maxTokens ?? 4096,
      model: options?.model,
    });

    return this.parseStructuredOutput(response.content, schema);
  }

  /** Build extraction instructions from a Zod schema */
  protected buildExtractionInstructions(schema: z.ZodType<unknown>): string {
    return `You are a structured data extraction assistant. Extract the requested information from the provided text and return it as a valid JSON object matching the schema below. Do not include any markdown formatting, explanations, or code blocks — only the raw JSON.\n\nSchema:\n${JSON.stringify(this.zodToJsonSchema(schema), null, 2)}`;
  }

  /** Parse structured output from LLM response */
  protected parseStructuredOutput<T>(raw: string, schema: z.ZodType<T>): T {
    // Clean up common LLM formatting issues
    let cleaned = raw.trim();

    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7).trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3).trim();
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3).trim();
    }

    try {
      const parsed = JSON.parse(cleaned);
      return schema.parse(parsed);
    } catch (error) {
      throw new Error(`Failed to parse structured output: ${error instanceof Error ? error.message : String(error)}. Raw: ${raw.slice(0, 200)}`);
    }
  }

  /** Convert Zod schema to JSON schema description (simplified) */
  protected zodToJsonSchema(schema: z.ZodType<unknown>): Record<string, unknown> {
    // Simplified conversion — in production, use zod-to-json-schema
    return {
      type: 'object',
      description: 'See Zod schema definition',
    };
  }

  /** Build default token usage when provider doesn't return it */
  protected estimateTokenUsage(prompt: string, completion: string): TokenUsage {
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(completion.length / 4);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }
}
