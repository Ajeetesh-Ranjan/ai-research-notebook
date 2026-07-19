import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, User, Project, Document, Annotation, Note, AIConversation, Toast, PanelView, WorkspaceTab } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'citemind-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelView: PanelView;
  activeWorkspaceTab: WorkspaceTab;
  toasts: Toast[];
  isCommandPaletteOpen: boolean;
  isKeyboardShortcutsOpen: boolean;
  searchQuery: string;
  isSearchOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleRightPanel: (view?: PanelView) => void;
  setRightPanelView: (view: PanelView) => void;
  setActiveWorkspaceTab: (tab: WorkspaceTab) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      rightPanelOpen: true,
      rightPanelView: 'chat',
      activeWorkspaceTab: 'reader',
      toasts: [],
      isCommandPaletteOpen: false,
      isKeyboardShortcutsOpen: false,
      searchQuery: '',
      isSearchOpen: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleRightPanel: (view) =>
        set((state) => ({
          rightPanelOpen: view ? true : !state.rightPanelOpen,
          rightPanelView: view || state.rightPanelView,
        })),
      setRightPanelView: (view) => set({ rightPanelView: view }),
      setActiveWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),
      addToast: (toast) =>
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      setKeyboardShortcutsOpen: (open) => set({ isKeyboardShortcutsOpen: open }),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'citemind-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        rightPanelOpen: state.rightPanelOpen,
      }),
    }
  )
);

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProjectId: null,
  isLoading: false,
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface DocumentState {
  documents: Record<string, Document[]>;
  activeDocumentId: string | null;
  openDocuments: string[];
  isLoading: boolean;
  setDocuments: (projectId: string, documents: Document[]) => void;
  addDocument: (projectId: string, document: Document) => void;
  updateDocument: (projectId: string, document: Document) => void;
  removeDocument: (projectId: string, id: string) => void;
  setActiveDocumentId: (id: string | null) => void;
  openDocument: (id: string) => void;
  closeDocument: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: {},
  activeDocumentId: null,
  openDocuments: [],
  isLoading: false,
  setDocuments: (projectId, documents) =>
    set((state) => ({
      documents: { ...state.documents, [projectId]: documents },
    })),
  addDocument: (projectId, document) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [projectId]: [document, ...(state.documents[projectId] || [])],
      },
    })),
  updateDocument: (projectId, document) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [projectId]: (state.documents[projectId] || []).map((d) =>
          d.id === document.id ? document : d
        ),
      },
    })),
  removeDocument: (projectId, id) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [projectId]: (state.documents[projectId] || []).filter((d) => d.id !== id),
      },
    })),
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
  openDocument: (id) =>
    set((state) => ({
      openDocuments: state.openDocuments.includes(id) ? state.openDocuments : [...state.openDocuments, id],
      activeDocumentId: id,
    })),
  closeDocument: (id) =>
    set((state) => ({
      openDocuments: state.openDocuments.filter((d) => d !== id),
      activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface AnnotationState {
  annotations: Record<string, Annotation[]>;
  activeAnnotationId: string | null;
  isLoading: boolean;
  setAnnotations: (documentId: string, annotations: Annotation[]) => void;
  addAnnotation: (documentId: string, annotation: Annotation) => void;
  updateAnnotation: (documentId: string, annotation: Annotation) => void;
  removeAnnotation: (documentId: string, id: string) => void;
  setActiveAnnotationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  annotations: {},
  activeAnnotationId: null,
  isLoading: false,
  setAnnotations: (documentId, annotations) =>
    set((state) => ({
      annotations: { ...state.annotations, [documentId]: annotations },
    })),
  addAnnotation: (documentId, annotation) =>
    set((state) => ({
      annotations: {
        ...state.annotations,
        [documentId]: [annotation, ...(state.annotations[documentId] || [])],
      },
    })),
  updateAnnotation: (documentId, annotation) =>
    set((state) => ({
      annotations: {
        ...state.annotations,
        [documentId]: (state.annotations[documentId] || []).map((a) =>
          a.id === annotation.id ? annotation : a
        ),
      },
    })),
  removeAnnotation: (documentId, id) =>
    set((state) => ({
      annotations: {
        ...state.annotations,
        [documentId]: (state.annotations[documentId] || []).filter((a) => a.id !== id),
      },
    })),
  setActiveAnnotationId: (id) => set({ activeAnnotationId: id }),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface AIState {
  conversations: Record<string, AIConversation[]>;
  activeConversationId: string | null;
  isLoading: boolean;
  streamingContent: string;
  setConversations: (projectId: string, conversations: AIConversation[]) => void;
  addConversation: (projectId: string, conversation: AIConversation) => void;
  setActiveConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreamingContent: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  conversations: {},
  activeConversationId: null,
  isLoading: false,
  streamingContent: '',
  setConversations: (projectId, conversations) =>
    set((state) => ({
      conversations: { ...state.conversations, [projectId]: conversations },
    })),
  addConversation: (projectId, conversation) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [projectId]: [conversation, ...(state.conversations[projectId] || [])],
      },
    })),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  clearStreamingContent: () => set({ streamingContent: '' }),
}));

interface BoardState {
  cards: Record<string, Note[]>;
  selectedCardIds: string[];
  isLoading: boolean;
  setCards: (projectId: string, cards: Note[]) => void;
  addCard: (projectId: string, card: Note) => void;
  updateCard: (projectId: string, card: Note) => void;
  removeCard: (projectId: string, id: string) => void;
  selectCard: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  setLoading: (loading: boolean) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  cards: {},
  selectedCardIds: [],
  isLoading: false,
  setCards: (projectId, cards) =>
    set((state) => ({
      cards: { ...state.cards, [projectId]: cards },
    })),
  addCard: (projectId, card) =>
    set((state) => ({
      cards: {
        ...state.cards,
        [projectId]: [card, ...(state.cards[projectId] || [])],
      },
    })),
  updateCard: (projectId, card) =>
    set((state) => ({
      cards: {
        ...state.cards,
        [projectId]: (state.cards[projectId] || []).map((c) => (c.id === card.id ? card : c)),
      },
    })),
  removeCard: (projectId, id) =>
    set((state) => ({
      cards: {
        ...state.cards,
        [projectId]: (state.cards[projectId] || []).filter((c) => c.id !== id),
      },
    })),
  selectCard: (id, multi) =>
    set((state) => ({
      selectedCardIds: multi ? [...state.selectedCardIds, id] : [id],
    })),
  deselectAll: () => set({ selectedCardIds: [] }),
  setLoading: (isLoading) => set({ isLoading }),
}));
