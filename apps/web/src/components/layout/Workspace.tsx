import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore, useDocumentStore, useUIStore } from '@/stores';
import { projectApi, documentApi } from '@/lib/apiClient';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { ResearchBoard } from '@/components/board/ResearchBoard';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { ExportDialog } from '@/components/export/ExportDialog';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  LayoutDashboard,
  Network,
  StickyNote,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'reader', label: 'Reader', icon: BookOpen },
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'sources', label: 'Sources', icon: FileText },
  { id: 'export', label: 'Export', icon: Download },
] as const;

export function ProjectWorkspace() {
  const { id, docId } = useParams<{ id: string; docId?: string }>();
  const projectId = id!;

  const activeTab = useUIStore((s) => s.activeWorkspaceTab);
  const setActiveTab = useUIStore((s) => s.setActiveWorkspaceTab);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);
  const setActiveDocumentId = useDocumentStore((s) => s.setActiveDocumentId);
  const setDocuments = useDocumentStore((s) => s.setDocuments);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);

  useEffect(() => {
    setActiveProjectId(projectId);
    documentApi
      .list(projectId)
      .then((res) => {
        const mapped = (res.documents || []).map((d) => ({
          ...d,
          projectId,
          description: null,
          authors: [],
          sourceUrl: null,
          doi: null,
          isbn: null,
          publicationDate: null,
          publisher: null,
          fileSize: 0,
          fileType: 'pdf',
          processingError: null,
          processingStatus: 'completed' as const,
          tags: [],
          isFavorite: false,
          lastReadAt: null,
          lastReadPage: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setDocuments(projectId, mapped);
        if (docId) setActiveDocumentId(docId);
      })
      .catch(() => toast.error('Failed to load documents'));

    projectApi
      .get(projectId)
      .catch(() => {});
  }, [projectId, docId, setActiveProjectId, setDocuments, setActiveDocumentId]);

  useEffect(() => {
    if (docId) setActiveDocumentId(docId);
  }, [docId, setActiveDocumentId]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg-base">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border-default bg-surface px-2">
        <div className="flex flex-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-fg-muted hover:text-fg-secondary'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => toggleRightPanel()}
          className="rounded-md p-1.5 text-fg-muted hover:bg-surface-raised hover:text-fg-primary"
          title="Toggle right panel"
        >
          {rightPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main workspace area */}
      <div className="flex flex-1 overflow-hidden">
        <div className={cn('flex-1 overflow-hidden transition-all', rightPanelOpen ? 'mr-[var(--right-panel-width)]' : '')}>
          {activeTab === 'reader' && <PDFViewer />}
          {activeTab === 'board' && <ResearchBoard />}
          {activeTab === 'graph' && <KnowledgeGraph />}
          {activeTab === 'notes' && (
            <div className="flex h-full items-center justify-center text-sm text-fg-muted">
              Notes view coming soon
            </div>
          )}
          {activeTab === 'sources' && (
            <div className="flex h-full items-center justify-center text-sm text-fg-muted">
              Sources view coming soon
            </div>
          )}
          {activeTab === 'export' && <ExportDialog />}
        </div>

        {/* Right panel */}
        {rightPanelOpen && (
          <div className="w-[var(--right-panel-width)] shrink-0 border-l border-border-default bg-surface">
            <AIChatPanel />
          </div>
        )}
      </div>
    </div>
  );
}
