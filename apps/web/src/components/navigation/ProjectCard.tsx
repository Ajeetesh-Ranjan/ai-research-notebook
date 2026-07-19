import { useNavigate } from 'react-router-dom';
import { FolderOpen, Clock, FileText } from 'lucide-react';
import type { Project } from '@/types';

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/project/${project.id}`)}
      className="group relative rounded-lg border border-border-default bg-surface p-4 text-left transition-all hover:border-border-hover hover:bg-surface-raised hover:shadow-md"
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: project.color || '#6366F1' }}
        >
          <FolderOpen className="h-4 w-4" />
        </div>
        <h3 className="truncate font-semibold text-fg-primary">{project.name}</h3>
      </div>
      {project.description && (
        <p className="mb-3 line-clamp-2 text-xs text-fg-muted">{project.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-fg-muted">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {project.documentCount} docs
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}
