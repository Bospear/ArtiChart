import { useCallback, useMemo } from 'react';
import type { CanvasNodeData } from '../components/CanvasNode/CanvasNode.types';
import type { EdgeData } from '../store/types';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeSpacing?: number;
  rankSpacing?: number;
}

export interface LayoutResult {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
}

// ---- Dagre Layout ----

export interface DagreInstance {
  graphlib: {
    Graph: new (opts?: Record<string, unknown>) => DagreGraph;
  };
  layout: (g: DagreGraph) => void;
}

interface DagreGraph {
  setGraph: (opts: Record<string, unknown>) => void;
  setDefaultEdgeLabel: (fn: () => Record<string, unknown>) => void;
  setNode: (id: string, opts: Record<string, unknown>) => void;
  setEdge: (source: string, target: string) => void;
  node: (id: string) => { x: number; y: number };
}

export function useDagreLayout(
  dagre: DagreInstance | undefined,
  options: LayoutOptions = {},
): (nodes: CanvasNodeData[], edges: EdgeData[]) => LayoutResult {
  const { direction = 'TB', nodeSpacing = 50, rankSpacing = 50 } = options;

  return useCallback(
    (nodes: CanvasNodeData[], edges: EdgeData[]): LayoutResult => {
      if (!dagre) return { nodes, edges };

      const g = new dagre.graphlib.Graph();
      g.setGraph({
        rankdir: direction,
        nodesep: nodeSpacing,
        ranksep: rankSpacing,
      });
      g.setDefaultEdgeLabel(() => ({}));

      for (const node of nodes) {
        g.setNode(node.id, { width: node.width, height: node.height });
      }
      for (const edge of edges) {
        g.setEdge(edge.source, edge.target);
      }

      dagre.layout(g);

      const layoutNodes = nodes.map((node) => {
        const pos = g.node(node.id);
        return {
          ...node,
          x: pos.x - node.width / 2,
          y: pos.y - node.height / 2,
        };
      });

      return { nodes: layoutNodes, edges };
    },
    [dagre, direction, nodeSpacing, rankSpacing],
  );
}

// ---- ELK Layout ----

export interface ElkInstance {
  layout: (graph: ElkGraph) => Promise<ElkGraph>;
}

interface ElkGraph {
  id: string;
  layoutOptions?: Record<string, string>;
  children?: ElkNode[];
  edges?: ElkEdge[];
}

interface ElkNode {
  id: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}

export function useElkLayout(
  elk: ElkInstance | undefined,
  options: LayoutOptions = {},
): (nodes: CanvasNodeData[], edges: EdgeData[]) => Promise<LayoutResult> {
  const { direction = 'DOWN', nodeSpacing = 50, rankSpacing = 50 } = options;

  return useCallback(
    async (nodes: CanvasNodeData[], edges: EdgeData[]): Promise<LayoutResult> => {
      if (!elk) return { nodes, edges };

      const elkDir = direction === 'TB' ? 'DOWN' : direction === 'BT' ? 'UP' : direction === 'LR' ? 'RIGHT' : 'LEFT';

      const graph: ElkGraph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': elkDir,
          'elk.spacing.nodeNode': String(nodeSpacing),
          'elk.layered.spacing.nodeNodeBetweenLayers': String(rankSpacing),
        },
        children: nodes.map((n) => ({
          id: n.id,
          width: n.width,
          height: n.height,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          sources: [e.source],
          targets: [e.target],
        })),
      };

      const result = await elk.layout(graph);

      const posMap = new Map<string, { x: number; y: number }>();
      for (const child of result.children ?? []) {
        posMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
      }

      const layoutNodes = nodes.map((node) => {
        const pos = posMap.get(node.id);
        return pos ? { ...node, x: pos.x, y: pos.y } : node;
      });

      return { nodes: layoutNodes, edges };
    },
    [elk, direction, nodeSpacing, rankSpacing],
  );
}

// ---- Force Layout ----

export interface ForceSimulationConfig {
  strength?: number;
  distance?: number;
  iterations?: number;
}

interface ForceNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export function useForceLayout(
  config: ForceSimulationConfig = {},
): (nodes: CanvasNodeData[], edges: EdgeData[]) => LayoutResult {
  const { strength = -300, distance = 100, iterations = 100 } = config;

  return useCallback(
    (nodes: CanvasNodeData[], edges: EdgeData[]): LayoutResult => {
      if (nodes.length === 0) return { nodes, edges };

      const simNodes: ForceNode[] = nodes.map((n) => ({
        id: n.id,
        x: n.x + n.width / 2,
        y: n.y + n.height / 2,
        width: n.width,
        height: n.height,
        vx: 0,
        vy: 0,
      }));

      const nodeIndex = new Map(simNodes.map((n, i) => [n.id, i]));

      for (let iter = 0; iter < iterations; iter++) {
        // Repulsion (all pairs)
        for (let i = 0; i < simNodes.length; i++) {
          for (let j = i + 1; j < simNodes.length; j++) {
            const a = simNodes[i], b = simNodes[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = strength / (dist * dist);
            dx = (dx / dist) * force;
            dy = (dy / dist) * force;
            a.vx -= dx;
            a.vy -= dy;
            b.vx += dx;
            b.vy += dy;
          }
        }

        // Attraction (edges)
        for (const edge of edges) {
          const si = nodeIndex.get(edge.source);
          const ti = nodeIndex.get(edge.target);
          if (si === undefined || ti === undefined) continue;
          const a = simNodes[si], b = simNodes[ti];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - distance) * 0.01;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }

        // Apply velocity with damping
        const damping = 0.9;
        for (const node of simNodes) {
          node.x += node.vx * damping;
          node.y += node.vy * damping;
          node.vx *= damping;
          node.vy *= damping;
        }
      }

      const layoutNodes = nodes.map((n) => {
        const sim = simNodes[nodeIndex.get(n.id)!];
        return {
          ...n,
          x: sim.x - n.width / 2,
          y: sim.y - n.height / 2,
        };
      });

      return { nodes: layoutNodes, edges };
    },
    [strength, distance, iterations],
  );
}

// ---- Auto Layout (meta-hook) ----

export type LayoutEngine = 'dagre' | 'elk' | 'force';

export interface AutoLayoutOptions extends LayoutOptions, ForceSimulationConfig {
  engine: LayoutEngine;
  dagre?: DagreInstance;
  elk?: ElkInstance;
}

export function useAutoLayout(options: AutoLayoutOptions) {
  const dagreLayout = useDagreLayout(options.dagre, options);
  const elkLayout = useElkLayout(options.elk, options);
  const forceLayout = useForceLayout(options);

  return useMemo(() => {
    switch (options.engine) {
      case 'dagre':
        return dagreLayout;
      case 'elk':
        return (nodes: CanvasNodeData[], edges: EdgeData[]) =>
          elkLayout(nodes, edges);
      case 'force':
        return forceLayout;
      default:
        return dagreLayout;
    }
  }, [options.engine, dagreLayout, elkLayout, forceLayout]);
}

// ---- Node Collision Detection ----

export function resolveCollisions(
  nodes: CanvasNodeData[],
  padding: number = 10,
): CanvasNodeData[] {
  const resolved = nodes.map((n) => ({ ...n }));
  const maxIterations = 50;

  for (let iter = 0; iter < maxIterations; iter++) {
    let hadCollision = false;

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const a = resolved[i], b = resolved[j];
        const overlapX =
          Math.min(a.x + a.width + padding, b.x + b.width + padding) -
          Math.max(a.x, b.x);
        const overlapY =
          Math.min(a.y + a.height + padding, b.y + b.height + padding) -
          Math.max(a.y, b.y);

        if (overlapX > 0 && overlapY > 0) {
          hadCollision = true;
          if (overlapX < overlapY) {
            const push = overlapX / 2;
            if (a.x < b.x) {
              a.x -= push;
              b.x += push;
            } else {
              a.x += push;
              b.x -= push;
            }
          } else {
            const push = overlapY / 2;
            if (a.y < b.y) {
              a.y -= push;
              b.y += push;
            } else {
              a.y += push;
              b.y -= push;
            }
          }
        }
      }
    }

    if (!hadCollision) break;
  }

  return resolved;
}
