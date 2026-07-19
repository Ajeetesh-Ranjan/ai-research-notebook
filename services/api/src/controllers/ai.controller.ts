import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { aiProvider } from '../services/aiProvider.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Create a new AI conversation.
 */
export async function createConversation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { title, model, systemPrompt } = req.body;

    const conversation = await prisma.aIConversation.create({
      data: {
        tenantId: user.tenantId,
        projectId: req.body.projectId,
        userId: user.id,
        title: title || 'New Conversation',
        model: model || 'gpt-4o',
        systemPrompt,
      },
    });

    res.status(201).json({
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a message and get AI response.
 */
export async function sendMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { content } = req.body;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.id,
      },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: id,
        role: 'user',
        content,
      },
    });

    // Build messages for AI
    const messages = [
      ...(conversation.systemPrompt
        ? [{ role: 'system' as const, content: conversation.systemPrompt }]
        : []),
      ...conversation.messages.map((m: typeof conversation.messages[0]) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content },
    ];

    // Get AI response
    const aiResponse = await aiProvider.chat(messages, {
      model: conversation.model,
      temperature: 0.7,
    });

    // Save assistant message
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId: id,
        role: 'assistant',
        content: aiResponse.content,
        citations: aiResponse.citations as any,
        model: conversation.model,
        tokensInput: aiResponse.tokensUsed?.input,
        tokensOutput: aiResponse.tokensUsed?.output,
      },
    });

    // Update conversation title if first message
    if (!conversation.title || conversation.title === 'New Conversation') {
      const messageCount = await prisma.aIMessage.count({
        where: { conversationId: id },
      });
      if (messageCount <= 2) {
        await prisma.aIConversation.update({
          where: { id },
          data: { title: content.substring(0, 50) + '...' },
        });
      }
    }

    res.json({
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      citations: assistantMessage.citations,
      createdAt: assistantMessage.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get conversation with messages.
 */
export async function getConversation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    res.json({
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      messages: conversation.messages.map((m: typeof conversation.messages[0]) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations,
        createdAt: m.createdAt,
      })),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List conversations for a project.
 */
export async function listConversations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const projectId = req.params.projectId;

    const conversations = await prisma.aIConversation.findMany({
      where: {
        projectId,
        tenantId: user.tenantId,
        userId: user.id,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a conversation.
 */
export async function deleteConversation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { id } = req.params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.id,
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation');
    }

    await prisma.aIConversation.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

/**
 * Generate a document summary.
 */
export async function generateSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { documentId, text, type, maxLength } = req.body;

    let contentToSummarize = text;

    if (documentId && !contentToSummarize) {
      const pages = await prisma.documentPage.findMany({
        where: { documentId },
        select: { textContent: true },
      });
      contentToSummarize = pages.map((p: typeof pages[0]) => p.textContent).join('\n\n');
    }

    if (!contentToSummarize) {
      throw new NotFoundError('Content to summarize');
    }

    const summary = await aiProvider.summarize(contentToSummarize, {
      type: type || 'detailed',
      maxLength,
    });

    res.json({ summary, type: type || 'detailed' });
  } catch (error) {
    next(error);
  }
}

/**
 * Semantic search across documents.
 */
export async function semanticSearch(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { query, projectId, topK } = req.body;

    // For MVP, use full-text search on document chunks
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
          select: { title: true },
        },
      },
    });

    const results = chunks.map((chunk: typeof chunks[0]) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      pageNumber: chunk.pageNumber,
      textContent: chunk.textContent.substring(0, 300),
      score: 0.8, // Mock score for MVP
      document: {
        title: chunk.document?.title || 'Untitled',
      },
    }));

    res.json(results);
  } catch (error) {
    next(error);
  }
}
