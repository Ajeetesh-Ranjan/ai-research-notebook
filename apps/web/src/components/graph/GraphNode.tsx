import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { FileText, StickyNote, Highlighter, Lightbulb, User, Hash, HelpCircle } from 'lucide-react';
import type { GraphNode as GraphNodeType } from '@/types';

interface GraphNodeData {
  node: GraphNodeType;
}

const typeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
  highlight: <Highlighter className="h-3.5 w-3.5" />,
  concept: <Lightbulb className="h-3.5 w-3.5" />,
  entity: <User className="h-3.5 w-3.5" />,
  topic: <Hash className="h-3.5 w-3.5" />,
  question: <HelpCircle className="h-3.5 w-3.5" />,
};

function GraphNodeComponent({ data }: NodeProps<GraphNodeData>) {
  const { node } = data;
  const color = node.color || '#6366F1';

  return (
    <div
      className="rounded-lg border border-border-default bg-surface p-2.5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <Handle type="target" position={Position.Top} className="h-2 w-2" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-1.5">
        <div className="text-fg-muted">{typeIcons[node.nodeType] || <FileText className="h-3.5 w-3.5" />}</div>
        <span className="max-w-[120px] truncate text-xs font-semibold text-fg-primary">{node.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="h-2 w-2" style={{ backgroundColor: color }} />
    </div>
  );
}

export const GraphNode = memo(GraphNodeComponent);
