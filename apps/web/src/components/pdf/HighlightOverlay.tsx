import { useState } from 'react';
import { useAnnotationStore } from '@/stores';
import type { Annotation } from '@/types';

interface HighlightOverlayProps {
  annotation: Annotation;
  scale: number;
}

export function HighlightOverlay({ annotation, scale }: HighlightOverlayProps) {
  const [hovered, setHovered] = useState(false);
  const activeId = useAnnotationStore((s) => s.activeAnnotationId);
  const setActive = useAnnotationStore((s) => s.setActiveAnnotationId);

  const { x, y, width, height } = annotation.boundingBox;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: x * scale,
    top: y * scale,
    width: Math.max(width * scale, 4),
    height: Math.max(height * scale, 4),
    backgroundColor: annotation.color + (hovered || activeId === annotation.id ? 'CC' : '66'),
    borderRadius: 2,
    pointerEvents: 'auto',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  };

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setActive(annotation.id)}
      title={annotation.noteContent || annotation.textContent || 'Highlight'}
    />
  );
}
