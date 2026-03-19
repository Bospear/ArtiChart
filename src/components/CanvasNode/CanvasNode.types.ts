export type NodeShape = 'circle' | 'ellipse' | 'square' | 'rhombus' | 'parallelogram';

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
}

export interface CanvasNodeProps {
  node: CanvasNodeData;
  selected?: boolean;
  preview?: boolean;
  connectable?: boolean;
  /** Current canvas zoom level — needed to convert screen drag deltas to canvas coordinates */
  zoom?: number;
  onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onConnectStart?: (id: string, connectorIndex: number) => void;
  onConnectEnd?: (id: string, connectorIndex: number) => void;
  onResize?: (id: string, x: number, y: number, width: number, height: number) => void;
}
