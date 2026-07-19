/**
 * Citation Extraction
 *
 * Parses academic citations from PDF text and identifies
 * citation patterns for formatting.
 *
 * @module citations/extractCitations
 */

import type { ParsedCitation } from '../types/index.js';
import { CitationError } from '../utils/errors.js';

/**
 * Extract citations from document text using regex patterns
 */
export function extractCitationsFromText(text: string): ParsedCitation[] {
  const citations: ParsedCitation[] = [];
  const seen = new Set<string>();

  // Pattern 1: APA style in-text (Author, Year) or (Author, Year, p. X)
  const apaPattern = /\(([A-Z][a-zA-Z\s\-\.,]+)(?:\s+\u0026?\s+[A-Z][a-zA-Z\s\-\.,]+)*(?:\s+et\s+al\.)?\s*,\s*(\d{4})(?:,\s*p\.?\s*(\d+))?\)/g;

  // Pattern 2: Author-Year inline: Author (Year)
  const inlinePattern = /([A-Z][a-zA-Z\s\-]+)\s*\((\d{4})\)/g;

  // Pattern 3: Numbered citations [1], [1, 2], [1-3]
  const numberedPattern = /\[(\d+(?:\s*,\s*\d+)*|(?:\d+\s*\-\s*\d+))\]/g;

  // Pattern 4: DOI patterns
  const doiPattern = /(?:doi:|https?:\/\/doi\.org\/)?(10\.\d{4,}\/[^\s\]\)\,]+)/gi;

  // Pattern 5: Full citation in references section
  const fullCitationPattern =
    /^([A-Z][a-zA-Z\s\-,]+)\s*\((\d{4})\)\.\s*([^\.]+)\.\s*(?:In\s+)?([^\.\d]+)?(?:\s*\d+(?:\(\d+\))?)?(?:,\s*pp?\.?\s*\d+[-–]\d+)?/gm;

  // Extract APA citations
  let match: RegExpExecArray | null;
  while ((match = apaPattern.exec(text)) !== null) {
    const raw = match[0];
    if (seen.has(raw)) continue;
    seen.add(raw);

    citations.push({
      raw,
      type: 'article-journal',
      authors: parseAuthors(match[1]),
      year: parseInt(match[2], 10),
      confidence: 0.8,
    });
  }

  // Extract inline citations
  while ((match = inlinePattern.exec(text)) !== null) {
    const raw = match[0];
    if (seen.has(raw)) continue;
    seen.add(raw);

    citations.push({
      raw,
      type: 'article-journal',
      authors: parseAuthors(match[1]),
      year: parseInt(match[2], 10),
      confidence: 0.7,
    });
  }

  // Extract DOIs
  while ((match = doiPattern.exec(text)) !== null) {
    const raw = match[0];
    if (seen.has(raw)) continue;
    seen.add(raw);

    citations.push({
      raw,
      type: 'article-journal',
      doi: match[1],
      confidence: 0.9,
    });
  }

  // Extract full citations from references section
  const refSection = extractReferencesSection(text);
  if (refSection) {
    while ((match = fullCitationPattern.exec(refSection)) !== null) {
      const raw = match[0];
      if (seen.has(raw)) continue;
      seen.add(raw);

      citations.push({
        raw,
        type: 'article-journal',
        authors: parseAuthors(match[1]),
        year: parseInt(match[2], 10),
        title: match[3].trim(),
        journal: match[4]?.trim(),
        confidence: 0.9,
      });
    }
  }

  return citations;
}

/**
 * Extract the references section from document text
 */
function extractReferencesSection(text: string): string | null {
  const markers = [
    /REFERENCES\s*\n/i,
    /BIBLIOGRAPHY\s*\n/i,
    /Works Cited\s*\n/i,
    /Literature Cited\s*\n/i,
  ];

  for (const marker of markers) {
    const match = text.match(marker);
    if (match) {
      const start = match.index! + match[0].length;
      return text.slice(start);
    }
  }

  return null;
}

/**
 * Parse author string into structured array
 */
function parseAuthors(authorStr: string): ParsedCitation['authors'] {
  if (!authorStr) return undefined;

  const authors: NonNullable<ParsedCitation['authors']> = [];

  // Handle "et al."
  if (authorStr.toLowerCase().includes('et al')) {
    const main = authorStr.replace(/,?\s*et\s+al\.?/i, '').trim();
    if (main) {
      authors.push({ literal: main });
    }
    authors.push({ literal: 'et al.' });
    return authors;
  }

  // Split by & or and
  const parts = authorStr.split(/\s*\u0026\s*|\s+,?\s+and\s+/i);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Try to parse as "Family, Given" or "Given Family"
    const commaSplit = trimmed.split(/,\s*/);
    if (commaSplit.length === 2) {
      authors.push({ family: commaSplit[0].trim(), given: commaSplit[1].trim() });
    } else {
      const spaceSplit = trimmed.split(/\s+/);
      if (spaceSplit.length >= 2) {
        const family = spaceSplit.pop()!;
        const given = spaceSplit.join(' ');
        authors.push({ family, given });
      } else {
        authors.push({ literal: trimmed });
      }
    }
  }

  return authors;
}

/**
 * Extract citations from a specific chunk (for context-aware citation)
 */
export function extractCitationsFromChunk(text: string): ParsedCitation[] {
  return extractCitationsFromText(text);
}

/**
 * Deduplicate citations by DOI or author+year combination
 */
export function deduplicateCitations(citations: ParsedCitation[]): ParsedCitation[] {
  const seen = new Map<string, ParsedCitation>();

  for (const citation of citations) {
    const key = citation.doi
      ? `doi:${citation.doi}`
      : `${citation.authors?.[0]?.family ?? citation.authors?.[0]?.literal ?? 'unknown'}_${citation.year}`;

    const existing = seen.get(key);
    if (!existing || existing.confidence < citation.confidence) {
      seen.set(key, citation);
    }
  }

  return Array.from(seen.values());
}
