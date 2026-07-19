import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ open, onOpenChange, selected, onSelect }: ColorPickerProps) {
  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-1 rounded-md p-1.5 text-fg-muted hover:bg-surface-raised"
        title="Highlight color"
      >
        <Palette className="h-4 w-4" />
        <div
          className="h-3 w-3 rounded-full border border-white/20"
          style={{ backgroundColor: selected }}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border-default bg-surface-overlay p-2 shadow-lg animate-scaleIn">
            <div className="grid grid-cols-3 gap-1">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { onSelect(c.value); onOpenChange(false); }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-surface-raised',
                    selected === c.value && 'bg-primary-500/10 text-primary-400'
                  )}
                >
                  <div
                    className="h-4 w-4 rounded-full border border-white/20"
                    style={{ backgroundColor: c.value }}
                  />
                  {selected === c.value && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
