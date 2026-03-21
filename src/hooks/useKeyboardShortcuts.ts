import { useEffect, useRef } from 'react';
import type { CanvasNodeData } from '../components/CanvasNode/CanvasNode.types';
import type { EdgeData, Selection } from '../store/types';

export interface KeyboardShortcutCallbacks {
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
}

export function useKeyboardShortcuts(callbacks: KeyboardShortcutCallbacks): void {
  const ref = useRef(callbacks);
  ref.current = callbacks;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        ref.current.onUndo?.();
      } else if (isCtrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        ref.current.onRedo?.();
      } else if (isCtrl && e.key === 'c') {
        e.preventDefault();
        ref.current.onCopy?.();
      } else if (isCtrl && e.key === 'v') {
        e.preventDefault();
        ref.current.onPaste?.();
      } else if (isCtrl && e.key === 'x') {
        e.preventDefault();
        ref.current.onCut?.();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        ref.current.onDelete?.();
      } else if (isCtrl && e.key === 'a') {
        e.preventDefault();
        ref.current.onSelectAll?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

// Clipboard utilities for nodes/edges
export interface ClipboardData {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
}

let clipboard: ClipboardData | null = null;

export function copyToClipboard(
  selection: Selection,
  nodes: CanvasNodeData[],
  edges: EdgeData[],
): void {
  if (!selection) return;

  let selectedNodes: CanvasNodeData[] = [];
  let selectedEdges: EdgeData[] = [];

  if (selection.kind === 'node') {
    selectedNodes = nodes.filter((n) => n.id === selection.id);
    selectedEdges = edges.filter(
      (e) => e.source === selection.id || e.target === selection.id,
    );
  } else if (selection.kind === 'edge') {
    selectedEdges = edges.filter((e) => e.id === selection.id);
  } else if (selection.kind === 'multi') {
    const nodeSet = new Set(selection.nodeIds);
    selectedNodes = nodes.filter((n) => nodeSet.has(n.id));
    selectedEdges = edges.filter(
      (e) => nodeSet.has(e.source) && nodeSet.has(e.target),
    );
  }

  if (selectedNodes.length > 0 || selectedEdges.length > 0) {
    clipboard = {
      nodes: selectedNodes.map((n) => ({ ...n })),
      edges: selectedEdges.map((e) => ({ ...e })),
    };
  }
}

export function pasteFromClipboard(
  offset: { x: number; y: number } = { x: 20, y: 20 },
): ClipboardData | null {
  if (!clipboard) return null;

  const idMap = new Map<string, string>();
  const now = Date.now();

  const nodes = clipboard.nodes.map((n, i) => {
    const newId = `paste-${now}-${i}`;
    idMap.set(n.id, newId);
    return { ...n, id: newId, x: n.x + offset.x, y: n.y + offset.y };
  });

  const edges = clipboard.edges
    .filter((e) => idMap.has(e.source) && idMap.has(e.target))
    .map((e, i) => ({
      ...e,
      id: `paste-edge-${now}-${i}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }));

  return { nodes, edges };
}

export function hasClipboard(): boolean {
  return clipboard !== null;
}
