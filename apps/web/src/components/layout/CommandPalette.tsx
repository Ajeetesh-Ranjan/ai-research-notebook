import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore, useProjectStore, useDocumentStore } from '@/stores';
import { Search, FileText, Folder, ArrowRight, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
};

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useUIStore((s) => s.isCommandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const projects = useProjectStore((s) => s.projects);
  const documents = useDocumentStore((s) => s.documents);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'dashboard',
        title: 'Go to Dashboard',
        subtitle: 'Projects overview',
        icon: <Command className="h-4 w-4" />,
        action: () => { navigate('/dashboard'); setOpen(false); },
        shortcut: 'G D',
      },
      {
        id: 'new-project',
        title: 'New Project',
        subtitle: 'Create a new research project',
        icon: <Folder className="h-4 w-4" />,
        action: () => { navigate('/dashboard'); setOpen(false); },
      },
      {
        id: 'settings',
        title: 'Settings',
        subtitle: 'Open settings panel',
        icon: <Command className="h-4 w-4" />,
        action: () => { navigate('/settings'); setOpen(false); },
      },
    ];

    projects.forEach((p) => {
      items.push({
        id: `project-${p.id}`,
        title: p.name,
        subtitle: 'Project',
        icon: <Folder className="h-4 w-4" />,
        action: () => { navigate(`/project/${p.id}`); setOpen(false); },
      });
      const docs = documents[p.id] || [];
      docs.forEach((d) => {
        items.push({
          id: `doc-${d.id}`,
          title: d.title,
          subtitle: `Document in ${p.name}`,
          icon: <FileText className="h-4 w-4" />,
          action: () => { navigate(`/project/${p.id}/doc/${d.id}`); setOpen(false); },
        });
      });
    });

    return items;
  }, [projects, documents, navigate, setOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.subtitle && i.subtitle.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered, selectedIndex, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-command flex items-start justify-center bg-black/50 pt-[20vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border-default bg-surface-overlay shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border-default px-3 py-2.5">
          <Search className="h-4 w-4 text-fg-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, documents, commands..."
            className="flex-1 bg-transparent text-sm text-fg-primary outline-none placeholder:text-fg-muted"
          />
          <span className="rounded border border-border-default px-1.5 py-0.5 text-[10px] text-fg-muted">ESC</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-fg-muted">No results found</div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              onClick={item.action}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                idx === selectedIndex ? 'bg-primary-500/10 text-primary-400' : 'text-fg-secondary hover:bg-surface-raised'
              )}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-muted">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{item.title}</div>
                {item.subtitle && <div className="truncate text-xs text-fg-muted">{item.subtitle}</div>}
              </div>
              {idx === selectedIndex && <ArrowRight className="h-3.5 w-3.5 text-fg-muted" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
