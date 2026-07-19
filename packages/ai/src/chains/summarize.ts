/**
 * Summarization Chain
 *
 * Generates document summaries in multiple formats.
 *
 * @module chains/summarize
 */

import type { AIProvider, SummarizeOptions } from '../types/index.js';
import {
  executiveSummaryPrompt,
  detailedSummaryPrompt,
  bulletSummaryPrompt,
  abstractSummaryPrompt,
  keyFindingsPrompt,
  methodologyPrompt,
  limitationsPrompt,
} from '../prompts/summary.js';
import { estimateTokenCount, truncateToTokenLimit } from '../utils/tokenizer.js';

/** Summary output with metadata */
export interface SummaryResult {
  summary: string;
  type: string;
  tokensUsed: { promptTokens: number; completionTokens: number; totalTokens: number };
  coverage: 'full' | 'truncated';
}

/**
 * Generate a document summary
 */
export async function summarizeDocument(
  ai: AIProvider,
  text: string,
  options?: SummarizeOptions
): Promise<SummaryResult> {
  const type = options?.type ?? 'detailed';
  const maxTokens = options?.maxLength ?? 1000;

  // Truncate text if it exceeds a reasonable context window
  const maxInputTokens = 12000; // Leave room for prompt and response
  const inputTokens = estimateTokenCount(text);
  const coverage: 'full' | 'truncated' = inputTokens > maxInputTokens ? 'truncated' : 'full';

  const truncatedText = truncateToTokenLimit(text, maxInputTokens);

  // Build prompt based on type
  const prompt = buildPrompt(type, truncatedText, options);

  const messages = [
    {
      role: 'system' as const,
      content:
        'You are an expert research summarizer. Produce clear, accurate, and comprehensive summaries.',
    },
    { role: 'user' as const, content: prompt },
  ];

  const response = await ai.chat(messages, {
    temperature: 0.2,
    maxTokens: maxTokens,
  });

  return {
    summary: response.content,
    type,
    tokensUsed: response.usage,
    coverage,
  };
}

/**
 * Generate multiple summary types at once
 */
export async function summarizeDocumentMulti(
  ai: AIProvider,
  text: string
): Promise<Record<string, SummaryResult>> {
  const types: NonNullable<SummarizeOptions['type']>[] = ['executive', 'bullet', 'abstract'];
  const results: Record<string, SummaryResult> = {};

  for (const type of types) {
    results[type] = await summarizeDocument(ai, text, { type });
  }

  return results;
}

/**
 * Extract structured sections from a document
 */
export async function extractSections(
  ai: AIProvider,
  text: string
): Promise<
  {
    abstract?: string;
    introduction?: string;
    methods?: string;
    results?: string;
    discussion?: string;
    conclusion?: string;
    keyFindings?: string;
    limitations?: string;
  }
> {
  const maxInputTokens = 12000;
  const truncatedText = truncateToTokenLimit(text, maxInputTokens);

  const [abstract, findings, methods, limitations] = await Promise.all([
    safeSummarize(ai, truncatedText, { type: 'abstract', maxLength: 300 }),
    safeSummarize(ai, truncatedText, { type: 'bullet', maxLength: 500 }),
    safeSummarize(ai, truncatedText, {
      type: 'detailed',
      maxLength: 400,
      focus: 'methodology',
    }),
    safeSummarize(ai, truncatedText, {
      type: 'detailed',
      maxLength: 300,
      focus: 'limitations',
    }),
  ]);

  return {
    abstract: abstract.summary,
    keyFindings: findings.summary,
    methods: methods.summary,
    limitations: limitations.summary,
  };
}

/** Build the appropriate prompt based on summary type */
function buildPrompt(
  type: string,
  text: string,
  options?: SummarizeOptions
): string {
  switch (type) {
    case 'executive':
      return executiveSummaryPrompt(text, options?.focus);
    case 'detailed':
      return detailedSummaryPrompt(text, options?.focus);
    case 'bullet':
      return bulletSummaryPrompt(text, options?.focus);
    case 'abstract':
      return abstractSummaryPrompt(text);
    default:
      return detailedSummaryPrompt(text, options?.focus);
  }
}

/** Safe wrapper that returns a default on failure */
async function safeSummarize(
  ai: AIProvider,
  text: string,
  options: SummarizeOptions
): Promise<SummaryResult> {
  try {
    return await summarizeDocument(ai, text, options);
  } catch {
    return {
      summary: 'Summary generation failed.',
      type: options.type ?? 'unknown',
      tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      coverage: 'truncated',
    };
  }
}
