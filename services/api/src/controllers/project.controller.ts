import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { NotFoundError, AuthorizationError } from '../utils/errors.js';

/**
 * List projects for the authenticated user.
 */
export async function listProjects(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const projects = await prisma.project.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          { createdBy: user.id },
          {
            collaborators: {
              some: { userId: user.id },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(
      projects.map((p: typeof projects[0]) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        icon: p.icon,
        color: p.color,
        isArchived: p.isArchived,
        documentCount: p._count.documents,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new project.
 */
export async function createProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { name, description, icon, color } = req.body;

    const project = await prisma.project.create({
      data: {
        tenantId: user.tenantId,
        name,
        description,
        icon,
        color,
        createdBy: user.id,
      },
    });

    res.status(201).json({
      id: project.id,
      name: project.name,
      description: project.description,
      icon: project.icon,
      color: project.color,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a project by ID.
 */
export async function getProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        OR: [
          { createdBy: user.id },
          {
            collaborators: {
              some: { userId: user.id },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { documents: true, annotations: true, notes: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      icon: project.icon,
      color: project.color,
      isArchived: project.isArchived,
      settings: project.settings,
      documentCount: project._count.documents,
      annotationCount: project._count.annotations,
      noteCount: project._count.notes,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a project.
 */
export async function updateProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Check permissions
    const isCreator = project.createdBy === user.id;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isCreator && !isAdmin) {
      throw new AuthorizationError('Only project creators can update the project');
    }

    const { name, description, icon, color, isArchived } = req.body;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      icon: updated.icon,
      color: updated.color,
      isArchived: updated.isArchived,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a project.
 */
export async function deleteProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const isCreator = project.createdBy === user.id;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isCreator && !isAdmin) {
      throw new AuthorizationError('Only project creators can delete the project');
    }

    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
