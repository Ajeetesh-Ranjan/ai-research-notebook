import { z } from 'zod';

/**
 * Zod schema for user registration.
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

/**
 * Zod schema for user login.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Zod schema for creating a project.
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

/**
 * Zod schema for updating a project.
 */
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isArchived: z.boolean().optional(),
});

/**
 * Zod schema for creating an annotation.
 */
export const createAnnotationSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  projectId: z.string().uuid('Invalid project ID'),
  type: z.enum(['highlight', 'underline', 'strikethrough', 'text_comment', 'area_comment', 'ink', 'signature']),
  pageNumber: z.number().int().min(1),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  quadPoints: z.array(z.number()).optional(),
  inkList: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#FFEB3B'),
  textContent: z.string().optional(),
  noteContent: z.string().optional(),
});

/**
 * Zod schema for updating an annotation.
 */
export const updateAnnotationSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textContent: z.string().optional(),
  noteContent: z.string().optional(),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  pageNumber: z.number().int().min(1).optional(),
  isDeleted: z.boolean().optional(),
});

/**
 * Zod schema for AI chat request.
 */
export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  context: z.object({
    documentIds: z.array(z.string().uuid()).optional(),
    annotationIds: z.array(z.string().uuid()).optional(),
  }).optional(),
});

/**
 * Zod schema for AI summary request.
 */
export const summarySchema = z.object({
  documentId: z.string().uuid('Invalid document ID').optional(),
  text: z.string().optional(),
  type: z.enum(['executive', 'detailed', 'bullets']).default('detailed'),
  maxLength: z.number().int().optional(),
});

/**
 * Zod schema for search request.
 */
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  projectId: z.string().uuid('Invalid project ID'),
  searchType: z.enum(['semantic', 'lexical', 'hybrid']).default('hybrid'),
  topK: z.number().int().min(1).max(100).default(10),
  includeHighlights: z.boolean().default(false),
});

/**
 * Zod schema for creating a knowledge graph node.
 */
export const createNodeSchema = z.object({
  nodeType: z.enum(['document', 'note', 'highlight', 'concept', 'entity', 'topic', 'question']),
  label: z.string().min(1, 'Label is required'),
  content: z.string().optional(),
  color: z.string().optional(),
  canvasPosition: z.object({ x: z.number(), y: z.number() }).optional(),
  canvasSize: z.object({ width: z.number(), height: z.number() }).optional(),
  sourceDocumentId: z.string().uuid().optional(),
  sourceAnnotationId: z.string().uuid().optional(),
  sourceNoteId: z.string().uuid().optional(),
});

/**
 * Zod schema for creating a knowledge graph edge.
 */
export const createEdgeSchema = z.object({
  sourceId: z.string().uuid('Invalid source ID'),
  targetId: z.string().uuid('Invalid target ID'),
  edgeType: z.enum(['cites', 'supports', 'contradicts', 'relates_to', 'contains', 'derived_from', 'answers']),
  label: z.string().optional(),
  strength: z.number().min(0).max(1).optional(),
});

/**
 * Zod schema for export request.
 */
export const exportSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: z.string().min(1, 'Export name is required'),
  format: z.enum(['pdf', 'word', 'markdown', 'html', 'latex', 'powerpoint', 'bibliography']),
  scope: z.enum(['project', 'document', 'selection', 'graph']),
  scopeIds: z.array(z.string().uuid()).optional(),
  includeAnnotations: z.boolean().default(true),
  includeCitations: z.boolean().default(true),
});

/**
 * Zod schema for creating a note.
 */
export const createNoteSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  linkedDocumentIds: z.array(z.string().uuid()).optional(),
  linkedAnnotationIds: z.array(z.string().uuid()).optional(),
  canvasPosition: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
});
