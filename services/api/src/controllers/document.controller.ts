import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { sanitizeFilename } from '../utils/helpers.js';
import { documentProcessingService } from '../services/documentProcessing.js';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env.js';

/**
 * Upload a new document to a project.
 */
export async function uploadDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const projectId = req.params.projectId || req.body.projectId;
    const file = req.file;

    if (!file) {
      throw new Error('No file uploaded');
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: user.tenantId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const sanitizedName = sanitizeFilename(file.originalname);
    const storageKey = `${user.tenantId}/${projectId}/${Date.now()}_${sanitizedName}`;
    const filePath = path.join(env.UPLOAD_DIR, storageKey);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    const document = await prisma.document.create({
      data: {
        tenantId: user.tenantId,
        projectId,
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        fileType: file.mimetype,
        fileSize: file.size,
        storageKey,
        storageBucket: 'local',
        processingStatus: 'pending',
        createdBy: user.id,
      },
    });

    // Process document in background
    setTimeout(() => {
      documentProcessingService.processDocument(document.id).catch(console.error);
    }, 0);

    res.status(201).json({
      id: document.id,
      title: document.title,
      fileType: document.fileType,
      fileSize: document.fileSize,
      processingStatus: document.processingStatus,
      createdAt: document.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List documents in a project.
 */
export async function listDocuments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const projectId = req.params.projectId;

    const documents = await prisma.document.findMany({
      where: {
        projectId,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: { annotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      documents.map((d: typeof documents[0]) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        authors: d.authors,
        fileType: d.fileType,
        fileSize: d.fileSize,
        pageCount: d.pageCount,
        processingStatus: d.processingStatus,
        isFavorite: d.isFavorite,
        annotationCount: d._count.annotations,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single document.
 */
export async function getDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: { annotations: true, pages: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    res.json({
      id: document.id,
      title: document.title,
      description: document.description,
      authors: document.authors,
      sourceUrl: document.sourceUrl,
      doi: document.doi,
      pageCount: document.pageCount,
      fileType: document.fileType,
      fileSize: document.fileSize,
      processingStatus: document.processingStatus,
      processingError: document.processingError,
      language: document.language,
      tags: document.tags,
      isFavorite: document.isFavorite,
      metadata: document.metadata,
      annotationCount: document._count.annotations,
      storedPageCount: document._count.pages,
      lastReadAt: document.lastReadAt,
      lastReadPage: document.lastReadPage,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update document metadata.
 */
export async function updateDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    const { title, description, authors, tags, isFavorite } = req.body;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(authors !== undefined && { authors }),
        ...(tags !== undefined && { tags }),
        ...(isFavorite !== undefined && { isFavorite }),
      },
    });

    res.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      authors: updated.authors,
      tags: updated.tags,
      isFavorite: updated.isFavorite,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a document.
 */
export async function deleteDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    // Delete file from storage
    try {
      const filePath = path.join(env.UPLOAD_DIR, document.storageKey);
      await fs.unlink(filePath);
    } catch {
      // File may not exist, continue
    }

    await prisma.document.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Download original document.
 */
export async function downloadDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    const filePath = path.join(env.UPLOAD_DIR, document.storageKey);
    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.title}.pdf"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    next(error);
  }
}

/**
 * Get document extracted text content.
 */
export async function getDocumentContent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!document) {
      throw new NotFoundError('Document');
    }

    const pages = await prisma.documentPage.findMany({
      where: { documentId: id },
      orderBy: { pageNumber: 'asc' },
      select: { pageNumber: true, textContent: true },
    });

    const text = pages.map((p: typeof pages[0]) => `\n--- Page ${p.pageNumber} ---\n${p.textContent || ''}`).join('\n');

    res.json({
      documentId: id,
      title: document.title,
      text,
      pages: pages.map((p: typeof pages[0]) => ({
        pageNumber: p.pageNumber,
        textContent: p.textContent,
      })),
    });
  } catch (error) {
    next(error);
  }
}
