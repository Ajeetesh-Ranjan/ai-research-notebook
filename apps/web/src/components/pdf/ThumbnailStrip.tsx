import { cn } from '@/lib/utils';

interface ThumbnailStripProps {
  pageCount: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export function ThumbnailStrip({ pageCount, currentPage, onPageSelect }: ThumbnailStripProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="w-16 shrink-0 overflow-y-auto border-r border-border-default bg-surface scrollbar-thin py-2">
      <div className="space-y-1 px-1">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageSelect(page)}
            className={cn(
              'flex w-full flex-col items-center rounded-md border py-1 transition-colors',
              currentPage === page
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-transparent hover:bg-surface-raised'
            )}
          >
            <div className="h-10 w-10 rounded bg-bg-subtle" />
            <span className="mt-0.5 text-[10px] text-fg-muted">{page}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
