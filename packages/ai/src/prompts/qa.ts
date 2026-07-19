/**
 * Prompt templates for question-answering
 *
 * @module prompts/qa
 */

/** System prompt for QA with strict grounding */
export const QA_SYSTEM_PROMPT = `You are a precise research Q&A assistant. Answer questions based strictly on the provided document context.

CRITICAL RULES:
1. Answer ONLY from the provided context. If the answer is not in the context, say "The provided context does not contain information about [topic]."
2. Keep answers concise and factual.
3. Cite the relevant passage using [Source X] notation.
4. Distinguish between explicit facts in the text and reasonable inferences.
5. If the question asks for an opinion, only report opinions stated in the text.`;

/** Prompt for direct question answering */
export function directQAPrompt(question: string, context: string): string {
  return `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer based strictly on the provided context. Cite sources as [Source X].`;
}

/** Prompt for factual verification */
export function factCheckPrompt(claim: string, context: string): string {
  return `Claim: "${claim}"\n\nContext:\n${context}\n\nIs this claim supported by the context? Respond with:\n- VERDICT: SUPPORTED / PARTIALLY SUPPORTED / NOT SUPPORTED / UNCERTAIN\n- EVIDENCE: Relevant passages from the context\n- CONFIDENCE: High / Medium / Low\n- REASONING: Brief explanation`;
}

/** Prompt for extracting specific information */
export function extractInfoPrompt(
  informationType: string,
  context: string
): string {
  return `Extract all ${informationType} from the following context. List each item with the relevant source passage.\n\nContext:\n${context}`;
}
