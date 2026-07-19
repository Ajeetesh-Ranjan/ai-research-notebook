/**
 * Token counting utilities
 *
 * Uses a simple approximation (1 token ≈ 4 chars for English)
 * For production, use tiktoken or the tokenizer from the specific provider.
 *
 * @module utils/tokenizer
 */

/** Approximate token count for a string */
export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) return 0;
  // Rough approximation: ~4 characters per token for English text
  // Code and other languages may vary
  return Math.ceil(text.length / 4);
}

/** Estimate tokens for multiple messages */
export function estimateMessagesTokenCount(messages: { content: string; role: string }[]): number {
  // GPT-4 style: ~4 tokens per message overhead + content tokens
  const overheadPerMessage = 4;
  const contentTokens = messages.reduce((sum, m) => sum + estimateTokenCount(m.content), 0);
  return contentTokens + messages.length * overheadPerMessage + 2; // +2 for assistant priming
}

/** Check if text exceeds token limit */
export function exceedsTokenLimit(text: string, limit: number): boolean {
  return estimateTokenCount(text) > limit;
}

/** Truncate text to fit within token limit */
export function truncateToTokenLimit(text: string, limit: number): string {
  const estimatedTokens = estimateTokenCount(text);
  if (estimatedTokens <= limit) return text;

  // Binary search for the right length
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const slice = text.slice(0, mid);
    if (estimateTokenCount(slice) <= limit) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return text.slice(0, low - 1);
}

/** Calculate available context window after reserving space for system and history */
export function calculateAvailableContext(
  totalLimit: number,
  systemPrompt: string,
  history: { content: string; role: string }[]
): number {
  const systemTokens = estimateTokenCount(systemPrompt);
  const historyTokens = estimateMessagesTokenCount(history);
  const reserved = systemTokens + historyTokens + 100; // 100 for response overhead
  return Math.max(0, totalLimit - reserved);
}

/** Chunk text array to fit within a token budget */
export function fitChunksToTokenBudget(
  chunks: string[],
  budget: number
): { selected: string[]; remainingBudget: number } {
  let used = 0;
  const selected: string[] = [];

  for (const chunk of chunks) {
    const tokens = estimateTokenCount(chunk);
    if (used + tokens <= budget) {
      selected.push(chunk);
      used += tokens;
    } else {
      break;
    }
  }

  return { selected, remainingBudget: budget - used };
}
