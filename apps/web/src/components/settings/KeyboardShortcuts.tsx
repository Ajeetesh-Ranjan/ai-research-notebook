import { useUIStore } from '@/stores';
import { KEYBOARD_SHORTCUTS } from '@/lib/constants';
import { X, Keyboard } from 'lucide-react';

export function KeyboardShortcutsOverlay() {
  const open = useUIStore((s) => s.isKeyboardShortcutsOpen);
  const setOpen = useUIStore((s) => s.setKeyboardShortcutsOpen);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-border-default bg-surface-overlay shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg-primary">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-fg-muted hover:text-fg-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          <table className="w-full text-sm">
            <tbody>
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <tr key={shortcut.key} className="border-b border-border-subtle last:border-0">
                  <td className="py-2 pl-2 text-fg-secondary">{shortcut.description}</td>
                  <td className="py-2 pr-2 text-right">
                    <span className="rounded border border-border-default bg-bg-subtle px-1.5 py-0.5 font-mono text-xs text-fg-muted">
                      {shortcut.key}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
