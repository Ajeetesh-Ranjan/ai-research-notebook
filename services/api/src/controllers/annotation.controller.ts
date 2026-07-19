import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * List annotations for a document or project.
 */
export async function listAnnotations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const documentId = req.query.documentId as string | undefined;

    const annotations = await prisma.annotation.findMany({
      where: {
        tenantId: user.tenantId,
        projectId: req.params.projectId,
        ...(documentId && { documentId }),
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(annotations);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new annotation.
 */
export async function createAnnotation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const {
      documentId,
      projectId,
      type,
      pageNumber,
      boundingBox,
      quadPoints,
      inkList,
      color,
      textContent,
      noteContent,
    } = req.body;

    const annotation = await prisma.annotation.create({
      data: {
        tenantId: user.tenantId,
        projectId,
        documentId,
        userId: user.id,
        type,
        pageNumber,
        boundingBox: boundingBox as any,
        quadPoints: quadPoints as any,
        inkList: inkList as any,
        color: color || '#FFEB3B',
        textContent,
        noteContent,
      },
    });

    res.status(201).json(annotation);
  } catch (error) {
    next(error);
  }
}

/**
 * Update an annotation.
 */
export async function updateAnnotation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const annotation = await prisma.annotation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!annotation) {
      throw new NotFoundError('Annotation');
    }

    const { color, textContent, noteContent, boundingBox, pageNumber, isDeleted } = req.body;

    const updated = await prisma.annotation.update({
      where: { id },
      data: {
        ...(color !== undefined && { color }),
        ...(textContent !== undefined && { textContent }),
        ...(noteContent !== undefined && { noteContent }),
        ...(boundingBox !== undefined && { boundingBox: boundingBox as any }),
        ...(pageNumber !== undefined && { pageNumber }),
        ...(isDeleted !== undefined && { isDeleted }),
        version: { increment: 1 },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an annotation (soft delete).
 */
export async function deleteAnnotation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const annotation = await prisma.annotation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!annotation) {
      throw new NotFoundError('Annotation');
    }

    await prisma.annotation.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
