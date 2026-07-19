import { useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/stores';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Outlet } from 'react-router-dom';

export function Layout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const { token } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUIStore.getState().setCommandPaletteOpen(true);
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        useUIStore.getState().setKeyboardShortcutsOpen(true);
      }
      if (e.key === 'b' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUIStore.getState().toggleSidebar();
      }
      if (e.key === 'r' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUIStore.getState().toggleRightPanel();
      }
      if (e.key === 'Escape') {
        useUIStore.getState().setCommandPaletteOpen(false);
        useUIStore.getState().setKeyboardShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (token) {
      import('@/lib/apiClient').then(({ api }) => api.setToken(token));
    }
  }, [token]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className={`flex flex-1 flex-col transition-all duration-normal ${sidebarOpen ? 'ml-[var(--sidebar-width)]' : 'ml-[var(--sidebar-width-collapsed)]'}`}>
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
