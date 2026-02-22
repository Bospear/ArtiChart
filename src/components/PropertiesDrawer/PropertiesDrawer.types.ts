import type { ReactNode } from 'react';
import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';
import type { BackgroundType } from '../Canvas/Canvas.types';

export type Selection =
  | null
  | { kind: 'canvas' }
  | { kind: 'node'; id: string };

export interface CanvasProperties {
  backgroundType: BackgroundType;
  backgroundImage: string;
}

export interface PropertiesDrawerProps {
  selection: Selection;
  canvasProps: CanvasProperties;
  onCanvasChange: (patch: Partial<CanvasProperties>) => void;
  selectedNode: CanvasNodeData | null;
  onNodeChange: (id: string, patch: Partial<CanvasNodeData>) => void;
  children?: ReactNode;
  className?: string;
}
