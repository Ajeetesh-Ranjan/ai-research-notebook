import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';
import type { BoardConnection as BoardConnectionType } from '@/types';

interface BoardConnectionData {
  connection?: BoardConnectionType;
}

function BoardConnectionComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<BoardConnectionData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const connection = data?.connection;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: connection?.color || '#6366F1',
          strokeWidth: 2,
        }}
      />
      {connection?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="rounded bg-surface-overlay px-1.5 py-0.5 text-[10px] text-fg-muted shadow-sm border border-border-default"
          >
            {connection.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const BoardConnection = memo(BoardConnectionComponent);
