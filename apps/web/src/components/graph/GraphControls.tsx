import { RefreshCw, Filter } from 'lucide-react';

interface GraphControlsProps {
  filter: string;
  onFilterChange: (value: string) => void;
}

export function GraphControls({ filter, onFilterChange }: GraphControlsProps) {
  return (
    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-border-default bg-surface-overlay px-3 py-2 shadow-sm">
      <Filter className="h-4 w-4 text-fg-muted" />
      <input
        type="text"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        placeholder="Filter nodes..."
        className="bg-transparent text-sm text-fg-primary outline-none placeholder:text-fg-muted"
      />
      {filter && (
        <button onClick={() => onFilterChange('')} className="text-fg-muted hover:text-fg-primary">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
