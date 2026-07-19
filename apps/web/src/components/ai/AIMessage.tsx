import { cn } from '@/lib/utils';
import { User, Bot, BookOpen } from 'lucide-react';
import type { AIMessage as AIMessageType } from '@/types';

interface AIMessageProps {
  message: AIMessageType;
}

export function AIMessage({ message }: AIMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('mb-3 flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary-600' : 'bg-secondary-600'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-white" />}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary-500/10 text-fg-primary'
            : 'bg-surface-raised text-fg-primary'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-border-subtle pt-2">
            <p className="text-xs font-medium text-fg-muted">Sources:</p>
            {message.citations.map((c, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-primary-400">
                <BookOpen className="h-3 w-3" />
                <span>Page {c.pageNumber}: {c.text.slice(0, 60)}...</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
