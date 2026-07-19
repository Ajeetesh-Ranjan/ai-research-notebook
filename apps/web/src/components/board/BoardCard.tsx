import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { StickyNote, Pin } from 'lucide-react';
import type { Note } from '@/types';

interface BoardCardData {
  card: Note;
}

function BoardCardComponent({ data }: NodeProps<BoardCardData>) {
  const { card } = data;

  return (
    <div className="w-48 rounded-lg border border-border-default bg-surface p-3 shadow-sm transition-shadow hover:shadow-md">
      <Handle type="target" position={Position.Top} className="h-2 w-2 bg-primary-500" />
      <div className="mb-1 flex items-center gap-1.5">
        {card.isPinned && <Pin className="h-3 w-3 text-warning" />}
        <StickyNote className="h-3.5 w-3.5 text-fg-muted" />
        <span className="truncate text-xs font-semibold text-fg-primary">{card.title || 'Untitled'}</span>
      </div>
      {card.content && (
        <p className="line-clamp-3 text-[11px] text-fg-secondary">{card.plainText || card.content}</p>
      )}
      <div className="mt-1 flex flex-wrap gap-1">
        {card.tags.map((tag) => (
          <span key={tag} className="rounded bg-bg-subtle px-1 text-[10px] text-fg-muted">
            {tag}
          </span>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2 bg-primary-500" />
    </div>
  );
}

export const BoardCard = memo(BoardCardComponent);
