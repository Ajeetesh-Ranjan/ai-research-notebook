/**
 * Prompt templates for chat / RAG operations
 *
 * All prompts enforce source grounding and factual constraints.
 *
 * @module prompts/chat
 */

import type { ChatMessage, DocumentChunk } from '../types/index.js';

/** System prompt for document-grounded chat */
export const DOCUMENT_CHAT_SYSTEM_PROMPT = `You are CiteMind AI, a research assistant that helps users understand and analyze documents. You have access to relevant document excerpts that will be provided in each query.

CRITICAL RULES:
1. ONLY use the provided document excerpts to answer. Do not use outside knowledge.
2. Cite your sources using [1], [2], etc. referencing the provided chunks.
3. If the answer is not in the provided excerpts, say "I don't have enough information in the provided excerpts to answer this."
4. Be concise but thorough. Use bullet points for multiple findings.
5. Do not hallucinate facts, figures, or citations.
6. When unsure, express uncertainty rather than inventing information.
7. If the user asks about methodology, explicitly reference the methods described in the text.
8. If the user asks about limitations, only mention limitations explicitly discussed in the text.

RESPONSE FORMAT:
- Provide a direct answer first
- Include source citations inline as [1], [2], etc.
- After the answer, list the sources with brief context`;

/** Build a RAG chat prompt with retrieved chunks */
export function buildRAGPrompt(
  query: string,
  chunks: DocumentChunk[],
  conversationHistory: ChatMessage[]
): ChatMessage[] {
  const contextBlocks = chunks
    .map((chunk, i) => {
      const meta = chunk.metadata;
      const pageInfo = chunk.pageNumber > 0 ? ` (Page ${chunk.pageNumber})` : '';
      const sectionInfo = meta?.section ? ` [Section: ${meta.section}]` : '';
      return `[Source ${i + 1}]${pageInfo}${sectionInfo}:\n${chunk.textContent}`;
    })
    .join('\n\n---\n\n');

  const userMessage = `Relevant document excerpts:\n\n${contextBlocks}\n\n---\n\nUser question: ${query}\n\nPlease answer based ONLY on the provided excerpts. Cite sources as [1], [2], etc.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: DOCUMENT_CHAT_SYSTEM_PROMPT },
    ...conversationHistory.slice(-6), // Keep last 6 messages for context
    { role: 'user', content: userMessage },
  ];

  return messages;
}

/** System prompt for multi-document synthesis */
export const MULTI_DOCUMENT_SYSTEM_PROMPT = `You are CiteMind AI, a research synthesis assistant. You are analyzing multiple documents to answer a research question.

CRITICAL RULES:
1. Compare and contrast information across documents explicitly.
2. Identify agreements, contradictions, and gaps between sources.
3. Cite documents using [Doc A], [Doc B], etc. based on the provided labels.
4. Be balanced — do not overrepresent one document's view.
5. Note when documents lack evidence on a specific point.
6. Structure your response clearly with headings if needed.`;

/** Build a multi-document synthesis prompt */
export function buildMultiDocumentPrompt(
  query: string,
  documents: { label: string; title: string; chunks: DocumentChunk[] }[]
): string {
  const docBlocks = documents
    .map((doc) => {
      const chunkTexts = doc.chunks
        .map((c, i) => `  [${doc.label} Excerpt ${i + 1}] (Page ${c.pageNumber}): ${c.textContent}`)
        .join('\n\n');
      return `Document ${doc.label}: "${doc.title}"\n${chunkTexts}`;
    })
    .join('\n\n===\n\n');

  return `Research Question: ${query}\n\n${docBlocks}\n\n---\n\nSynthesize the information across these documents to answer the research question. Identify agreements, contradictions, and gaps. Cite documents as [Doc A], [Doc B], etc.`;
}

/** Suggested follow-up prompts after a chat response */
export function generateSuggestedFollowups(query: string, response: string): string[] {
  const suggestions: string[] = [];
  const lowerQuery = query.toLowerCase();
  const lowerResponse = response.toLowerCase();

  if (!lowerQuery.includes('method') && lowerResponse.includes('method')) {
    suggestions.push('Explain the methodology in more detail');
  }
  if (!lowerQuery.includes('limitation') && lowerResponse.includes('limit')) {
    suggestions.push('What are the limitations of this study?');
  }
  if (!lowerQuery.includes('citation') && lowerResponse.includes('[')) {
    suggestions.push('Show me all citations mentioned');
  }
  if (lowerResponse.includes('compare') || lowerResponse.includes('contrast')) {
    suggestions.push('Expand on the comparison between approaches');
  }
  if (lowerResponse.includes('future') || lowerResponse.includes('further')) {
    suggestions.push('What future research directions are suggested?');
  }

  // Add generic suggestions if we have few specific ones
  if (suggestions.length < 3) {
    suggestions.push('Summarize the key findings in bullet points');
  }
  if (suggestions.length < 3) {
    suggestions.push('How does this relate to other research in the field?');
  }
  if (suggestions.length < 3) {
    suggestions.push('Extract the main arguments and evidence');
  }

  return suggestions.slice(0, 4);
}
