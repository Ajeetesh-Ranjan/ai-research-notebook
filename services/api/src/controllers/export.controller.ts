import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Export annotations and notes to Markdown.
 */
export async function createExport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { projectId, name, format, scope, scopeIds } = req.body;

    const exportJob = await prisma.export.create({
      data: {
        tenantId: user.tenantId,
        projectId,
        userId: user.id,
        name,
        format,
        scope,
        scopeIds: scopeIds || [],
        status: 'queued',
      },
    });

    // Process export synchronously for MVP
    await processExport(exportJob.id);

    const updatedJob = await prisma.export.findUnique({
      where: { id: exportJob.id },
    });

    res.status(201).json({
      id: updatedJob!.id,
      name: updatedJob!.name,
      format: updatedJob!.format,
      status: updatedJob!.status,
      downloadUrl: updatedJob!.downloadUrl,
      createdAt: updatedJob!.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get export status.
 */
export async function getExport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const exportJob = await prisma.export.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.id,
      },
    });

    if (!exportJob) {
      throw new NotFoundError('Export');
    }

    res.json({
      id: exportJob.id,
      name: exportJob.name,
      format: exportJob.format,
      status: exportJob.status,
      downloadUrl: exportJob.downloadUrl,
      fileSize: exportJob.fileSize,
      createdAt: exportJob.createdAt,
      completedAt: exportJob.completedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Download exported file.
 */
export async function downloadExport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const exportJob = await prisma.export.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.id,
      },
    });

    if (!exportJob) {
      throw new NotFoundError('Export');
    }

    if (exportJob.status !== 'completed') {
      res.status(400).json({ error: 'Export not ready' });
      return;
    }

    res.json({ downloadUrl: exportJob.downloadUrl });
  } catch (error) {
    next(error);
  }
}

/**
 * Process export job (generate file).
 */
async function processExport(exportId: string): Promise<void> {
  try {
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'processing' },
    });

    const exportJob = await prisma.export.findUnique({
      where: { id: exportId },
    });

    if (!exportJob) return;

    // Generate mock export content
    let content = `# ${exportJob.name}\n\n`;

    if (exportJob.scope === 'project') {
      const docs = await prisma.document.findMany({
        where: { projectId: exportJob.projectId },
      });
      content += `## Documents\n\n`;
      docs.forEach((d: typeof docs[0]) => {
        content += `- ${d.title}\n`;
      });
    }

    const annotations = await prisma.annotation.findMany({
      where: { projectId: exportJob.projectId, isDeleted: false },
    });
    content += `\n## Annotations\n\n`;
    annotations.forEach((a: typeof annotations[0]) => {
      content += `> ${a.textContent || 'No text'}\n\n${a.noteContent || ''}\n\n`;
    });

    const notes = await prisma.note.findMany({
      where: { projectId: exportJob.projectId },
    });
    content += `\n## Notes\n\n`;
    notes.forEach((n: typeof notes[0]) => {
      content += `### ${n.title || 'Untitled'}\n\n${n.content}\n\n`;
    });

    // Simulate file creation
    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: 'completed',
        downloadUrl: `/api/exports/${exportId}/download`,
        fileSize: Buffer.byteLength(content, 'utf8'),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
