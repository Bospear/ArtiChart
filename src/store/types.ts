import type { CSSProperties, ReactNode } from 'react';
import type { CanvasNodeData } from '../components/CanvasNode/CanvasNode.types';

// ---- Edge Types ----

export type EdgeType = 'bezier' | 'straight' | 'smoothstep' | 'step';

export type MarkerType = 'arrow' | 'arrowclosed';

export interface EdgeMarkerConfig {
  type: MarkerType;
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  sourceConnector?: number;
  targetConnector?: number;
  type?: EdgeType;
  label?: string;
  animated?: boolean;
  style?: CSSProperties;
  className?: string;
  markerStart?: EdgeMarkerConfig | MarkerType;
  markerEnd?: EdgeMarkerConfig | MarkerType;
  data?: Record<string, unknown>;
  hidden?: boolean;
  deletable?: boolean;
  reconnectable?: boolean;
}

// ---- Connection Types ----

export interface Connection {
  source: string;
  target: string;
  sourceConnector: number;
  targetConnector: number;
}

export interface ConnectionDraft {
  source: string;
  sourceConnector: number;
  x: number;
  y: number;
}

// ---- Viewport ----

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// ---- Selection ----

export type Selection =
  | null
  | { kind: 'canvas' }
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | { kind: 'multi'; nodeIds: string[]; edgeIds: string[] };

// ---- History ----

export interface HistoryEntry {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
}

// ---- State ----

export interface ArtiChartState {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
  viewport: Viewport;
  selection: Selection;
  connectionDraft: ConnectionDraft | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

// ---- Actions ----

export type ArtiChartAction =
  | { type: 'SET_NODES'; nodes: CanvasNodeData[] }
  | { type: 'ADD_NODE'; node: CanvasNodeData }
  | { type: 'UPDATE_NODE'; id: string; patch: Partial<CanvasNodeData> }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'SET_EDGES'; edges: EdgeData[] }
  | { type: 'ADD_EDGE'; edge: EdgeData }
  | { type: 'UPDATE_EDGE'; id: string; patch: Partial<EdgeData> }
  | { type: 'REMOVE_EDGE'; id: string }
  | { type: 'SET_VIEWPORT'; viewport: Partial<Viewport> }
  | { type: 'SET_SELECTION'; selection: Selection }
  | { type: 'SET_CONNECTION_DRAFT'; draft: ConnectionDraft | null }
  | { type: 'UPDATE_DRAFT_POSITION'; x: number; y: number }
  | { type: 'PUSH_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'BATCH'; actions: ArtiChartAction[] }
  | { type: 'FROM_JSON'; state: Pick<ArtiChartState, 'nodes' | 'edges' | 'viewport'> }
  | { type: 'DELETE_SELECTED' };

// ---- Callbacks ----

export type OnConnect = (connection: Connection) => void;
export type OnConnectStart = (sourceId: string, sourceConnector: number) => void;
export type OnConnectEnd = (event: MouseEvent | TouchEvent) => void;
export type IsValidConnection = (connection: Connection) => boolean;

// ---- Provider Props ----

export interface ArtiChartProviderProps {
  children: ReactNode;
  initialNodes?: CanvasNodeData[];
  initialEdges?: EdgeData[];
  initialViewport?: Partial<Viewport>;
  onConnect?: OnConnect;
  onConnectStart?: OnConnectStart;
  onConnectEnd?: OnConnectEnd;
  isValidConnection?: IsValidConnection;
  onNodesChange?: (nodes: CanvasNodeData[]) => void;
  onEdgesChange?: (edges: EdgeData[]) => void;
  onSelectionChange?: (selection: Selection) => void;
}

// ---- Instance ----

export interface ArtiChartInstance {
  getNodes: () => CanvasNodeData[];
  getEdges: () => EdgeData[];
  getViewport: () => Viewport;
  getSelection: () => Selection;
  setNodes: (nodes: CanvasNodeData[] | ((prev: CanvasNodeData[]) => CanvasNodeData[])) => void;
  setEdges: (edges: EdgeData[] | ((prev: EdgeData[]) => EdgeData[])) => void;
  addNode: (node: CanvasNodeData) => void;
  updateNode: (id: string, patch: Partial<CanvasNodeData>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: EdgeData) => void;
  updateEdge: (id: string, patch: Partial<EdgeData>) => void;
  removeEdge: (id: string) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setSelection: (selection: Selection) => void;
  fitView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toJSON: () => { nodes: CanvasNodeData[]; edges: EdgeData[]; viewport: Viewport };
  fromJSON: (data: { nodes: CanvasNodeData[]; edges: EdgeData[]; viewport?: Viewport }) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  deleteSelectedElements: () => void;
  getIncomers: (nodeId: string) => CanvasNodeData[];
  getOutgoers: (nodeId: string) => CanvasNodeData[];
  getConnectedEdges: (nodeId: string) => EdgeData[];
}
