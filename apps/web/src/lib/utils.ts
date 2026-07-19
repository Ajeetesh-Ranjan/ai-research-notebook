import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getHighlightColor(hex: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    '#FCD34D': { bg: 'var(--highlight-yellow-bg)', text: 'var(--highlight-yellow)' },
    '#4ADE80': { bg: 'var(--highlight-green-bg)', text: 'var(--highlight-green)' },
    '#60A5FA': { bg: 'var(--highlight-blue-bg)', text: 'var(--highlight-blue)' },
    '#F472B6': { bg: 'var(--highlight-pink-bg)', text: 'var(--highlight-pink)' },
    '#A78BFA': { bg: 'var(--highlight-purple-bg)', text: 'var(--highlight-purple)' },
    '#FB923C': { bg: 'var(--highlight-orange-bg)', text: 'var(--highlight-orange)' },
  };
  return colors[hex] || colors['#FCD34D'];
}
