import { describe, it, expect } from 'vitest';
import {
  extractCitationsFromText,
  extractCitationsFromChunk,
  deduplicateCitations,
} from '../../src/citations/extractCitations.js';
import {
  formatCitation,
  formatBibliography,
} from '../../src/citations/formatCitation.js';
import type { ParsedCitation } from '../../src/types/index.js';

describe('citations', () => {
  describe('extractCitationsFromText', () => {
    it('should extract APA in-text citations', () => {
      const text = 'The study found significant results (Smith, 2024). Another study confirmed this (Jones & Lee, 2023, p. 45).';
      const citations = extractCitationsFromText(text);

      expect(citations.length).toBeGreaterThan(0);
      const smith = citations.find((c) => c.raw.includes('Smith'));
      expect(smith).toBeDefined();
      expect(smith?.year).toBe(2024);
      expect(smith?.confidence).toBeGreaterThan(0);
    });

    it('should extract inline author-year citations', () => {
      const text = 'According to Johnson (2023), the results were significant.';
      const citations = extractCitationsFromText(text);

      const johnson = citations.find((c) => c.raw.includes('Johnson'));
      expect(johnson).toBeDefined();
      expect(johnson?.year).toBe(2023);
    });

    it('should extract DOIs', () => {
      const text = 'See the paper at https://doi.org/10.1234/example.123';
      const citations = extractCitationsFromText(text);

      const doi = citations.find((c) => c.doi);
      expect(doi).toBeDefined();
      expect(doi?.doi).toBe('10.1234/example.123');
    });

    it('should handle empty text', () => {
      const citations = extractCitationsFromText('');
      expect(citations).toEqual([]);
    });

    it('should handle text with no citations', () => {
      const citations = extractCitationsFromText('This is just regular text with no academic references.');
      expect(citations.length).toBe(0);
    });
  });

  describe('extractCitationsFromChunk', () => {
    it('should extract from a chunk of text', () => {
      const chunk = 'Brown (2022) proposed a new framework. See also Miller (2021).';
      const citations = extractCitationsFromChunk(chunk);
      expect(citations.length).toBeGreaterThan(0);
    });
  });

  describe('deduplicateCitations', () => {
    it('should remove duplicates by DOI', () => {
      const citations: ParsedCitation[] = [
        { raw: 'A', doi: '10.1234/a', year: 2024, confidence: 0.8 },
        { raw: 'B', doi: '10.1234/a', year: 2024, confidence: 0.9 },
        { raw: 'C', doi: '10.1234/b', year: 2023, confidence: 0.7 },
      ];

      const deduped = deduplicateCitations(citations);
      expect(deduped.length).toBe(2);
      // Should keep the higher confidence one
      const a = deduped.find((c) => c.doi === '10.1234/a');
      expect(a?.confidence).toBe(0.9);
    });

    it('should deduplicate by author-year when no DOI', () => {
      const citations: ParsedCitation[] = [
        {
          raw: 'A',
          authors: [{ family: 'Smith' }],
          year: 2024,
          confidence: 0.8,
        },
        {
          raw: 'B',
          authors: [{ family: 'Smith' }],
          year: 2024,
          confidence: 0.6,
        },
      ];

      const deduped = deduplicateCitations(citations);
      expect(deduped.length).toBe(1);
    });
  });

  describe('formatCitation', () => {
    const sampleCitation: ParsedCitation = {
      raw: 'test',
      type: 'article-journal',
      authors: [{ family: 'Smith', given: 'John' }],
      year: 2024,
      title: 'A Study of Things',
      journal: 'Journal of Studies',
      doi: '10.1234/study',
      confidence: 0.9,
    };

    it('should format APA citation', () => {
      const formatted = formatCitation(sampleCitation, 'apa-7');
      expect(formatted.inText).toContain('Smith');
      expect(formatted.inText).toContain('2024');
      expect(formatted.bibliography).toContain('Smith');
      expect(formatted.bibliography).toContain('A Study of Things');
      expect(formatted.style).toBe('apa-7');
    });

    it('should format MLA citation', () => {
      const formatted = formatCitation(sampleCitation, 'mla-9');
      expect(formatted.inText).toContain('Smith');
      expect(formatted.bibliography).toContain('"A Study of Things."');
      expect(formatted.style).toBe('mla-9');
    });

    it('should format IEEE citation', () => {
      const formatted = formatCitation(sampleCitation, 'ieee');
      expect(formatted.inText).toBe('[1]');
      expect(formatted.bibliography).toContain('Smith');
      expect(formatted.style).toBe('ieee');
    });

    it('should format Chicago NB citation', () => {
      const formatted = formatCitation(sampleCitation, 'chicago-nb');
      expect(formatted.bibliography).toBeTruthy();
      expect(formatted.footnote).toBeTruthy();
      expect(formatted.style).toBe('chicago-nb');
    });

    it('should handle missing authors gracefully', () => {
      const citation: ParsedCitation = {
        raw: 'test',
        type: 'article-journal',
        year: 2024,
        confidence: 0.8,
      };
      const formatted = formatCitation(citation, 'apa-7');
      expect(formatted.bibliography).toBeTruthy();
    });
  });

  describe('formatBibliography', () => {
    const citations: ParsedCitation[] = [
      {
        raw: 'a',
        type: 'article-journal',
        authors: [{ family: 'Zebra', given: 'Z' }],
        year: 2024,
        title: 'Zebra Study',
        confidence: 0.9,
      },
      {
        raw: 'b',
        type: 'article-journal',
        authors: [{ family: 'Apple', given: 'A' }],
        year: 2023,
        title: 'Apple Study',
        confidence: 0.9,
      },
    ];

    it('should format bibliography in APA', () => {
      const bib = formatBibliography(citations, 'apa-7');
      expect(bib).toContain('Apple');
      expect(bib).toContain('Zebra');
      // Should be alphabetically sorted (Apple before Zebra)
      expect(bib.indexOf('Apple')).toBeLessThan(bib.indexOf('Zebra'));
    });

    it('should format numbered styles with indices', () => {
      const bib = formatBibliography(citations, 'ieee');
      expect(bib).toContain('[1]');
      expect(bib).toContain('[2]');
    });
  });
});
