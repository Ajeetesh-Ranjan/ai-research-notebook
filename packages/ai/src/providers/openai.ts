/**
 * OpenAI Provider Implementation
 *
 * Supports GPT-4o, GPT-4o-mini, and text-embedding-3 models.
 *
 * @module providers/openai
 */

import OpenAI from 'openai';
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

export class OpenAIProvider extends AIProvider {
  private client: OpenAI;

  constructor(config: { apiKey: string; baseUrl?: string; model?: string; embeddingModel?: string }) {
    super({
      provider: 'openai',
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      embeddingModel: config.embeddingModel,
    });

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: 3,
      timeout: 60000,
    });
  }

  get name(): string {
    return 'openai';
  }

  get defaultChatModel(): string {
    return this.config.model ?? 'gpt-4o';
  }

  get defaultEmbeddingModel(): string {
    return this.config.embeddingModel ?? 'text-embedding-3-small';
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    return withRetry(async () => {
      try {
        const mappedMessages = messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant' | 'tool',
          content: m.content,
          name: m.name,
        })) as unknown as import('openai/resources/chat/completions').ChatCompletionMessageParam[];

        const response = await this.client.chat.completions.create({
          model: options?.model ?? this.defaultChatModel,
          messages: mappedMessages,
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 4096,
          top_p: options?.topP,
          frequency_penalty: options?.frequencyPenalty,
          presence_penalty: options?.presencePenalty,
          stop: options?.stopSequences,
          stream: false,
        });

        const choice = response.choices[0];
        if (!choice) {
          throw new AIError('No response from OpenAI', 'EMPTY_RESPONSE');
        }

        return {
          content: choice.message.content ?? '',
          usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
          },
          model: response.model,
          finishReason: this.mapFinishReason(choice.finish_reason),
        };
      } catch (error) {
        this.handleError(error);
        throw error; // unreachable but TypeScript needs it
      }
    });
  }

  async embed(texts: string[], options?: EmbedOptions): Promise<number[][]> {
    return withRetry(async () => {
      try {
        const response = await this.client.embeddings.create({
          model: options?.model ?? this.defaultEmbeddingModel,
          input: texts,
          dimensions: options?.dimensions,
        });

        return response.data.map((d) => d.embedding);
      } catch (error) {
        this.handleError(error);
        throw error;
      }
    });
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

  /** Map OpenAI finish_reason to our enum */
  private mapFinishReason(
    reason: string | null | undefined
  ): 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'other' {
    if (!reason) return 'other';
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool_calls';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'other';
    }
  }

  /** Handle OpenAI-specific errors */
  private handleError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'];
        throw new RateLimitError(
          `OpenAI rate limit exceeded: ${error.message}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          error
        );
      }
      throw new ProviderError(
        `OpenAI error: ${error.message}`,
        'openai',
        error.status,
        error
      );
    }

    if (error instanceof Error) {
      throw new ProviderError(error.message, 'openai', undefined, error);
    }

    throw new AIError(String(error), 'UNKNOWN_ERROR');
  }
}
