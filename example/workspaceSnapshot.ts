import type { CanvasNodeData } from '../src';
import type { EdgeData } from '../src';
import type { CanvasProperties } from '../src';

/** Node tree: hierarchy encodes parent/child; `parentId` is omitted. */
export type NestedNodeSnapshot = Omit<CanvasNodeData, 'parentId'> & {
  children?: NestedNodeSnapshot[];
};

/** Parent canvas file + node that links to this sub-canvas. */
export type SnapshotParentRef = {
  file: string;
  tabId: string;
  nodeId: string;
};

export interface CanvasTabSnapshot {
  id: string;
  name: string;
  /** Virtual path of this canvas JSON (e.g. `/project/main.canvas.json`). */
  filePath?: string;
  parent?: SnapshotParentRef | null;
  /** Node on another canvas whose double-click opened this tab (if any). */
  linkedNodeId?: string;
  canvas: Pick<CanvasProperties, 'backgroundType' | 'backgroundImage'>;
  zoom: number;
  nodes: NestedNodeSnapshot[];
  edges: EdgeData[];
}

export interface WorkspaceSnapshotV1 {
  version: 1;
  savedAt: string;
  activeTabId: string;
  tabs: CanvasTabSnapshot[];
  /** Closed linked canvases: key = `linkedNodeId` on parent canvas. */
  closedCanvases?: Record<string, CanvasTabSnapshot>;
  /** Per-canvas JSON files keyed by virtual path (mirrors node tree links). */
  files?: Record<string, string>;
}

/** Persisted tab shape only (no selection / history UI). */
export type RestoredTabPayload = {
  id: string;
  filePath?: string;
  parentRef?: SnapshotParentRef | null;
  linkedNodeId?: string;
  cvProps: CanvasProperties;
  zoom: number;
  nodes: CanvasNodeData[];
  edges: EdgeData[];
};

const STORAGE_KEY = 'artichart-workspace-v1';

/** Orphans or missing parents become roots (same as canvas behavior). */
export function flatNodesToNested(flat: CanvasNodeData[]): NestedNodeSnapshot[] {
  const map = new Map<string, NestedNodeSnapshot & { children: NestedNodeSnapshot[] }>();

  for (const n of flat) {
    const { parentId: _p, ...rest } = n;
    map.set(n.id, { ...rest, children: [] });
  }

  const roots: NestedNodeSnapshot[] = [];

  for (const n of flat) {
    const node = map.get(n.id)!;
    if (n.parentId && map.has(n.parentId)) {
      map.get(n.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const stripEmptyChildren = (list: NestedNodeSnapshot[]): NestedNodeSnapshot[] =>
    list.map(({ children, ...rest }) => {
      if (!children?.length) return { ...rest };
      return { ...rest, children: stripEmptyChildren(children) };
    });

  return stripEmptyChildren(roots);
}

export function nestedNodesToFlat(
  nested: NestedNodeSnapshot[],
  parentId?: string,
): CanvasNodeData[] {
  const out: CanvasNodeData[] = [];
  for (const n of nested) {
    const { children, ...rest } = n;
    out.push(
      parentId !== undefined ? { ...rest, parentId } : { ...rest },
    );
    if (children?.length) {
      out.push(...nestedNodesToFlat(children, n.id));
    }
  }
  return out;
}

export function maxNumericSuffix(
  tabs: Array<{ nodes: CanvasNodeData[]; edges: EdgeData[] }>,
  closed?: Record<string, RestoredTabPayload>,
): { nextNode: number; nextEdge: number } {
  let maxNode = 0;
  let maxEdge = 0;
  const nodeRe = /^node-(\d+)$/;
  const edgeRe = /^edge-(\d+)$/;

  for (const tab of tabs) {
    for (const n of tab.nodes) {
      const m = n.id.match(nodeRe);
      if (m) maxNode = Math.max(maxNode, parseInt(m[1], 10));
    }
    for (const e of tab.edges) {
      const m = e.id.match(edgeRe);
      if (m) maxEdge = Math.max(maxEdge, parseInt(m[1], 10));
    }
  }

  if (closed) {
    for (const p of Object.values(closed)) {
      for (const n of p.nodes) {
        const m = n.id.match(nodeRe);
        if (m) maxNode = Math.max(maxNode, parseInt(m[1], 10));
      }
      for (const e of p.edges) {
        const m = e.id.match(edgeRe);
        if (m) maxEdge = Math.max(maxEdge, parseInt(m[1], 10));
      }
    }
  }

  return { nextNode: maxNode + 1, nextEdge: maxEdge + 1 };
}

export function tabPayloadToCanvasSnapshot(p: RestoredTabPayload): CanvasTabSnapshot {
  const snap: CanvasTabSnapshot = {
    id: p.id,
    name: p.cvProps.name,
    canvas: {
      backgroundType: p.cvProps.backgroundType,
      backgroundImage: p.cvProps.backgroundImage,
    },
    zoom: p.zoom,
    nodes: flatNodesToNested(p.nodes),
    edges: p.edges,
  };
  if (p.linkedNodeId !== undefined) snap.linkedNodeId = p.linkedNodeId;
  if (p.filePath !== undefined) snap.filePath = p.filePath;
  if (p.parentRef !== undefined) snap.parent = p.parentRef;
  return snap;
}

export function canvasSnapshotToRestoredPayload(snap: CanvasTabSnapshot): RestoredTabPayload {
  const p: RestoredTabPayload = {
    id: snap.id,
    nodes: nestedNodesToFlat(snap.nodes),
    edges: snap.edges,
    cvProps: {
      name: snap.name,
      backgroundType: snap.canvas.backgroundType,
      backgroundImage: snap.canvas.backgroundImage,
    },
    zoom: snap.zoom,
  };
  if (snap.linkedNodeId !== undefined) p.linkedNodeId = snap.linkedNodeId;
  if (snap.filePath !== undefined) p.filePath = snap.filePath;
  if (snap.parent !== undefined) p.parentRef = snap.parent ?? undefined;
  return p;
}

export function buildWorkspaceSnapshot(
  tabs: Array<{
    id: string;
    filePath?: string;
    parentRef?: SnapshotParentRef | null;
    linkedNodeId?: string;
    cvProps: CanvasProperties;
    zoom: number;
    nodes: CanvasNodeData[];
    edges: EdgeData[];
  }>,
  activeTabId: string,
  closedCanvases: Record<string, RestoredTabPayload>,
  files: Record<string, string>,
): WorkspaceSnapshotV1 {
  const closed: Record<string, CanvasTabSnapshot> = {};
  for (const [key, p] of Object.entries(closedCanvases)) {
    closed[key] = tabPayloadToCanvasSnapshot(p);
  }
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    activeTabId,
    tabs: tabs.map((t) => {
      const snap = tabPayloadToCanvasSnapshot({
        id: t.id,
        filePath: t.filePath,
        parentRef: t.parentRef,
        linkedNodeId: t.linkedNodeId,
        cvProps: t.cvProps,
        zoom: t.zoom,
        nodes: t.nodes,
        edges: t.edges,
      });
      return snap;
    }),
    ...(Object.keys(closed).length > 0 ? { closedCanvases: closed } : {}),
    ...(Object.keys(files).length > 0 ? { files } : {}),
  };
}

export function restoreFilesFromSnapshot(
  snapshot: WorkspaceSnapshotV1,
): Record<string, string> {
  const f = snapshot.files;
  if (!f || typeof f !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

export function parseWorkspaceSnapshot(raw: unknown): WorkspaceSnapshotV1 | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || typeof o.savedAt !== 'string') return null;
  if (typeof o.activeTabId !== 'string' || !Array.isArray(o.tabs)) return null;
  return raw as WorkspaceSnapshotV1;
}

export function snapshotToRestoredTabs(
  snapshot: WorkspaceSnapshotV1,
): { tabs: RestoredTabPayload[]; activeTabId: string } {
  const tabs: RestoredTabPayload[] = snapshot.tabs.map((snap) =>
    canvasSnapshotToRestoredPayload(snap),
  );

  const activeTabId = tabs.some((t) => t.id === snapshot.activeTabId)
    ? snapshot.activeTabId
    : tabs[0]!.id;

  return { tabs, activeTabId };
}

export function restoreClosedFromSnapshot(
  snapshot: WorkspaceSnapshotV1,
): Record<string, RestoredTabPayload> {
  const raw = snapshot.closedCanvases;
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, RestoredTabPayload> = {};
  for (const [key, snap] of Object.entries(raw)) {
    if (snap && typeof snap === 'object' && 'id' in snap) {
      out[key] = canvasSnapshotToRestoredPayload(snap as CanvasTabSnapshot);
    }
  }
  return out;
}

export function loadWorkspaceFromStorage(): WorkspaceSnapshotV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseWorkspaceSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveWorkspaceToStorage(snapshot: WorkspaceSnapshotV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}

export function downloadWorkspaceJson(snapshot: WorkspaceSnapshotV1): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `artichart-workspace-${snapshot.savedAt.slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
