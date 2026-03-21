import { useEffect, useMemo, useRef, useState } from 'react';
import { useStoreContext } from '../store/ArtiChartContext';
import type {
  ArtiChartInstance,
  ConnectionDraft,
  EdgeData,
  Selection,
  Viewport,
} from '../store/types';
import type { CanvasNodeData } from '../components/CanvasNode/CanvasNode.types';

// ---- Core Hooks ----

export function useArtiChart(): ArtiChartInstance {
  return useStoreContext().instance;
}

export function useNodes(): CanvasNodeData[] {
  return useStoreContext().state.nodes;
}

export function useEdges(): EdgeData[] {
  return useStoreContext().state.edges;
}

export function useViewport(): Viewport {
  return useStoreContext().state.viewport;
}

export function useSelection(): Selection {
  return useStoreContext().state.selection;
}

export function useConnectionDraft(): ConnectionDraft | null {
  return useStoreContext().state.connectionDraft;
}

// ---- Convenience Hooks ----

export function useNodesState(
  initialNodes: CanvasNodeData[] = [],
): [CanvasNodeData[], React.Dispatch<React.SetStateAction<CanvasNodeData[]>>] {
  const [nodes, setNodes] = useState(initialNodes);
  return [nodes, setNodes];
}

export function useEdgesState(
  initialEdges: EdgeData[] = [],
): [EdgeData[], React.Dispatch<React.SetStateAction<EdgeData[]>>] {
  const [edges, setEdges] = useState(initialEdges);
  return [edges, setEdges];
}

export function useOnSelectionChange(
  callback: (selection: Selection) => void,
): void {
  const { state } = useStoreContext();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    callbackRef.current(state.selection);
  }, [state.selection]);
}

export function useNodeConnections(nodeId: string): EdgeData[] {
  const { state } = useStoreContext();
  return useMemo(
    () => state.edges.filter((e) => e.source === nodeId || e.target === nodeId),
    [state.edges, nodeId],
  );
}

export function useHandleConnections(
  nodeId: string,
  connectorIndex: number,
  type: 'source' | 'target',
): EdgeData[] {
  const { state } = useStoreContext();
  return useMemo(
    () =>
      state.edges.filter((e) => {
        if (type === 'source') {
          return e.source === nodeId && (e.sourceConnector ?? 0) === connectorIndex;
        }
        return e.target === nodeId && (e.targetConnector ?? 0) === connectorIndex;
      }),
    [state.edges, nodeId, connectorIndex, type],
  );
}

export function useNodesData(
  nodeIds: string[],
): (CanvasNodeData | undefined)[] {
  const { state } = useStoreContext();
  return useMemo(() => {
    const map = new Map(state.nodes.map((n) => [n.id, n]));
    return nodeIds.map((id) => map.get(id));
  }, [state.nodes, nodeIds]);
}

export function useKeyPress(targetKey: string): boolean {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === targetKey) setPressed(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === targetKey) setPressed(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [targetKey]);

  return pressed;
}

export function useConnection(): ConnectionDraft | null {
  return useStoreContext().state.connectionDraft;
}

// ---- Intersection Hook ----

// Re-export layout hooks
export {
  useDagreLayout,
  useElkLayout,
  useForceLayout,
  useAutoLayout,
  resolveCollisions,
} from './useLayout';
export type {
  LayoutDirection,
  LayoutOptions,
  LayoutResult,
  LayoutEngine,
  AutoLayoutOptions,
  ForceSimulationConfig,
  DagreInstance,
  ElkInstance,
} from './useLayout';

// Re-export keyboard shortcuts
export {
  useKeyboardShortcuts,
  copyToClipboard,
  pasteFromClipboard,
  hasClipboard,
} from './useKeyboardShortcuts';
export type { KeyboardShortcutCallbacks, ClipboardData } from './useKeyboardShortcuts';

// ---- Intersection Hook ----

export function useIntersectingNodes(
  nodeId: string,
  nodes: CanvasNodeData[],
): CanvasNodeData[] {
  return useMemo(() => {
    const self = nodes.find((n) => n.id === nodeId);
    if (!self) return [];
    return nodes.filter((n) => {
      if (n.id === nodeId) return false;
      return (
        self.x < n.x + n.width &&
        self.x + self.width > n.x &&
        self.y < n.y + n.height &&
        self.y + self.height > n.y
      );
    });
  }, [nodeId, nodes]);
}
