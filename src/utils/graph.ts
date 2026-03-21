import type { CanvasNodeData } from '../components/CanvasNode/CanvasNode.types';
import type { EdgeData } from '../store/types';

export function getIncomers(
  nodeId: string,
  nodes: CanvasNodeData[],
  edges: EdgeData[],
): CanvasNodeData[] {
  const sourceIds = new Set(
    edges.filter((e) => e.target === nodeId).map((e) => e.source),
  );
  return nodes.filter((n) => sourceIds.has(n.id));
}

export function getOutgoers(
  nodeId: string,
  nodes: CanvasNodeData[],
  edges: EdgeData[],
): CanvasNodeData[] {
  const targetIds = new Set(
    edges.filter((e) => e.source === nodeId).map((e) => e.target),
  );
  return nodes.filter((n) => targetIds.has(n.id));
}

export function getConnectedEdges(
  nodeId: string,
  edges: EdgeData[],
): EdgeData[] {
  return edges.filter((e) => e.source === nodeId || e.target === nodeId);
}

export function isNode(element: unknown): element is CanvasNodeData {
  return (
    typeof element === 'object' &&
    element !== null &&
    'id' in element &&
    'x' in element &&
    'y' in element &&
    'width' in element &&
    'height' in element
  );
}

export function isEdge(element: unknown): element is EdgeData {
  return (
    typeof element === 'object' &&
    element !== null &&
    'id' in element &&
    'source' in element &&
    'target' in element
  );
}

export function hasCycle(
  nodes: CanvasNodeData[],
  edges: EdgeData[],
  newEdge: { source: string; target: string },
): boolean {
  const adjacency = new Map<string, string[]>();
  for (const n of nodes) adjacency.set(n.id, []);
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target);
  }
  adjacency.get(newEdge.source)?.push(newEdge.target);

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(id: string): boolean {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    stack.add(id);
    for (const next of adjacency.get(id) ?? []) {
      if (dfs(next)) return true;
    }
    stack.delete(id);
    return false;
  }

  for (const n of nodes) {
    if (!visited.has(n.id) && dfs(n.id)) return true;
  }
  return false;
}

export function getNodesBounds(
  nodes: CanvasNodeData[],
): { x: number; y: number; width: number; height: number } {
  if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function deleteNodeAndReconnect(
  nodeId: string,
  nodes: CanvasNodeData[],
  edges: EdgeData[],
): { nodes: CanvasNodeData[]; edges: EdgeData[] } {
  const incoming = edges.filter((e) => e.target === nodeId);
  const outgoing = edges.filter((e) => e.source === nodeId);
  const unrelated = edges.filter(
    (e) => e.source !== nodeId && e.target !== nodeId,
  );

  const newEdges: EdgeData[] = [...unrelated];
  for (const inc of incoming) {
    for (const out of outgoing) {
      newEdges.push({
        id: `${inc.source}-${out.target}-${Date.now()}`,
        source: inc.source,
        target: out.target,
        sourceConnector: inc.sourceConnector,
        targetConnector: out.targetConnector,
      });
    }
  }

  return {
    nodes: nodes.filter((n) => n.id !== nodeId),
    edges: newEdges,
  };
}
