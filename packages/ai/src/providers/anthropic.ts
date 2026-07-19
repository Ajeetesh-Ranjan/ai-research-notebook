/**
 * Anthropic Provider Implementation
 *
 * Supports Claude 3.5 Sonnet and Claude 3 Haiku.
 *
 * @module providers/anthropic
 */

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider } from './base.js';
import {
  AIError,
  ProviderError,
  RateLimitError,
  withRetry,
} from '../utils/errors.js';
import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbedOptions,
  SummarizeOptions,
} from '../types/index.js';

export class AnthropicProvider extends AIProvider {
  private client: Anthropic;

  constructor(config: { apiKey: string; baseUrl?: string; model?: string }) {
    super({
      provider: 'anthropic',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    });

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: 3,
      timeout: 60000,
    });
  }

  get name(): string {
    return 'anthropic';
  }

  get defaultChatModel(): string {
    return this.config.model ?? 'claude-3-5-sonnet-20240620';
  }

  get defaultEmbeddingModel(): string {
    // Anthropic doesn't offer embeddings yet; we use OpenAI for embeddings
    // or throw an error if not configured separately
    throw new AIError(
      'Anthropic does not provide embeddings. Use a separate embedding provider or configure OpenAI embeddings.',
      'EMBEDDING_NOT_SUPPORTED'
    );
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    return withRetry(async () => {
      try {
        const systemMessage = messages.find((m) => m.role === 'system');
        const conversationMessages = messages.filter((m) => m.role !== 'system');

        const mappedMessages = conversationMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const response = await this.client.messages.create({
          model: options?.model ?? this.defaultChatModel,
          max_tokens: options?.maxTokens ?? 4096,
          temperature: options?.temperature ?? 0.2,
          top_p: options?.topP,
          system: systemMessage?.content,
          messages: mappedMessages,
        });

        const content = response.content
          .filter((c): c is Anthropic.TextBlock => c.type === 'text')
          .map((c) => c.text)
          .join('');

        return {
          content,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
          model: response.model,
          finishReason: this.mapStopReason(response.stop_reason),
        };
      } catch (error) {
        this.handleError(error);
        throw error;
      }
    });
  }

  async embed(): Promise<number[][]> {
    // Anthropic does not offer embeddings as of 2024
    // In production, fall back to OpenAI or a local embedding model
    throw new AIError(
      'Anthropic provider does not support embeddings. Use OpenAIProvider or a mock provider for embeddings.',
      'EMBEDDING_NOT_SUPPORTED'
    );
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    const prompt = this.buildSummarizePrompt(text, options);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a research assistant that produces accurate, concise summaries of academic and professional documents.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await this.chat(messages, {
      temperature: 0.2,
      maxTokens: options?.maxLength ?? 1000,
    });

    return response.content;
  }

  /** Build summarization prompt based on options */
  private buildSummarizePrompt(text: string, options?: SummarizeOptions): string {
    const type = options?.type ?? 'detailed';
    const maxLength = options?.maxLength ?? 1000;
    const focus = options?.focus ? ` Focus on: ${options.focus}.` : '';

    const prompts: Record<string, string> = {
      executive: `Provide a concise executive summary (max ${maxLength} tokens) of the following document. Focus on the key conclusions and implications.${focus}\n\n---\n\n${text}`,
      detailed: `Provide a detailed summary (max ${maxLength} tokens) of the following document. Include: main objectives, methodology, key findings, and conclusions.${focus}\n\n---\n\n${text}`,
      bullet: `Summarize the following document as a list of key points (max ${maxLength} tokens). Use bullet points and be specific.${focus}\n\n---\n\n${text}`,
      abstract: `Write an academic-style abstract (max ${maxLength} tokens) for the following document. Include background, methods, results, and conclusion.${focus}\n\n---\n\n${text}`,
    };

    return prompts[type] ?? prompts.detailed;
  }

  /** Map Anthropic stop_reason to our enum */
  private mapStopReason(
    reason: string | null
  ): 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'other' {
    if (!reason) return 'other';
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'other';
    }
  }

  /** Handle Anthropic-specific errors */
  private handleError(error: unknown): never {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        throw new RateLimitError(
          `Anthropic rate limit exceeded: ${error.message}`,
          undefined,
          error
        );
      }
      throw new ProviderError(
        `Anthropic error: ${error.message}`,
        'anthropic',
        error.status,
        error
      );
    }

    if (error instanceof Error) {
      throw new ProviderError(error.message, 'anthropic', undefined, error);
    }

    throw new AIError(String(error), 'UNKNOWN_ERROR');
  }
}
