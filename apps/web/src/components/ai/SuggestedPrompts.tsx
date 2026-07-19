import { Lightbulb, FileText, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const prompts = [
  { text: 'Summarize the key findings', icon: FileText, category: 'summarize' as const },
  { text: 'Compare with previous research', icon: Search, category: 'compare' as const },
  { text: 'Extract main arguments', icon: List, category: 'extract' as const },
  { text: 'Analyze methodology', icon: Lightbulb, category: 'analyze' as const },
];

interface SuggestedPromptsProps {
  onSelect: (text: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {prompts.map((p) => (
        <button
          key={p.text}
          onClick={() => onSelect(p.text)}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-border-default bg-surface p-2 text-left text-xs text-fg-secondary transition-colors hover:border-border-hover hover:bg-surface-raised'
          )}
        >
          <p.icon className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
          {p.text}
        </button>
      ))}
    </div>
  );
}
