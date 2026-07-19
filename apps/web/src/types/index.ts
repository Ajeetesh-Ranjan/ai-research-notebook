/**
 * Shared TypeScript types for CiteMind frontend.
 * Aligned with backend API contracts and database schema.
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'super_admin' | 'admin' | 'member' | 'viewer';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  pdfViewerMode: 'single' | 'continuous' | 'facing';
  defaultCitationStyle: string;
  defaultExportFormat: string;
  aiModel: string;
  aiTemperature: number;
  sidebarCollapsed: boolean;
  shortcuts: Record<string, string>;
  notificationPreferences: Record<string, boolean>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  settings: Record<string, unknown>;
  isArchived: boolean;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  authors: string[];
  sourceUrl: string | null;
  doi: string | null;
  isbn: string | null;
  publicationDate: string | null;
  publisher: string | null;
  pageCount: number;
  fileSize: number;
  fileType: string;
  thumbnailUrl: string | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'ocr_required';
  processingError: string | null;
  tags: string[];
  isFavorite: boolean;
  lastReadAt: string | null;
  lastReadPage: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentPage {
  id: string;
  documentId: string;
  pageNumber: number;
  textContent: string | null;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  projectId: string;
  documentId: string;
  userId: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'text_comment' | 'area_comment' | 'ink' | 'signature';
  pageNumber: number;
  boundingBox: BoundingBox;
  quadPoints?: number[];
  color: string;
  textContent: string | null;
  noteContent: string | null;
  aiSummary: string | null;
  aiTags: string[] | null;
  extractedEntities: string[] | null;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  projectId: string;
  userId: string;
  title: string | null;
  content: string;
  plainText: string | null;
  color: string | null;
  icon: string | null;
  tags: string[];
  linkedDocumentIds: string[];
  linkedAnnotationIds: string[];
  canvasPosition: { x: number; y: number; width: number; height: number } | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversation {
  id: string;
  projectId: string;
  userId: string;
  title: string | null;
  model: string;
  systemPrompt: string | null;
  contextDocuments: string[];
  contextAnnotations: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  citations: CitationReference[] | null;
  model: string | null;
  createdAt: string;
}

export interface CitationReference {
  documentId: string;
  chunkId: string | null;
  text: string;
  pageNumber: number;
}

export interface GraphNode {
  id: string;
  projectId: string;
  nodeType: 'document' | 'note' | 'highlight' | 'concept' | 'entity' | 'topic' | 'question';
  label: string;
  content: string | null;
  metadata: Record<string, unknown>;
  canvasPosition: { x: number; y: number } | null;
  canvasSize: { width: number; height: number } | null;
  color: string | null;
  sourceDocumentId: string | null;
  sourceAnnotationId: string | null;
  sourceNoteId: string | null;
  aiConfidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdge {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  edgeType: 'cites' | 'supports' | 'contradicts' | 'relates_to' | 'contains' | 'derived_from' | 'answers';
  label: string | null;
  metadata: Record<string, unknown>;
  strength: number | null;
  aiConfidence: number | null;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  documentId: string;
  pageNumber: number;
  textContent: string;
  score: number;
  highlights: string[];
  document: Pick<Document, 'id' | 'title' | 'authors'>;
}

export interface ExportJob {
  id: string;
  projectId: string;
  name: string;
  format: 'pdf' | 'word' | 'markdown' | 'html' | 'latex' | 'powerpoint' | 'bibliography';
  scope: 'project' | 'document' | 'selection' | 'graph';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  errorMessage: string | null;
  fileSize: number | null;
  downloadUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BoardCard {
  id: string;
  type: 'document' | 'note' | 'image' | 'link' | 'group';
  title: string;
  content: string | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string | null;
  metadata: Record<string, unknown>;
  connections: string[];
}

export interface BoardConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'cites' | 'supports' | 'contradicts' | 'relates_to';
  label: string | null;
  color: string | null;
}

export interface SuggestedPrompt {
  id: string;
  text: string;
  category: 'summarize' | 'compare' | 'analyze' | 'extract' | 'general';
}

export interface ChatStreamChunk {
  content: string;
  citations: CitationReference[] | null;
  done: boolean;
}

export type Theme = 'light' | 'dark' | 'system';

export type PanelView = 'chat' | 'annotations' | 'outline' | 'inspector' | 'none';

export type WorkspaceTab = 'reader' | 'board' | 'graph' | 'notes' | 'sources' | 'export';

export type ViewMode = 'grid' | 'list' | 'table';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    retryAfter?: number;
    action?: 'retry' | 'reload' | 'contact_support' | 'none';
  };
}
