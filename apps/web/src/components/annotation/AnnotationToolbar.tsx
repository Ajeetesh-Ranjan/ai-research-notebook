import { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { NoteEditor } from './NoteEditor';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import {
  Highlighter,
  Underline,
  Strikethrough,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnotationToolbarProps {
  scale: number;
  onScaleChange: (s: number) => void;
  currentPage: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}

export function AnnotationToolbar({
  scale,
  onScaleChange,
  currentPage,
  pageCount,
  onPageChange,
}: AnnotationToolbarProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].value);

  const tools = [
    { id: 'highlight', icon: Highlighter, label: 'Highlight' },
    { id: 'underline', icon: Underline, label: 'Underline' },
    { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough' },
    { id: 'comment', icon: MessageSquare, label: 'Comment' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  return (
    <div className="flex items-center justify-between border-b border-border-default bg-surface px-3 py-1.5">
      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(activeTool === tool.id ? null : tool.id);
              if (tool.id === 'highlight' || tool.id === 'underline') setShowColorPicker(true);
              if (tool.id === 'comment') setShowNoteEditor(true);
            }}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              activeTool === tool.id
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-fg-muted hover:bg-surface-raised hover:text-fg-secondary'
            )}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-border-default" />
        <ColorPicker
          open={showColorPicker}
          onOpenChange={setShowColorPicker}
          selected={selectedColor}
          onSelect={setSelectedColor}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onScaleChange(Math.max(0.5, scale - 0.1))}
          className="rounded-md p-1 text-fg-muted hover:bg-surface-raised"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[3rem] text-center text-xs text-fg-secondary">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => onScaleChange(Math.min(3, scale + 0.1))}
          className="rounded-md p-1 text-fg-muted hover:bg-surface-raised"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <div className="mx-1 h-4 w-px bg-border-default" />

        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="rounded-md p-1 text-fg-muted hover:bg-surface-raised disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[4rem] text-center text-xs text-fg-secondary">
          {currentPage} / {pageCount}
        </span>
        <button
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage >= pageCount}
          className="rounded-md p-1 text-fg-muted hover:bg-surface-raised disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {showNoteEditor && (
        <NoteEditor
          open={showNoteEditor}
          onClose={() => { setShowNoteEditor(false); setActiveTool(null); }}
        />
      )}
    </div>
  );
}
