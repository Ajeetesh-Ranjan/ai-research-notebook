import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Get the current board state for a project (notes + graph nodes positions).
 */
export async function getBoardState(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: user.tenantId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const notes = await prisma.note.findMany({
      where: {
        projectId,
        tenantId: user.tenantId,
        isArchived: false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        color: true,
        icon: true,
        tags: true,
        canvasPosition: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const nodes = await prisma.knowledgeGraphNode.findMany({
      where: {
        projectId,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        nodeType: true,
        label: true,
        content: true,
        canvasPosition: true,
        canvasSize: true,
        color: true,
        sourceDocumentId: true,
        sourceAnnotationId: true,
        sourceNoteId: true,
      },
    });

    const edges = await prisma.knowledgeGraphEdge.findMany({
      where: {
        projectId,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        sourceId: true,
        targetId: true,
        edgeType: true,
        label: true,
        strength: true,
      },
    });

    res.json({
      projectId,
      notes,
      graphNodes: nodes,
      graphEdges: edges,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save the board state (update note positions and graph layout).
 */
export async function saveBoardState(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { projectId } = req.params;
    const { notePositions, nodePositions, edges } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: user.tenantId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Update note positions
    if (notePositions && Array.isArray(notePositions)) {
      for (const pos of notePositions) {
        await prisma.note.updateMany({
          where: { id: pos.id, projectId, tenantId: user.tenantId },
          data: { canvasPosition: pos.canvasPosition as any },
        });
      }
    }

    // Update graph node positions
    if (nodePositions && Array.isArray(nodePositions)) {
      for (const pos of nodePositions) {
        await prisma.knowledgeGraphNode.updateMany({
          where: { id: pos.id, projectId, tenantId: user.tenantId },
          data: {
            canvasPosition: pos.canvasPosition as any,
            canvasSize: pos.canvasSize as any,
          },
        });
      }
    }

    // Update/create edges
    if (edges && Array.isArray(edges)) {
      for (const edge of edges) {
        await prisma.knowledgeGraphEdge.upsert({
          where: {
            sourceId_targetId_edgeType: {
              sourceId: edge.sourceId,
              targetId: edge.targetId,
              edgeType: edge.edgeType,
            },
          },
          update: { label: edge.label, strength: edge.strength },
          create: {
            tenantId: user.tenantId,
            projectId,
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            edgeType: edge.edgeType,
            label: edge.label,
            strength: edge.strength,
          },
        });
      }
    }

    res.json({ message: 'Board state saved', projectId });
  } catch (error) {
    next(error);
  }
}
