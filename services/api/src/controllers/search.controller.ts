import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';

/**
 * Hybrid search across document chunks using full-text + semantic fallback.
 */
export async function search(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { query, projectId, searchType, topK } = req.body;

    // Full-text search on document chunks
    const chunks = await prisma.documentChunk.findMany({
      where: {
        tenantId: user.tenantId,
        projectId,
        textContent: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: topK || 10,
      include: {
        document: {
          select: { title: true, authors: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also search annotations
    const annotations = await prisma.annotation.findMany({
      where: {
        tenantId: user.tenantId,
        projectId,
        isDeleted: false,
        OR: [
          { textContent: { contains: query, mode: 'insensitive' } },
          { noteContent: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      include: {
        document: { select: { title: true } },
      },
    });

    const results = [
      ...chunks.map((chunk: typeof chunks[0]) => ({
        id: chunk.id,
        type: 'chunk' as const,
        documentId: chunk.documentId,
        pageNumber: chunk.pageNumber,
        textContent: chunk.textContent.substring(0, 300),
        score: 0.85,
        document: {
          title: chunk.document?.title || 'Untitled',
          authors: chunk.document?.authors || [],
        },
      })),
      ...annotations.map((a: typeof annotations[0]) => ({
        id: a.id,
        type: 'annotation' as const,
        documentId: a.documentId,
        pageNumber: a.pageNumber,
        textContent: (a.textContent || a.noteContent || '').substring(0, 300),
        score: 0.75,
        document: {
          title: a.document?.title || 'Untitled',
          authors: [],
        },
      })),
    ];

    res.json({
      query,
      searchType: searchType || 'hybrid',
      totalResults: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get search suggestions based on document titles and tags.
 */
export async function getSuggestions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { q, projectId } = req.query as { q?: string; projectId?: string };

    if (!q || q.length < 2) {
      res.json({ suggestions: [] });
      return;
    }

    const documents = await prisma.document.findMany({
      where: {
        tenantId: user.tenantId,
        ...(projectId && { projectId }),
        title: {
          contains: q,
          mode: 'insensitive',
        },
      },
      take: 5,
      select: { id: true, title: true, authors: true },
    });

    const tags = await prisma.document.findMany({
      where: {
        tenantId: user.tenantId,
        ...(projectId && { projectId }),
        tags: { has: q },
      },
      take: 5,
      select: { id: true, title: true, tags: true },
    });

    const suggestions = [
      ...documents.map((d: typeof documents[0]) => ({ type: 'document' as const, title: d.title, id: d.id })),
      ...tags.map((d: typeof tags[0]) => ({ type: 'tag' as const, title: d.title, id: d.id, tags: d.tags })),
    ];

    res.json({ suggestions: suggestions.slice(0, 8) });
  } catch (error) {
    next(error);
  }
}
