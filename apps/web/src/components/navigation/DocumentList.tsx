import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '@/lib/apiClient';
import { FileText, Loader2, Clock } from 'lucide-react';
import type { Project, Document } from '@/types';
import { cn } from '@/lib/utils';

export function DocumentList({ projects }: { projects: Project[] }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (projects.length === 0) return;
    setLoading(true);
    Promise.all(projects.map((p) => documentApi.list(p.id).catch(() => ({ documents: [] }))))
      .then((results) => {
        const all = results.flatMap((r, i) =>
          (r.documents || []).map((d) => ({
            ...d,
            projectId: projects[i].id,
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
            tags: [],
            isFavorite: false,
            lastReadAt: null,
            lastReadPage: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Document))
        );
        setDocs(all.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, [projects]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-fg-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading documents...
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-default py-6 text-center text-sm text-fg-muted">
        No documents yet. Upload documents to your projects.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <button
          key={doc.id}
          onClick={() => navigate(`/project/${doc.projectId}/doc/${doc.id}`)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg border border-border-default bg-surface p-3 text-left transition-colors hover:bg-surface-raised'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary-500/10 text-primary-500">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg-primary">{doc.title}</p>
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {doc.pageCount} pages
              </span>
              {doc.processingStatus !== 'completed' && (
                <span className="rounded bg-warning/10 px-1 text-[10px] text-warning">{doc.processingStatus}</span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
