import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/apiClient';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { KeyboardShortcutsOverlay } from '@/components/settings/KeyboardShortcuts';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/components/navigation/LoginPage';
import { RegisterPage } from '@/components/navigation/RegisterPage';
import { Dashboard } from '@/components/navigation/Dashboard';
import { ProjectWorkspace } from '@/components/layout/Workspace';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

function App() {
  const { token, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    if (token) {
      api.setToken(token);
      // Validate token on load
      import('@/lib/apiClient').then(({ authApi }) => {
        authApi.me().then((user) => {
          setUser({
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: 'member',
            preferences: {
              theme: 'system',
              fontSize: 14,
              pdfViewerMode: 'continuous',
              defaultCitationStyle: 'apa-7',
              defaultExportFormat: 'pdf',
              aiModel: 'gpt-4o',
              aiTemperature: 0.7,
              sidebarCollapsed: false,
              shortcuts: {},
              notificationPreferences: {},
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as unknown as import('@/types').User);
          setLoading(false);
        }).catch(() => {
          logout();
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
  }, [token, setUser, setLoading, logout]);

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectWorkspace />} />
            <Route path="/project/:id/doc/:docId" element={<ProjectWorkspace />} />
            <Route path="/settings" element={<SettingsPanel />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <CommandPalette />
      <KeyboardShortcutsOverlay />
    </ThemeProvider>
  );
}

export default App;
