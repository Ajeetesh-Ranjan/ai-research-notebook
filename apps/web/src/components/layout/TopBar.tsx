import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useProjectStore, useUIStore } from '@/stores';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const rightPanelOpen = useUIStore((state) => state.rightPanelOpen);
  const toggleRightPanel = useUIStore((state) => state.toggleRightPanel);
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const user = useAuthStore((state) => state.user);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <header className="flex h-[var(--top-bar-height)] items-center border-b border-border-default bg-surface px-3">
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="rounded p-1 text-fg-muted hover:bg-surface-raised hover:text-fg-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="rounded p-1 text-fg-muted hover:bg-surface-raised hover:text-fg-primary transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-4 flex items-center gap-1">
        {activeProject && (
          <>
            <button className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-fg-primary hover:bg-surface-raised transition-colors">
              {activeProject.name}
              <ChevronDown className="h-3 w-3 text-fg-muted" />
            </button>
            <span className="text-fg-muted">/</span>
          </>
        )}
        <span className="text-sm text-fg-secondary">
          {pathParts[0] === 'project' && pathParts[2] === 'doc' ? 'Document' : pathParts[0] === 'settings' ? 'Settings' : 'Dashboard'}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => useUIStore.getState().setSearchOpen(true)}
          className="flex items-center gap-1 rounded-md border border-border-default bg-bg-input px-2 py-1 text-xs text-fg-muted hover:border-border-hover transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <span className="ml-1 hidden rounded bg-surface-raised px-1 text-[10px] text-fg-muted md:inline">⌘K</span>
        </button>

        <button
          onClick={() => toggleRightPanel()}
          className={cn(
            'rounded p-1.5 text-fg-muted transition-colors',
            rightPanelOpen ? 'bg-primary-500/10 text-primary-400' : 'hover:bg-surface-raised hover:text-fg-primary'
          )}
          title="Toggle right panel"
        >
          {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </button>

        <button className="relative rounded p-1.5 text-fg-muted hover:bg-surface-raised hover:text-fg-primary transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-error" />
        </button>

        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {user?.name?.[0] || user?.email[0] || 'U'}
        </button>
      </div>
    </header>
  );
}
