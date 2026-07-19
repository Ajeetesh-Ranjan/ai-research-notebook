/**
 * Prompt templates for summarization
 *
 * @module prompts/summary
 */

/** System prompt for summarization tasks */
export const SUMMARIZATION_SYSTEM_PROMPT = `You are an expert research summarizer. Produce clear, accurate, and comprehensive summaries of academic and professional documents.

RULES:
1. Preserve the original meaning — never distort the author's intent.
2. Use the document's own terminology where appropriate.
3. Include quantitative findings with their exact values.
4. Maintain the logical structure of the original.
5. Flag any uncertainty in the source text.
6. Do not add information not present in the original.`;

/** Prompt for executive summary */
export function executiveSummaryPrompt(text: string, focus?: string): string {
  const focusClause = focus ? ` Focus particularly on: ${focus}.` : '';
  return `Write an executive summary (200-400 words) of the following document. Focus on the key conclusions, implications, and actionable insights.${focusClause}\n\n---\n\n${text}`;
}

/** Prompt for detailed summary */
export function detailedSummaryPrompt(text: string, focus?: string): string {
  const focusClause = focus ? ` Focus particularly on: ${focus}.` : '';
  return `Write a detailed summary (500-800 words) of the following document. Include:\n1. Background and context\n2. Main objectives and research questions\n3. Methodology\n4. Key findings with specific data points\n5. Conclusions and implications\n6. Limitations mentioned${focusClause}\n\n---\n\n${text}`;
}

/** Prompt for bullet-point summary */
export function bulletSummaryPrompt(text: string, focus?: string): string {
  const focusClause = focus ? ` Focus particularly on: ${focus}.` : '';
  return `Summarize the following document as a structured list of key points (15-25 bullets). Each bullet should be specific and substantive. Include quantitative findings where present.${focusClause}\n\n---\n\n${text}`;
}

/** Prompt for abstract-style summary */
export function abstractSummaryPrompt(text: string): string {
  return `Write an academic-style abstract (150-250 words) for the following document. Structure it as:\n- Background/Context (1-2 sentences)\n- Objectives/Research Questions (1 sentence)\n- Methods (2-3 sentences)\n- Results/Findings (3-4 sentences with key data)\n- Conclusions/Implications (1-2 sentences)\n\n---\n\n${text}`;
}

/** Prompt for section-by-section summary */
export function sectionSummaryPrompt(text: string): string {
  return `Provide a section-by-section summary of the following document. Identify the major sections (Introduction, Methods, Results, Discussion, etc.) and summarize each in 2-4 sentences. Include the page range or location of each section if discernible.\n\n---\n\n${text}`;
}

/** Prompt for key findings extraction */
export function keyFindingsPrompt(text: string): string {
  return `Extract the 5-10 most important findings from the following document. For each finding, include:\n- The specific claim or result\n- Supporting evidence (data, statistics, quotes)\n- The section or page where it appears\n\nFormat as a numbered list.\n\n---\n\n${text}`;
}

/** Prompt for methodology extraction */
export function methodologyPrompt(text: string): string {
  return `Extract and summarize the methodology from the following document. Include:\n- Research design and approach\n- Sample/population details\n- Data collection methods\n- Analysis techniques\n- Any validity or reliability measures\n- Ethical considerations\n\n---\n\n${text}`;
}

/** Prompt for limitation extraction */
export function limitationsPrompt(text: string): string {
  return `Extract all limitations, caveats, and weaknesses explicitly mentioned in the following document. Include the authors' own stated limitations and any methodological weaknesses evident in the text. For each limitation, note where it appears in the document.\n\n---\n\n${text}`;
}
