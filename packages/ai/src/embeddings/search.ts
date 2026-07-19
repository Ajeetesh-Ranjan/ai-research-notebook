/**
 * Semantic search implementation
 *
 * Hybrid vector similarity + lexical search with re-ranking.
 *
 * @module embeddings/search
 */

import type {
  AIProvider,
  DocumentChunk,
  SemanticSearchInput,
  SemanticSearchResult,
} from '../types/index.js';
import { generateQueryEmbedding, cosineSimilarity } from './generate.js';
import { SearchError } from '../utils/errors.js';

/**
 * Perform semantic search across document chunks
 *
 * This is a local implementation for the AI package.
 * In production, this delegates to the database (pgvector) for vector search.
 */
export async function semanticSearch(
  input: SemanticSearchInput
): Promise<SemanticSearchResult[]> {
  const {
    ai,
    query,
    chunks, // In production, this comes from DB
    topK = 10,
    searchType = 'hybrid',
    rerank = false,
  } = input as SemanticSearchInput & { chunks?: DocumentChunk[] };

  if (!chunks || chunks.length === 0) {
    return [];
  }

  try {
    let results: SemanticSearchResult[] = [];

    if (searchType === 'semantic' || searchType === 'hybrid') {
      const semanticResults = await semanticSearchLocal(ai, query, chunks, topK * 2);
      results = semanticResults;
    }

    if (searchType === 'lexical' || searchType === 'hybrid') {
      const lexicalResults = lexicalSearch(query, chunks, topK * 2);

      if (searchType === 'hybrid') {
        results = fuseResults(results, lexicalResults, topK);
      } else {
        results = lexicalResults.map((r) => ({
          chunk: r.chunk,
          lexicalScore: r.score,
          fusedScore: r.score,
        }));
      }
    }

    if (rerank) {
      results = await rerankResults(ai, query, results, topK);
    }

    return results.slice(0, topK);
  } catch (error) {
    throw new SearchError(
      `Search failed: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Local semantic search using embedding similarity
 */
async function semanticSearchLocal(
  ai: AIProvider,
  query: string,
  chunks: DocumentChunk[],
  topK: number
): Promise<SemanticSearchResult[]> {
  const queryEmbedding = await generateQueryEmbedding(ai, query);

  const scored = chunks
    .filter((c) => c.embedding != null)
    .map((chunk) => ({
      chunk,
      semanticScore: cosineSimilarity(queryEmbedding, chunk.embedding!),
      lexicalScore: 0,
      fusedScore: 0,
    }));

  scored.sort((a, b) => b.semanticScore - a.semanticScore);

  return scored.slice(0, topK).map((s) => ({
    ...s,
    fusedScore: s.semanticScore,
  }));
}

/**
 * Lexical search using simple keyword matching
 * In production, this uses PostgreSQL full-text search (tsvector).
 */
function lexicalSearch(
  query: string,
  chunks: DocumentChunk[],
  topK: number
): { chunk: DocumentChunk; score: number }[] {
  const queryWords = new Set(
    query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  const scored = chunks.map((chunk) => {
    const chunkText = chunk.textContent.toLowerCase();
    const chunkWords = new Set(chunkText.replace(/[^\w\s]/g, '').split(/\s+/));

    let matches = 0;
    for (const word of queryWords) {
      if (chunkWords.has(word)) matches++;
    }

    // BM25-like scoring: boost exact phrase matches
    const exactPhraseMatch = chunkText.includes(query.toLowerCase()) ? 2 : 0;

    const score = matches / queryWords.size + exactPhraseMatch;

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Fuse semantic and lexical results using Reciprocal Rank Fusion (RRF)
 */
function fuseResults(
  semantic: SemanticSearchResult[],
  lexical: { chunk: DocumentChunk; score: number }[],
  topK: number,
  k = 60
): SemanticSearchResult[] {
  const scores = new Map<string, { semanticRank?: number; lexicalRank?: number }>();

  // Record semantic ranks
  for (let i = 0; i < semantic.length; i++) {
    const id = semantic[i].chunk.id;
    const existing = scores.get(id) ?? {};
    scores.set(id, { ...existing, semanticRank: i + 1 });
  }

  // Record lexical ranks
  for (let i = 0; i < lexical.length; i++) {
    const id = lexical[i].chunk.id;
    const existing = scores.get(id) ?? {};
    scores.set(id, { ...existing, lexicalRank: i + 1 });
  }

  // Compute fused scores
  const fused: SemanticSearchResult[] = [];
  for (const [id, ranks] of scores) {
    const semanticScore = ranks.semanticRank ? 1 / (k + ranks.semanticRank) : 0;
    const lexicalScore = ranks.lexicalRank ? 1 / (k + ranks.lexicalRank) : 0;
    const fusedScore = semanticScore + lexicalScore;

    const chunk =
      semantic.find((s) => s.chunk.id === id)?.chunk ??
      lexical.find((l) => l.chunk.id === id)?.chunk;

    if (chunk) {
      fused.push({
        chunk,
        semanticScore: ranks.semanticRank ? 1 / ranks.semanticRank : undefined,
        lexicalScore: ranks.lexicalRank ? 1 / ranks.lexicalRank : undefined,
        fusedScore,
      });
    }
  }

  fused.sort((a, b) => b.fusedScore - a.fusedScore);
  return fused.slice(0, topK);
}

/**
 * Re-rank results using a cross-encoder approach (LLM-based)
 */
async function rerankResults(
  ai: AIProvider,
  query: string,
  results: SemanticSearchResult[],
  topK: number
): Promise<SemanticSearchResult[]> {
  // For MVP, we use a simple LLM-based re-ranking
  // In production, use a dedicated cross-encoder model

  const rerankPrompt = results
    .map(
      (r, i) =>
        `Result ${i + 1}:\n${r.chunk.textContent.slice(0, 300)}\n`
    )
    .join('\n---\n');

  const messages = [
    {
      role: 'system' as const,
      content: 'You are a search relevance judge. Rank the following document excerpts by relevance to the query. Return ONLY a comma-separated list of result numbers in order of relevance (most relevant first).',
    },
    {
      role: 'user' as const,
      content: `Query: ${query}\n\n${rerankPrompt}\n\nReturn ranking:`,
    },
  ];

  try {
    const response = await ai.chat(messages, { temperature: 0, maxTokens: 100 });
    const ranking = response.content
      .replace(/[^\d,]/g, '')
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= results.length);

    const reranked: SemanticSearchResult[] = [];
    for (const rank of ranking) {
      if (results[rank - 1]) {
        reranked.push(results[rank - 1]);
      }
    }

    // Add any missing results at the end
    for (const r of results) {
      if (!reranked.some((rr) => rr.chunk.id === r.chunk.id)) {
        reranked.push(r);
      }
    }

    return reranked.slice(0, topK);
  } catch {
    // If re-ranking fails, return original results
    return results.slice(0, topK);
  }
}
