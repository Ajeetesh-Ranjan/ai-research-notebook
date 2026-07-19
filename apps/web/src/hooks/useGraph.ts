import { useState, useCallback, useEffect } from 'react';
import { graphApi } from '@/lib/apiClient';
import type { GraphNode, GraphEdge } from '@/types';
import toast from 'react-hot-toast';

export function useGraph(projectId: string) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await graphApi.get(projectId);
      const data = res as { nodes?: GraphNode[]; edges?: GraphEdge[] };
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch {
      toast.error('Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createNode = useCallback(async (data: Partial<GraphNode>) => {
    try {
      const res = await graphApi.createNode(projectId, data);
      const node = (res as { node?: GraphNode })?.node;
      if (node) setNodes((prev) => [...prev, node]);
      return node;
    } catch {
      toast.error('Failed to create node');
    }
  }, [projectId]);

  const createEdge = useCallback(async (data: Partial<GraphEdge>) => {
    try {
      const res = await graphApi.createEdge(projectId, data);
      const edge = (res as { edge?: GraphEdge })?.edge;
      if (edge) setEdges((prev) => [...prev, edge]);
      return edge;
    } catch {
      toast.error('Failed to create edge');
    }
  }, [projectId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return {
    nodes,
    edges,
    loading,
    fetchGraph,
    createNode,
    createEdge,
    setNodes,
    setEdges,
  };
}
