import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, useAuthStore } from '@/stores';
import { projectApi } from '@/lib/apiClient';
import { ProjectCard } from './ProjectCard';
import { DocumentList } from './DocumentList';
import { FolderOpen, Plus, Loader2, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project, ViewMode } from '@/types';
import toast from 'react-hot-toast';

export function Dashboard() {
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const setLoading = useProjectStore((s) => s.setLoading);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [recentDocs, setRecentDocs] = useState<Project[]>([]);

  useEffect(() => {
    setLoading(true);
    projectApi
      .list()
      .then((res) => {
        const mapped = res.projects.map((p) => ({
          ...p,
          settings: {},
          isArchived: false,
          createdAt: p.updatedAt,
          updatedAt: p.updatedAt,
        })) as Project[];
        setProjects(mapped);
        setRecentDocs(mapped.slice(0, 3));
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [setProjects, setLoading]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await projectApi.create(newName.trim());
      const res = await projectApi.list();
      setProjects(
        res.projects.map((p) => ({
          ...p,
          settings: {},
          isArchived: false,
          createdAt: p.updatedAt,
          updatedAt: p.updatedAt,
        })) as Project[]
      );
      setNewName('');
      setShowCreate(false);
      toast.success('Project created');
    } catch {
      toast.error('Failed to create project');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-fg-primary">Dashboard</h1>
            <p className="text-sm text-fg-muted">
              Welcome back, {useAuthStore.getState().user?.name || 'Researcher'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border-default bg-bg-input">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  viewMode === 'grid' ? 'bg-surface-raised text-fg-primary' : 'text-fg-muted hover:text-fg-secondary'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  viewMode === 'list' ? 'bg-surface-raised text-fg-primary' : 'text-fg-muted hover:text-fg-secondary'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="mb-6 rounded-lg border border-border-default bg-surface p-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-fg-muted" />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Project name..."
                className="input-field flex-1"
              />
              <button onClick={handleCreate} className="btn-primary px-3 py-1.5 text-sm">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary px-3 py-1.5 text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">Recent Projects</h2>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-fg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-default py-8 text-center text-sm text-fg-muted">
              No projects yet. Create your first project to get started.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border-default bg-surface p-3 text-left transition-colors hover:bg-surface-raised"
                >
                  <FolderOpen className="h-5 w-5 text-primary-500" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-fg-primary">{p.name}</p>
                    <p className="text-xs text-fg-muted">{p.documentCount} documents · Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">Recent Documents</h2>
          <DocumentList projects={recentDocs} />
        </div>
      </div>
    </div>
  );
}
