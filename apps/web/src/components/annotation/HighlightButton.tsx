import { useState, useRef } from 'react';
import { useDocumentStore, useAnnotationStore } from '@/stores';
import { annotationApi } from '@/lib/apiClient';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { Highlighter } from 'lucide-react';
import type { Annotation } from '@/types';
import toast from 'react-hot-toast';

interface HighlightButtonProps {
  color?: string;
  onHighlight?: (annotation: Annotation) => void;
}

export function HighlightButton({ color = HIGHLIGHT_COLORS[0].value, onHighlight }: HighlightButtonProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeDocId = useDocumentStore((s) => s.activeDocumentId);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);

  const handleHighlight = async () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !activeDocId) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const pageRect = containerRef.current?.getBoundingClientRect();
    if (!pageRect) return;

    const annotation: Annotation = {
      id: crypto.randomUUID(),
      projectId: '',
      documentId: activeDocId,
      userId: '',
      type: 'highlight',
      pageNumber: 1,
      boundingBox: {
        x: rect.left - pageRect.left,
        y: rect.top - pageRect.top,
        width: rect.width,
        height: rect.height,
      },
      color,
      textContent: selection.toString(),
      noteContent: null,
      aiSummary: null,
      aiTags: null,
      extractedEntities: null,
      sentiment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await annotationApi.create(activeDocId, annotation);
      addAnnotation(activeDocId, annotation);
      onHighlight?.(annotation);
      toast.success('Highlight saved');
    } catch {
      toast.error('Failed to save highlight');
    }
    selection.removeAllRanges();
  };

  return (
    <div ref={containerRef}>
      <button
        onClick={() => { setIsSelecting(!isSelecting); if (isSelecting) handleHighlight(); }}
        className="flex items-center gap-1 rounded-md bg-primary-500/10 px-2 py-1 text-xs font-medium text-primary-400 hover:bg-primary-500/20"
      >
        <Highlighter className="h-3.5 w-3.5" />
        {isSelecting ? 'Click to save' : 'Highlight'}
      </button>
    </div>
  );
}
