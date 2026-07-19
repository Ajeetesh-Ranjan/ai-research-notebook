import { API_BASE_URL } from './constants';
import type { ApiError } from '@/types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const opts: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(headers || {}),
      },
    };

    if (body !== undefined) {
      if (body instanceof FormData) {
        delete (opts.headers as Record<string, string>)['Content-Type'];
        opts.body = body;
      } else {
        opts.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, opts);

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ApiError;
      const err = new Error(error.error?.message || `HTTP ${response.status}`);
      (err as Error & { status?: number; code?: string; requestId?: string }).status = response.status;
      (err as Error & { code?: string }).code = error.error?.code || 'UNKNOWN_ERROR';
      (err as Error & { requestId?: string }).requestId = error.error?.requestId;
      throw err;
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, headers);
  }

  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', path, body, headers);
  }

  patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', path, body, headers);
  }

  put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', path, body, headers);
  }

  delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', path, undefined, headers);
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post<{ token: string; user: { id: string; email: string; name: string | null } }>('/api/auth/login', { email, password }),
  register: (email: string, password: string, name: string) => api.post<{ token: string; user: { id: string; email: string; name: string | null } }>('/api/auth/register', { email, password, name }),
  refresh: () => api.post<{ token: string }>('/api/auth/refresh'),
  me: () => api.get<{ id: string; email: string; name: string | null; avatarUrl: string | null }>('/api/auth/me'),
};

// Project API
export const projectApi = {
  list: () => api.get<{ projects: Array<{ id: string; name: string; description: string | null; documentCount: number; updatedAt: string }> }>('/api/projects'),
  create: (name: string, description?: string) => api.post<{ id: string; name: string; description: string | null }>('/api/projects', { name, description }),
  get: (id: string) => api.get<{ id: string; name: string; description: string | null; documents: Array<{ id: string; title: string; pageCount: number; processingStatus: string }> }>(`/api/projects/${id}`),
  update: (id: string, data: { name?: string; description?: string }) => api.patch(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
};

// Document API
export const documentApi = {
  list: (projectId: string) => api.get<{ documents: Array<{ id: string; title: string; pageCount: number; processingStatus: string; thumbnailUrl: string | null }> }>(`/api/projects/${projectId}/documents`),
  upload: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/projects/${projectId}/documents`, form);
  },
  get: (id: string) => api.get<{ id: string; title: string; pageCount: number; processingStatus: string; fileUrl: string }>(`/api/documents/${id}`),
  delete: (id: string) => api.delete(`/api/documents/${id}`),
  annotations: (id: string) => api.get(`/api/documents/${id}/annotations`),
  pages: (id: string, page: number) => api.get(`/api/documents/${id}/pages/${page}`),
};

// Annotation API
export const annotationApi = {
  list: (documentId: string) => api.get(`/api/documents/${documentId}/annotations`),
  create: (documentId: string, data: unknown) => api.post(`/api/documents/${documentId}/annotations`, data),
  update: (id: string, data: unknown) => api.patch(`/api/annotations/${id}`, data),
  delete: (id: string) => api.delete(`/api/annotations/${id}`),
  aiSummary: (id: string) => api.post<{ summary: string; tags: string[] }>(`/api/annotations/${id}/ai-summary`),
};

// AI Chat API
export const aiApi = {
  conversations: (projectId: string) => api.get(`/api/projects/${projectId}/chat`),
  createConversation: (projectId: string, title?: string) => api.post(`/api/projects/${projectId}/chat`, { title }),
  sendMessage: (conversationId: string, content: string, context?: { documentIds?: string[]; annotationIds?: string[] }) => api.post(`/api/chat/${conversationId}/messages`, { content, context }),
  getConversation: (id: string) => api.get(`/api/chat/${id}`),
  deleteConversation: (id: string) => api.delete(`/api/chat/${id}`),
  summarize: (documentId: string, type: 'executive' | 'detailed' | 'bullet') => api.post(`/api/documents/${documentId}/summarize`, { type }),
};

// Search API
export const searchApi = {
  search: (projectId: string, query: string, options?: { topK?: number; searchType?: 'semantic' | 'lexical' | 'hybrid' }) => api.post(`/api/projects/${projectId}/search`, { query, ...(options || {}) }),
};

// Graph API
export const graphApi = {
  get: (projectId: string) => api.get(`/api/projects/${projectId}/graph`),
  createNode: (projectId: string, data: unknown) => api.post(`/api/projects/${projectId}/graph/nodes`, data),
  updateNode: (id: string, data: unknown) => api.patch(`/api/graph/nodes/${id}`, data),
  deleteNode: (id: string) => api.delete(`/api/graph/nodes/${id}`),
  createEdge: (projectId: string, data: unknown) => api.post(`/api/projects/${projectId}/graph/edges`, data),
  deleteEdge: (id: string) => api.delete(`/api/graph/edges/${id}`),
  extract: (projectId: string, documentIds: string[]) => api.post(`/api/projects/${projectId}/graph/extract`, { documentIds }),
};

// Board API
export const boardApi = {
  get: (projectId: string) => api.get(`/api/projects/${projectId}/board`),
  update: (projectId: string, data: unknown) => api.patch(`/api/projects/${projectId}/board`, data),
  updateCard: (cardId: string, data: unknown) => api.patch(`/api/board/cards/${cardId}`, data),
};

// Export API
export const exportApi = {
  create: (projectId: string, data: unknown) => api.post(`/api/projects/${projectId}/exports`, data),
  list: (projectId: string) => api.get(`/api/projects/${projectId}/exports`),
  get: (id: string) => api.get(`/api/exports/${id}`),
  download: (id: string) => api.get(`/api/exports/${id}/download`),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/api/users/me/preferences'),
  update: (data: unknown) => api.put('/api/users/me/preferences', data),
};
