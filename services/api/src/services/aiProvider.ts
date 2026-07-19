import { AIProvider, ChatMessage, ChatOptions, ChatResponse, EmbedOptions, SummarizeOptions } from '../types/index.js';
import { env } from '../config/env.js';
import OpenAI from 'openai';
import { AIProviderError } from '../utils/errors.js';

/**
 * Mock AI provider for offline development and testing.
 * Returns realistic fake responses without calling external APIs.
 */
export class MockAIProvider implements AIProvider {
  async chat(messages: ChatMessage[], _options?: ChatOptions): Promise<ChatResponse> {
    const lastUserMessage = messages.reverse().find((m) => m.role === 'user');
    const query = lastUserMessage?.content || 'query';

    await this.simulateDelay(500);

    const responses: Record<string, string> = {
      summary: 'This is a mock summary of the document. The key points include: (1) Introduction to the topic, (2) Methodology used, (3) Results and findings, (4) Discussion of implications.',
      limitations: 'Based on the documents in your project, here are the key limitations:\n\n1. **Sample Size**: The study used a relatively small sample of 42 participants, which may limit generalizability.\n\n2. **Methodological Constraints**: The cross-sectional design prevents causal inference.\n\n3. **Selection Bias**: Participants were recruited from a single institution.',
      default: `I received your question: "${query.substring(0, 100)}..." This is a mock response for development purposes. In production, this would be answered by a real LLM with document-grounded context.`,
    };

    const lowerQuery = query.toLowerCase();
    let content = responses.default;
    if (lowerQuery.includes('summar')) content = responses.summary;
    else if (lowerQuery.includes('limitation')) content = responses.limitations;

    return {
      content,
      citations: [
        { documentId: 'mock-doc-1', chunkId: 'mock-chunk-1', text: 'Relevant passage from document 1', pageNumber: 5 },
      ],
      tokensUsed: { input: 150, output: 200 },
    };
  }

  async embed(texts: string[], _options?: EmbedOptions): Promise<number[][]> {
    await this.simulateDelay(100);
    return texts.map(() => this.generateMockEmbedding(1536));
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    await this.simulateDelay(300);
    const type = options?.type || 'detailed';
    const maxLength = options?.maxLength || 200;

    const summaries: Record<string, string> = {
      executive: `Executive summary: ${text.substring(0, maxLength)}...`,
      detailed: `Detailed summary: ${text.substring(0, maxLength)}...`,
      bullets: '- Key point 1\n- Key point 2\n- Key point 3',
    };

    return summaries[type] || summaries.detailed;
  }

  private generateMockEmbedding(dimensions: number): number[] {
    const embedding: number[] = [];
    for (let i = 0; i < dimensions; i++) {
      embedding.push(Math.random() * 2 - 1);
    }
    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / magnitude);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * OpenAI provider implementation.
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    if (!env.AI_API_KEY) {
      throw new AIProviderError('OpenAI API key not configured');
    }
    this.client = new OpenAI({ apiKey: env.AI_API_KEY });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const model = options?.model || env.AI_MODEL || 'gpt-4o';
      const response = await this.client.chat.completions.create({
        model,
        messages: messages as any,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        tokensUsed: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new AIProviderError('Failed to generate response from OpenAI');
    }
  }

  async embed(texts: string[], _options?: EmbedOptions): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      console.error('OpenAI embed error:', error);
      throw new AIProviderError('Failed to generate embeddings from OpenAI');
    }
  }

  async summarize(text: string, options?: SummarizeOptions): Promise<string> {
    const type = options?.type || 'detailed';
    const prompt = `Summarize the following text in ${type} format. ${options?.maxLength ? `Keep it under ${options.maxLength} words.` : ''}\n\n${text}`;

    const response = await this.chat(
      [
        { role: 'system', content: 'You are a research assistant that summarizes academic texts accurately.' },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 500 }
    );

    return response.content;
  }
}

/**
 * AI Provider factory.
 */
export function createAIProvider(): AIProvider {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return new OpenAIProvider();
    case 'mock':
    default:
      return new MockAIProvider();
  }
}

/**
 * Singleton AI provider instance.
 */
export const aiProvider = createAIProvider();
