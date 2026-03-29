import type { CanvasNodeData } from '../src';
import type { CanvasProperties } from '../src';
import type { EdgeData } from '../src';
import {
  flatNodesToNested,
  type NestedNodeSnapshot,
  type RestoredTabPayload,
  type SnapshotParentRef,
} from './workspaceSnapshot';

export const MAIN_CANVAS_FILE = '/project/main.canvas.json';

export const DATA_KEY_CHILD_CANVAS = 'artichartChildCanvas';
export const DATA_KEY_LINK_RECT = 'artichartLinkRect';

export type CanvasLinkRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasFileParentRef = SnapshotParentRef;

export interface CanvasFileDocumentV1 {
  version: 1;
  kind: 'artichart-canvas';
  path: string;
  tabId: string;
  linkedNodeId?: string;
  parent: CanvasFileParentRef | null;
  graph: {
    name: string;
    canvas: Pick<CanvasProperties, 'backgroundType' | 'backgroundImage'>;
    zoom: number;
    nodes: NestedNodeSnapshot[];
    edges: EdgeData[];
  };
}

export function sanitizePathSegment(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '_');
}

export function defaultChildCanvasPath(linkedNodeId: string): string {
  return `/project/canvases/${sanitizePathSegment(linkedNodeId)}.canvas.json`;
}

export function parseCanvasFileDoc(raw: string): CanvasFileDocumentV1 | null {
  try {
    const j = JSON.parse(raw) as CanvasFileDocumentV1;
    if (j?.version !== 1 || j?.kind !== 'artichart-canvas') return null;
    if (typeof j.path !== 'string' || typeof j.tabId !== 'string') return null;
    if (!j.graph || !j.graph.nodes) return null;
    return j;
  } catch {
    return null;
  }
}

/** Keep parent-facing link geometry in sync with node bounds. */
export function refreshLinkAnchors(nodes: CanvasNodeData[]): CanvasNodeData[] {
  return nodes.map((n) => {
    const data = n.data as Record<string, unknown> | undefined;
    const childPath = data?.[DATA_KEY_CHILD_CANVAS];
    if (typeof childPath !== 'string') return n;
    return {
      ...n,
      data: {
        ...(data ?? {}),
        [DATA_KEY_LINK_RECT]: {
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
        } satisfies CanvasLinkRect,
      },
    };
  });
}

export function collectChildPathsFromNested(
  nodes: NestedNodeSnapshot[],
): string[] {
  const out: string[] = [];
  const visit = (list: NestedNodeSnapshot[]) => {
    for (const n of list) {
      const data = n.data as Record<string, unknown> | undefined;
      const p = data?.[DATA_KEY_CHILD_CANVAS];
      if (typeof p === 'string') out.push(p);
      if (n.children?.length) visit(n.children);
    }
  };
  visit(nodes);
  return out;
}

export function tabToCanvasFileDoc(
  tabId: string,
  filePath: string,
  linkedNodeId: string | undefined,
  cvProps: CanvasProperties,
  zoom: number,
  nodes: CanvasNodeData[],
  edges: EdgeData[],
  parent: CanvasFileParentRef | null,
): CanvasFileDocumentV1 {
  return {
    version: 1,
    kind: 'artichart-canvas',
    path: filePath,
    tabId,
    ...(linkedNodeId !== undefined ? { linkedNodeId } : {}),
    parent,
    graph: {
      name: cvProps.name,
      canvas: {
        backgroundType: cvProps.backgroundType,
        backgroundImage: cvProps.backgroundImage,
      },
      zoom,
      nodes: flatNodesToNested(refreshLinkAnchors(nodes)),
      edges,
    },
  };
}

export function buildFilesRecord(
  tabs: Array<{
    id: string;
    filePath: string;
    linkedNodeId?: string;
    parentRef?: CanvasFileParentRef | null;
    cvProps: CanvasProperties;
    zoom: number;
    nodes: CanvasNodeData[];
    edges: EdgeData[];
  }>,
  closedCanvases: Record<string, RestoredTabPayload>,
): Record<string, string> {
  const files: Record<string, string> = {};
  for (const tab of tabs) {
    const parent = tab.parentRef ?? null;
    const doc = tabToCanvasFileDoc(
      tab.id,
      tab.filePath,
      tab.linkedNodeId,
      tab.cvProps,
      tab.zoom,
      tab.nodes,
      tab.edges,
      parent,
    );
    files[tab.filePath] = JSON.stringify(doc);
  }
  for (const p of Object.values(closedCanvases)) {
    const path =
      p.filePath ??
      (p.linkedNodeId
        ? defaultChildCanvasPath(p.linkedNodeId)
        : `/project/closed-${p.id}.canvas.json`);
    const doc = tabToCanvasFileDoc(
      p.id,
      path,
      p.linkedNodeId,
      p.cvProps,
      p.zoom,
      p.nodes,
      p.edges,
      p.parentRef ?? null,
    );
    files[path] = JSON.stringify(doc);
  }
  return files;
}

export function collectChildPathsFromNodes(nodes: CanvasNodeData[]): string[] {
  const out: string[] = [];
  const visit = (list: CanvasNodeData[]) => {
    for (const n of list) {
      const data = n.data as Record<string, unknown> | undefined;
      const p = data?.[DATA_KEY_CHILD_CANVAS];
      if (typeof p === 'string') out.push(p);
    }
  };
  visit(nodes);
  return out;
}
