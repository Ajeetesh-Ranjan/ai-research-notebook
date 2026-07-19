/**
 * Knowledge Graph Builder
 *
 * Orchestrates entity extraction, relation extraction, and graph assembly
 * for React Flow / D3 visualization.
 *
 * @module knowledgeGraph/buildGraph
 */

import type {
  AIProvider,
  BuildGraphInput,
  KnowledgeGraph,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  DocumentChunk,
} from '../types/index.js';
import { extractEntitiesFromChunks } from '../chains/extractEntities.js';

/**
 * Build a knowledge graph from document chunks
 *
 * Extracts entities and relations, then assembles into a graph
 * suitable for React Flow or D3.js visualization.
 */
export async function buildKnowledgeGraph(
  input: BuildGraphInput
): Promise<KnowledgeGraph> {
  const { ai, documentId, projectId, chunks, existingGraph } = input;

  // Extract entities and relations from chunks
  const extraction = await extractEntitiesFromChunks(ai, chunks);

  // Convert to graph nodes
  const nodes: KnowledgeGraphNode[] = extraction.entities.map((entity) => ({
    id: entity.id,
    type: mapEntityType(entity.type),
    label: entity.label,
    content: entity.occurrences.map((o) => o.text).join(' '),
    documentId,
    metadata: {
      confidence: entity.confidence,
      occurrences: entity.occurrences,
      projectId,
    },
    color: getNodeColor(mapEntityType(entity.type)),
    size: Math.max(10, entity.confidence * 50),
  }));

  // Add document node as root
  nodes.push({
    id: documentId,
    type: 'document',
    label: `Document ${documentId.slice(0, 8)}`,
    documentId,
    metadata: { projectId },
    color: getNodeColor('document'),
    size: 40,
  });

  // Convert to graph edges
  const edges: KnowledgeGraphEdge[] = extraction.relations.map((rel, i) => ({
    id: `edge_${i}`,
    sourceId: rel.source,
    targetId: rel.target,
    type: mapRelationType(rel.type),
    label: rel.type.replace(/_/g, ' '),
    strength: rel.confidence,
    metadata: { evidence: rel.evidence },
  }));

  // Add contains edges from document to all entities
  for (const node of nodes) {
    if (node.id !== documentId && node.type !== 'document') {
      edges.push({
        id: `contains_${node.id}`,
        sourceId: documentId,
        targetId: node.id,
        type: 'contains',
        label: 'contains',
        strength: 0.8,
        metadata: {},
      });
    }
  }

  // Merge with existing graph if provided
  if (existingGraph) {
    return mergeGraphs(existingGraph, { nodes, edges });
  }

  return { nodes, edges };
}

/**
 * Merge two knowledge graphs, deduplicating nodes
 */
function mergeGraphs(base: KnowledgeGraph, incoming: KnowledgeGraph): KnowledgeGraph {
  const nodeMap = new Map<string, KnowledgeGraphNode>();

  for (const node of base.nodes) {
    nodeMap.set(node.id, node);
  }

  for (const node of incoming.nodes) {
    const existing = nodeMap.get(node.id);
    if (existing) {
      // Merge metadata and boost confidence
      existing.metadata = { ...existing.metadata, ...node.metadata };
      existing.size = Math.max(existing.size ?? 10, node.size ?? 10);
    } else {
      nodeMap.set(node.id, node);
    }
  }

  const edgeMap = new Map<string, KnowledgeGraphEdge>();
  for (const edge of base.edges) {
    edgeMap.set(edge.id, edge);
  }
  for (const edge of incoming.edges) {
    if (!edgeMap.has(edge.id)) {
      edgeMap.set(edge.id, edge);
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}

/** Map extracted entity types to graph node types */
function mapEntityType(type: string): KnowledgeGraphNode['type'] {
  switch (type) {
    case 'person':
      return 'entity';
    case 'organization':
      return 'entity';
    case 'concept':
      return 'concept';
    case 'topic':
      return 'topic';
    case 'method':
      return 'concept';
    case 'finding':
      return 'highlight';
    case 'claim':
      return 'note';
    default:
      return 'concept';
  }
}

/** Map relation types to graph edge types */
function mapRelationType(type: string): KnowledgeGraphEdge['type'] {
  switch (type) {
    case 'cites':
      return 'cites';
    case 'supports':
      return 'supports';
    case 'contradicts':
      return 'contradicts';
    case 'relates_to':
      return 'relates_to';
    case 'contains':
      return 'contains';
    case 'derived_from':
      return 'derived_from';
    case 'authored_by':
      return 'relates_to';
    case 'published_in':
      return 'relates_to';
    case 'uses_method':
      return 'relates_to';
    case 'studies_topic':
      return 'relates_to';
    case 'proposes_concept':
      return 'supports';
    case 'evaluates':
      return 'relates_to';
    case 'applies':
      return 'relates_to';
    default:
      return 'relates_to';
  }
}

/** Get color for node type */
function getNodeColor(type: KnowledgeGraphNode['type']): string {
  const colors: Record<KnowledgeGraphNode['type'], string> = {
    document: '#3b82f6', // blue
    note: '#eab308', // yellow
    highlight: '#f97316', // orange
    concept: '#22c55e', // green
    entity: '#a855f7', // purple
    topic: '#06b6d4', // cyan
    question: '#ef4444', // red
    author: '#ec4899', // pink
  };
  return colors[type] ?? '#6b7280';
}

/**
 * Suggest connections between nodes in a graph
 */
export async function suggestConnections(
  ai: AIProvider,
  graph: KnowledgeGraph,
  nodeId: string
): Promise<
  { targetId: string; type: KnowledgeGraphEdge['type']; confidence: number; reason: string }[]
> {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return [];

  // Find related nodes that aren't already connected
  const connectedIds = new Set(
    graph.edges
      .filter((e) => e.sourceId === nodeId || e.targetId === nodeId)
      .map((e) => (e.sourceId === nodeId ? e.targetId : e.sourceId))
  );

  const candidates = graph.nodes.filter(
    (n) => n.id !== nodeId && !connectedIds.has(n.id)
  );

  if (candidates.length === 0) return [];

  // Build prompt for AI suggestion
  const candidateList = candidates
    .map((c) => `- ${c.label} (${c.type})`)
    .join('\n');

  const messages = [
    {
      role: 'system' as const,
      content: 'You are a knowledge graph assistant. Suggest meaningful connections between concepts.',
    },
    {
      role: 'user' as const,
      content: `Given the node "${node.label}" (${node.type}), which of the following nodes should it connect to?\n\nCandidates:\n${candidateList}\n\nReturn a JSON array: {targetLabel, relationshipType, confidence (0-1), reason}. Only suggest strong connections.`,
    },
  ];

  try {
    const response = await ai.chat(messages, { temperature: 0.2, maxTokens: 800 });
    const suggestions = parseSuggestions(response.content);

    return suggestions
      .map((s) => {
        const target = candidates.find(
          (c) => c.label.toLowerCase() === s.targetLabel.toLowerCase()
        );
        if (!target) return null;

        return {
          targetId: target.id,
          type: mapRelationType(s.relationshipType) as KnowledgeGraphEdge['type'],
          confidence: s.confidence,
          reason: s.reason,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s != null);
  } catch {
    return [];
  }
}

/** Parse suggestion JSON from AI response */
function parseSuggestions(text: string): {
  targetLabel: string;
  relationshipType: string;
  confidence: number;
  reason: string;
}[] {
  try {
    const cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((p) => p.targetLabel && p.confidence);
    }
    if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions.filter((p: Record<string, unknown>) => p.targetLabel && p.confidence);
    }
    return [];
  } catch {
    return [];
  }
}
