import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { GraphControls } from './GraphControls';
import { graphApi } from '@/lib/apiClient';
import type { GraphNode as GraphNodeType, GraphEdge as GraphEdgeType } from '@/types';

const nodeTypes = {
  graphNode: GraphNode,
};

const edgeTypes = {
  graphEdge: GraphEdge,
};

export function KnowledgeGraph() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    graphApi
      .get(projectId)
      .then((res: unknown) => {
        const data = res as { nodes: GraphNodeType[]; edges: GraphEdgeType[] };
        const n: Node[] = (data.nodes || []).map((node) => ({
          id: node.id,
          type: 'graphNode',
          position: node.canvasPosition || { x: Math.random() * 600, y: Math.random() * 400 },
          data: { node },
        }));
        const e: Edge[] = (data.edges || []).map((edge) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
          type: 'graphEdge',
          data: { edge },
        }));
        setNodes(n);
        setEdges(e);
      })
      .catch(() => {
        // Fallback mock data
        const mockNodes: Node[] = [
          { id: 'n1', type: 'graphNode', position: { x: 100, y: 100 }, data: { node: { id: 'n1', label: 'Introduction', nodeType: 'document', color: '#6366F1' } as GraphNodeType } },
          { id: 'n2', type: 'graphNode', position: { x: 300, y: 80 }, data: { node: { id: 'n2', label: 'Methodology', nodeType: 'concept', color: '#10B981' } as GraphNodeType } },
          { id: 'n3', type: 'graphNode', position: { x: 500, y: 120 }, data: { node: { id: 'n3', label: 'Results', nodeType: 'topic', color: '#F59E0B' } as GraphNodeType } },
        ];
        const mockEdges: Edge[] = [
          { id: 'e1', source: 'n1', target: 'n2', type: 'graphEdge', data: { edge: { id: 'e1', edgeType: 'relates_to', label: 'leads to' } as GraphEdgeType } },
          { id: 'e2', source: 'n2', target: 'n3', type: 'graphEdge', data: { edge: { id: 'e2', edgeType: 'supports', label: 'supports' } as GraphEdgeType } },
        ];
        setNodes(mockNodes);
        setEdges(mockEdges);
      })
      .finally(() => setLoading(false));
  }, [projectId, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const filteredNodes = nodes.filter((n) =>
    !filter || n.data?.node?.label?.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredEdges = edges.filter(
    (e) => filteredNodes.some((n) => n.id === e.source) && filteredNodes.some((n) => n.id === e.target)
  );

  return (
    <div className="relative h-full w-full">
      <GraphControls filter={filter} onFilterChange={setFilter} />
      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-fg-muted">Loading graph...</div>
      ) : (
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background color="var(--border-subtle)" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const typeColors: Record<string, string> = {
                document: '#6366F1',
                note: '#10B981',
                highlight: '#F59E0B',
                concept: '#EC4899',
                entity: '#3B82F6',
                topic: '#8B5CF6',
                question: '#EF4444',
              };
              return typeColors[n.data?.node?.nodeType] || '#999';
            }}
            maskColor="rgba(0,0,0,0.2)"
            className="rounded-lg border border-border-default bg-surface"
          />
        </ReactFlow>
      )}
    </div>
  );
}
