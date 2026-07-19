import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * List all knowledge graph nodes for a project.
 */
export async function listNodes(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { projectId } = req.params;

    const nodes = await prisma.knowledgeGraphNode.findMany({
      where: {
        projectId,
        tenantId: user.tenantId,
      },
      include: {
        outgoingEdges: {
          select: {
            id: true,
            targetId: true,
            edgeType: true,
            label: true,
            strength: true,
          },
        },
      },
    });

    res.json(nodes);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new knowledge graph node.
 */
export async function createNode(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const { nodeType, label, content, color, canvasPosition, canvasSize, sourceDocumentId, sourceAnnotationId, sourceNoteId } = req.body;

    const node = await prisma.knowledgeGraphNode.create({
      data: {
        tenantId: user.tenantId,
        projectId,
        userId: user.id,
        nodeType,
        label,
        content,
        color,
        canvasPosition: canvasPosition as any,
        canvasSize: canvasSize as any,
        sourceDocumentId,
        sourceAnnotationId,
        sourceNoteId,
      },
    });

    res.status(201).json(node);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single knowledge graph node.
 */
export async function getNode(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const node = await prisma.knowledgeGraphNode.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        outgoingEdges: {
          include: { targetNode: { select: { id: true, label: true, nodeType: true } } },
        },
        incomingEdges: {
          include: { sourceNode: { select: { id: true, label: true, nodeType: true } } },
        },
      },
    });

    if (!node) {
      throw new NotFoundError('Node');
    }

    res.json(node);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a knowledge graph node.
 */
export async function updateNode(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const node = await prisma.knowledgeGraphNode.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!node) {
      throw new NotFoundError('Node');
    }

    const { label, content, color, canvasPosition, canvasSize } = req.body;

    const updated = await prisma.knowledgeGraphNode.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(content !== undefined && { content }),
        ...(color !== undefined && { color }),
        ...(canvasPosition !== undefined && { canvasPosition: canvasPosition as any }),
        ...(canvasSize !== undefined && { canvasSize: canvasSize as any }),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a knowledge graph node.
 */
export async function deleteNode(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const node = await prisma.knowledgeGraphNode.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!node) {
      throw new NotFoundError('Node');
    }

    await prisma.knowledgeGraphNode.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * List all edges for a project.
 */
export async function listEdges(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { projectId } = req.params;

    const edges = await prisma.knowledgeGraphEdge.findMany({
      where: {
        projectId,
        tenantId: user.tenantId,
      },
      include: {
        sourceNode: { select: { id: true, label: true, nodeType: true } },
        targetNode: { select: { id: true, label: true, nodeType: true } },
      },
    });

    res.json(edges);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new knowledge graph edge.
 */
export async function createEdge(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const { sourceId, targetId, edgeType, label, strength } = req.body;

    if (sourceId === targetId) {
      throw new ValidationError('Source and target cannot be the same');
    }

    const edge = await prisma.knowledgeGraphEdge.create({
      data: {
        tenantId: user.tenantId,
        projectId,
        sourceId,
        targetId,
        edgeType,
        label,
        strength,
      },
    });

    res.status(201).json(edge);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a knowledge graph edge.
 */
export async function deleteEdge(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const edge = await prisma.knowledgeGraphEdge.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!edge) {
      throw new NotFoundError('Edge');
    }

    await prisma.knowledgeGraphEdge.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
