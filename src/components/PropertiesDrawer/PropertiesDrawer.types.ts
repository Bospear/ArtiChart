import type { ReactNode } from 'react';
import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';
import type { BackgroundType } from '../Canvas/Canvas.types';

export type Selection =
  | null
  | { kind: 'canvas' }
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | { kind: 'multi'; nodeIds: string[]; edgeIds: string[] };

export interface CanvasProperties {
  backgroundType: BackgroundType;
  backgroundImage: string;
}

export interface PropertiesDrawerProps {
  selection: Selection;
  canvasProps: CanvasProperties;
  onCanvasChange: (patch: Partial<CanvasProperties>) => void;
  selectedNode: CanvasNodeData | null;
  nodes?: CanvasNodeData[];
  onNodeChange: (id: string, patch: Partial<CanvasNodeData>) => void;
  connectionLabel?: string;
  onConnectionLabelChange?: (label: string) => void;
  children?: ReactNode;
  className?: string;
}
