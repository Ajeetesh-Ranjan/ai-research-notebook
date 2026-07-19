import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap as RFMiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { BoardCard } from './BoardCard';
import { BoardConnection } from './BoardConnection';
import { useBoardStore } from '@/stores';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const nodeTypes = {
  boardCard: BoardCard,
};

const edgeTypes = {
  boardConnection: BoardConnection,
};

export function ResearchBoard() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const cards = useBoardStore((s) => s.cards[projectId] || []);

  const initialNodes: Node[] = cards.map((card, i) => ({
    id: card.id,
    type: 'boardCard',
    position: card.canvasPosition || { x: 100 + i * 220, y: 100 + (i % 3) * 160 },
    data: { card },
  }));

  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleAddCard = () => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'boardCard',
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: {
        card: {
          id: crypto.randomUUID(),
          projectId,
          userId: '',
          title: 'New Note',
          content: '',
          plainText: '',
          color: null,
          icon: null,
          tags: [],
          linkedDocumentIds: [],
          linkedAnnotationIds: [],
          canvasPosition: null,
          isPinned: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success('Card added');
  };

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="var(--border-subtle)" gap={16} />
        <Controls />
        <RFMiniMap
          nodeColor={(n) => {
            if (n.type === 'boardCard') return '#6366F1';
            return '#999';
          }}
          maskColor="rgba(0,0,0,0.2)"
          className="rounded-lg border border-border-default bg-surface"
        />
      </ReactFlow>
      <button
        onClick={handleAddCard}
        className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white shadow-lg hover:bg-primary-600"
      >
        <Plus className="h-4 w-4" />
        Add Card
      </button>
    </div>
  );
}
