import { useState } from 'react';
import { useAuthStore, useUIStore } from '@/stores';
import { ThemeToggle } from './ThemeToggle';
import { CITATION_STYLES } from '@/lib/constants';
import { User, Mail, BookOpen, Type, Palette, Save, Check } from 'lucide-react';
import { settingsApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export function SettingsPanel() {
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const [citationStyle, setCitationStyle] = useState(user?.preferences?.defaultCitationStyle || 'apa-7');
  const [fontSize, setFontSize] = useState(user?.preferences?.fontSize || 14);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update({
        theme,
        defaultCitationStyle: citationStyle,
        fontSize,
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-thin">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-fg-primary">Settings</h1>

        <div className="mb-6 rounded-lg border border-border-default bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-primary">
            <User className="h-4 w-4 text-fg-muted" />
            Profile
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                {user?.name?.[0] || user?.email[0] || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-fg-primary">{user?.name || 'Unnamed'}</p>
                <div className="flex items-center gap-1 text-xs text-fg-muted">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-border-default bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-primary">
            <Palette className="h-4 w-4 text-fg-muted" />
            Appearance
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-fg-muted">Theme</label>
              <ThemeToggle />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-fg-muted">Font Size</label>
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-fg-muted" />
                <input
                  type="range"
                  min={12}
                  max={20}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-sm text-fg-primary">{fontSize}px</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-border-default bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg-primary">
            <BookOpen className="h-4 w-4 text-fg-muted" />
            Research
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-fg-muted">Default Citation Style</label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                className="input-field w-full text-sm"
              >
                {CITATION_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
