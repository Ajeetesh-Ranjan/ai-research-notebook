/**
 * Citation Formatting
 *
 * Formats parsed citations in academic styles.
 *
 * @module citations/formatCitation
 */

import type { ParsedCitation, CitationStyle, FormattedCitation } from '../types/index.js';

/**
 * Format a citation in the specified style
 */
export function formatCitation(
  citation: ParsedCitation,
  style: CitationStyle
): FormattedCitation {
  switch (style) {
    case 'apa-7':
      return formatAPA(citation);
    case 'mla-9':
      return formatMLA(citation);
    case 'chicago-nb':
      return formatChicagoNB(citation);
    case 'chicago-ad':
      return formatChicagoAD(citation);
    case 'ieee':
      return formatIEEE(citation);
    case 'harvard':
      return formatHarvard(citation);
    case 'vancouver':
      return formatVancouver(citation);
    case 'nature':
      return formatNature(citation);
    case 'cell':
      return formatCell(citation);
    default:
      return formatAPA(citation);
  }
}

/**
 * Format multiple citations as a bibliography
 */
export function formatBibliography(
  citations: ParsedCitation[],
  style: CitationStyle
): string {
  const formatted = citations
    .map((c) => formatCitation(c, style))
    .sort((a, b) => a.bibliography.localeCompare(b.bibliography));

  switch (style) {
    case 'apa-7':
    case 'harvard':
    case 'chicago-ad':
      return formatted.map((f) => f.bibliography).join('\n\n');
    case 'ieee':
    case 'vancouver':
    case 'nature':
    case 'cell':
      return formatted.map((f, i) => `[${i + 1}] ${f.bibliography}`).join('\n\n');
    case 'chicago-nb':
      return formatted.map((f) => f.footnote ?? f.bibliography).join('\n\n');
    case 'mla-9':
      return formatted.map((f) => f.bibliography).join('\n\n');
    default:
      return formatted.map((f) => f.bibliography).join('\n\n');
  }
}

/** Format author names for APA */
function formatAuthorsAPA(authors?: ParsedCitation['authors']): string {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) {
    const a = authors[0];
    return a.family ? `${a.family}, ${a.given?.[0] ?? ''}.` : a.literal ?? '';
  }
  if (authors.length === 2) {
    const a = authors[0];
    const b = authors[1];
    const aStr = a.family ? `${a.family}, ${a.given?.[0] ?? ''}.` : a.literal ?? '';
    const bStr = b.family ? `${b.given ?? ''} ${b.family}` : b.literal ?? '';
    return `${aStr}, & ${bStr}`;
  }
  const first = authors[0];
  const firstStr = first.family ? `${first.family}, ${first.given?.[0] ?? ''}.` : first.literal ?? '';
  return `${firstStr} et al.`;
}

/** Format author names for MLA */
function formatAuthorsMLA(authors?: ParsedCitation['authors']): string {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) {
    const a = authors[0];
    return a.family ? `${a.family}, ${a.given}` : a.literal ?? '';
  }
  if (authors.length === 2) {
    const a = authors[0];
    const b = authors[1];
    const aStr = a.family ? `${a.family}, ${a.given}` : a.literal ?? '';
    const bStr = b.family ? `${b.given} ${b.family}` : b.literal ?? '';
    return `${aStr}, and ${bStr}`;
  }
  const first = authors[0];
  return first.family ? `${first.family}, ${first.given}, et al` : `${first.literal} et al`;
}

/** Format APA 7th edition */
function formatAPA(citation: ParsedCitation): FormattedCitation {
  const authors = formatAuthorsAPA(citation.authors);
  const year = citation.year ?? 'n.d.';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';
  const doi = citation.doi ? `https://doi.org/${citation.doi}` : '';

  const inText = citation.authors?.[0]?.family
    ? `${citation.authors[0].family} (${year})`
    : `(${year})`;

  const bibliography = `${authors} (${year}). ${title}. ${journal}${journal ? '.' : ''}${doi ? ` ${doi}` : ''}`;

  return { inText, bibliography, style: 'apa-7' };
}

/** Format MLA 9th edition */
function formatMLA(citation: ParsedCitation): FormattedCitation {
  const authors = formatAuthorsMLA(citation.authors);
  const year = citation.year ?? '';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';

  const inText = citation.authors?.[0]?.family
    ? `${citation.authors[0].family} ${year}`
    : `${year}`;

  const bibliography = `${authors}. "${title}." ${journal}${journal ? ',' : ''} ${year}${citation.pages ? `, pp. ${citation.pages}` : ''}.`;

  return { inText, bibliography, style: 'mla-9' };
}

/** Format Chicago Notes-Bibliography */
function formatChicagoNB(citation: ParsedCitation): FormattedCitation {
  const authors = formatAuthorsAPA(citation.authors);
  const year = citation.year ?? 'n.d.';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';

  const inText = citation.authors?.[0]?.family
    ? `${citation.authors[0].family}, ${title}`
    : title;

  const bibliography = `${authors}. ${title}. ${journal}, ${year}.`;
  const footnote = `${authors}, "${title}," ${journal} (${year})${citation.pages ? `: ${citation.pages}` : ''}.`;

  return { inText, bibliography, style: 'chicago-nb', footnote };
}

/** Format Chicago Author-Date */
function formatChicagoAD(citation: ParsedCitation): FormattedCitation {
  const authors = formatAuthorsAPA(citation.authors);
  const year = citation.year ?? 'n.d.';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';

  const inText = citation.authors?.[0]?.family
    ? `${citation.authors[0].family} ${year}`
    : `${year}`;

  const bibliography = `${authors}. ${year}. ${title}. ${journal}.`;

  return { inText, bibliography, style: 'chicago-ad' };
}

/** Format IEEE */
function formatIEEE(citation: ParsedCitation): FormattedCitation {
  const authors = citation.authors
    ?.map((a) => (a.family ? `${a.given?.[0] ?? ''}. ${a.family}` : a.literal))
    .join(', ') ?? 'Unknown Author';
  const year = citation.year ?? 'n.d.';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';

  const inText = '[1]';
  const bibliography = `${authors}, "${title}," ${journal}, ${year}${citation.pages ? `, pp. ${citation.pages}` : ''}.`;

  return { inText, bibliography, style: 'ieee' };
}

/** Format Harvard */
function formatHarvard(citation: ParsedCitation): FormattedCitation {
  return formatAPA(citation); // Harvard is very similar to APA
}

/** Format Vancouver */
function formatVancouver(citation: ParsedCitation): FormattedCitation {
  const authors = citation.authors
    ?.map((a) => {
      if (a.family) {
        const initials = a.given?.split(' ').map((n) => n[0]).join('') ?? '';
        return `${a.family} ${initials}`;
      }
      return a.literal;
    })
    .join(', ') ?? 'Unknown Author';
  const year = citation.year ?? '';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';

  const inText = '[1]';
  const bibliography = `${authors}. ${title}. ${journal}. ${year};${citation.volume ?? ''}${citation.issue ? `(${citation.issue})` : ''}${citation.pages ? `:${citation.pages}` : ''}.`;

  return { inText, bibliography, style: 'vancouver' };
}

/** Format Nature style */
function formatNature(citation: ParsedCitation): FormattedCitation {
  const authors = citation.authors
    ?.map((a) => (a.family ? `${a.family}, ${a.given?.split(' ').map((n) => n[0]).join('')}.` : a.literal))
    .join(', ') ?? 'Unknown Author';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';
  const year = citation.year ?? '';

  const inText = '[1]';
  const bibliography = `${authors} ${title}. ${journal}. ${year};${citation.volume ?? ''}${citation.issue ? `(${citation.issue})` : ''}${citation.pages ? `:${citation.pages}` : ''}.`;

  return { inText, bibliography, style: 'nature' };
}

/** Format Cell style */
function formatCell(citation: ParsedCitation): FormattedCitation {
  const authors = citation.authors
    ?.map((a) => (a.family ? `${a.given?.split(' ').map((n) => n[0]).join('')}. ${a.family}` : a.literal))
    .join(', ') ?? 'Unknown Author';
  const title = citation.title ?? 'Untitled';
  const journal = citation.journal ?? '';
  const year = citation.year ?? '';

  const inText = '[1]';
  const bibliography = `${authors} (${year}). ${title}. ${journal} ${citation.volume ?? ''}, ${citation.pages ?? ''}.`;

  return { inText, bibliography, style: 'cell' };
}
