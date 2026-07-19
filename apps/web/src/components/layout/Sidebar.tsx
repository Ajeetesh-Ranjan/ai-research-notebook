import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useProjectStore, useUIStore } from '@/stores';
import {
  Brain,
  Search,
  FolderOpen,
  BookOpen,
  Network,
  LayoutDashboard,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
} from 'lucide-react';
import { cn, truncate } from '@/lib/utils';
import { projectApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

const navItems = [
  { icon: FolderOpen, label: 'Projects', path: '/dashboard' },
  { icon: BookOpen, label: 'Sources', path: '/dashboard?sources' },
  { icon: Network, label: 'Graph', path: '/dashboard?graph' },
  { icon: LayoutDashboard, label: 'Board', path: '/dashboard?board' },
  { icon: MessageSquare, label: 'AI Chat', path: '/dashboard?chat' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const projects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const { user, logout } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const isActive = (path: string) => location.pathname === path.split('?')[0];

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await projectApi.create(newProjectName.trim());
      const res = await projectApi.list();
      setProjects(res.projects.map((p) => ({ ...p, settings: {}, isArchived: false, createdAt: p.updatedAt })) as import('@/types').Project[]);
      setNewProjectName('');
      setShowCreate(false);
      toast.success('Project created');
    } catch {
      toast.error('Failed to create project');
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-fixed flex h-full flex-col border-r border-border-default bg-surface transition-all duration-normal',
        sidebarOpen ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-width-collapsed)]'
      )}
    >
      <div className="flex h-[var(--top-bar-height)] items-center border-b border-border-default px-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-fg-primary hover:text-primary-400 transition-colors"
        >
          <Brain className="h-5 w-5 shrink-0 text-primary-500" />
          {sidebarOpen && <span className="font-semibold text-sm tracking-tight">CiteMind</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="ml-auto text-fg-muted hover:text-fg-primary transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="px-3 py-2">
          <button
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-md border border-border-default bg-bg-input px-3 py-1.5 text-sm text-fg-muted transition-colors hover:border-border-hover hover:text-fg-secondary"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <span className="ml-auto text-xs text-fg-muted">⌘K</span>
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive(item.path)
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-fg-secondary hover:bg-surface-raised hover:text-fg-primary'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>

        {sidebarOpen && (
          <>
            <div className="mt-4 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Projects</span>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="text-fg-muted hover:text-fg-primary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {showCreate && (
              <div className="px-2 py-1">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  placeholder="Project name..."
                  className="input-field h-8 text-xs"
                  autoFocus
                />
              </div>
            )}
            <ul className="mt-1 space-y-0.5">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      location.pathname === `/project/${project.id}`
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-fg-secondary hover:bg-surface-raised hover:text-fg-primary'
                    )}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-fg-muted" />
                    <span className="truncate">{truncate(project.name, 22)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="border-t border-border-default p-2">
        {sidebarOpen && (
          <>
            <button
              onClick={() => navigate('/settings')}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg-secondary hover:bg-surface-raised hover:text-fg-primary transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg-secondary hover:bg-surface-raised hover:text-fg-primary transition-colors"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Help</span>
            </button>
          </>
        )}
        <div className="mt-1 flex items-center gap-2 border-t border-border-subtle pt-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white text-xs font-semibold">
            {user?.name?.[0] || user?.email[0] || 'U'}
          </div>
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-fg-primary">{user?.name || user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-fg-muted hover:text-error transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
