import { useEffect } from 'react';
import { useAnnotationStore, useDocumentStore } from '@/stores';
import { annotationApi } from '@/lib/apiClient';
import { HighlightOverlay } from './HighlightOverlay';
import type { Annotation } from '@/types';

interface AnnotationLayerProps {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

export function AnnotationLayer({ pageNumber, width, height, scale }: AnnotationLayerProps) {
  const activeDocId = useDocumentStore((s) => s.activeDocumentId);
  const annotations = useAnnotationStore((s) => s.annotations);
  const setAnnotations = useAnnotationStore((s) => s.setAnnotations);

  const docAnnotations = activeDocId ? annotations[activeDocId] || [] : [];
  const pageAnnotations = docAnnotations.filter((a) => a.pageNumber === pageNumber);

  useEffect(() => {
    if (!activeDocId) return;
    annotationApi
      .list?.(activeDocId)
      .then((res) => {
        const list = (res as { annotations?: Annotation[] })?.annotations || [];
        setAnnotations(activeDocId, list);
      })
      .catch(() => {});
  }, [activeDocId, pageNumber, setAnnotations]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      {pageAnnotations.map((annotation) => (
        <HighlightOverlay
          key={annotation.id}
          annotation={annotation}
          scale={scale}
        />
      ))}
    </div>
  );
}
