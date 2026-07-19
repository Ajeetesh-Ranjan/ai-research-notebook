import { cn } from '@/lib/utils';

interface FormatSelectorProps {
  formats: string[];
  selected: string;
  onSelect: (format: string) => void;
}

const formatLabels: Record<string, string> = {
  markdown: 'Markdown',
  pdf: 'PDF',
  html: 'HTML',
  docx: 'Word',
};

const formatIcons: Record<string, string> = {
  markdown: '📝',
  pdf: '📄',
  html: '🌐',
  docx: '📘',
};

export function FormatSelector({ formats, selected, onSelect }: FormatSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {formats.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          className={cn(
            'flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors',
            selected === f
              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
              : 'border-border-default bg-surface text-fg-secondary hover:bg-surface-raised'
          )}
        >
          <span className="text-lg">{formatIcons[f] || '📄'}</span>
          <span className="font-medium">{formatLabels[f] || f}</span>
        </button>
      ))}
    </div>
  );
}
