import { useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores';

export function useKeyboardShortcuts() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setKeyboardShortcutsOpen = useUIStore((s) => s.setKeyboardShortcutsOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Command palette: Ctrl/Cmd + K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Keyboard shortcuts: ? (when not typing)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        setKeyboardShortcutsOpen(true);
      }
      // Toggle sidebar: Ctrl/Cmd + Shift + B
      if (e.key === 'b' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
      // Toggle right panel: Ctrl/Cmd + Shift + R
      if (e.key === 'r' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleRightPanel();
      }
      // Escape closes overlays
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setKeyboardShortcutsOpen(false);
      }
    },
    [setCommandPaletteOpen, setKeyboardShortcutsOpen, toggleSidebar, toggleRightPanel]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
}
