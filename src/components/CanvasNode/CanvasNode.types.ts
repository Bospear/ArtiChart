import type { CSSProperties, ReactNode } from 'react';

export type NodeShape =
  | 'circle'
  | 'ellipse'
  | 'square'
  | 'rhombus'
  | 'parallelogram'
  | 'triangle'
  | 'hexagon'
  | 'diamond'
  | 'cylinder'
  | 'star'
  | 'rectangle';

export interface CanvasNodeData {
  id: string;
  shape: NodeShape;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  connectorCount?: number;
  label?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  tooltip?: boolean;
  tooltipTitle?: string;
  tooltipDescription?: string;
  rotation?: number;
  dragHandle?: string;
  maxConnections?: number;
  parentId?: string;
  collapsed?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  style?: CSSProperties;
  className?: string;
  data?: Record<string, unknown>;
}

export interface CanvasNodeProps {
  node: CanvasNodeData;
  selected?: boolean;
  preview?: boolean;
  connectable?: boolean;
  zoom?: number;
  children?: ReactNode;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onConnectStart?: (id: string, connectorIndex: number) => void;
  onConnectEnd?: (id: string, connectorIndex: number) => void;
  onResize?: (id: string, x: number, y: number, width: number, height: number) => void;
}

export type NodeTypes = Record<string, React.ComponentType<CanvasNodeProps>>;
