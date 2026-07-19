import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';
import type { GraphEdge as GraphEdgeType } from '@/types';

interface GraphEdgeData {
  edge?: GraphEdgeType;
}

const edgeColors: Record<string, string> = {
  cites: '#6366F1',
  supports: '#10B981',
  contradicts: '#EF4444',
  relates_to: '#9CA3AF',
  contains: '#F59E0B',
  derived_from: '#8B5CF6',
  answers: '#3B82F6',
};

function GraphEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<GraphEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edge = data?.edge;
  const color = edge ? edgeColors[edge.edgeType] || '#999' : '#999';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: color, strokeWidth: 2 }}
      />
      {edge?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="rounded bg-surface-overlay px-1.5 py-0.5 text-[10px] text-fg-muted shadow-sm border border-border-default"
          >
            {edge.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const GraphEdge = memo(GraphEdgeComponent);
