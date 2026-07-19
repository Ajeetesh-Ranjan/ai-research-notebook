import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  open: boolean;
  onClose: () => void;
}

export function NoteEditor({ open, onClose }: NoteEditorProps) {
  const [text, setText] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border-default bg-surface-overlay p-4 shadow-xl animate-scaleIn">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg-primary">Add Note</h3>
          <button onClick={onClose} className="text-fg-muted hover:text-fg-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note..."
          className={cn('input-field min-h-[120px] w-full resize-none text-sm')}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary px-3 py-1.5 text-sm">Cancel</button>
          <button
            onClick={() => { setText(''); onClose(); }}
            className="btn-primary flex items-center gap-1 px-3 py-1.5 text-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
