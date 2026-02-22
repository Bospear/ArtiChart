import type { ReactNode } from 'react';

export type BackgroundType = 'blank' | 'dotted' | 'cross' | 'image';

export interface CanvasProps {
  /** Content to render inside the canvas (e.g. draggable nodes) */
  children?: ReactNode;
  /** Width of the scrollable canvas area in pixels */
  canvasWidth?: number;
  /** Height of the scrollable canvas area in pixels */
  canvasHeight?: number;
  /** Minimum zoom level (e.g. 0.1) */
  minZoom?: number;
  /** Maximum zoom level (e.g. 3) */
  maxZoom?: number;
  /** Initial zoom level */
  initialZoom?: number;
  /** Whether to show the minimap */
  showMinimap?: boolean;
  /** Width of the minimap in pixels */
  minimapWidth?: number;
  /** Height of the minimap in pixels */
  minimapHeight?: number;
  /** Optional class name for the container */
  className?: string;
  /** Canvas background type */
  backgroundType?: BackgroundType;
  /** URL for the canvas background image (only used when backgroundType is 'image') */
  backgroundImage?: string;
  /** Called when the user clicks the canvas background (not a node) */
  onBackgroundClick?: () => void;
  /** Called when something is dropped on the canvas. Receives canvas-space x/y and the raw DragEvent. */
  onDrop?: (canvasX: number, canvasY: number, e: React.DragEvent) => void;
  /** Called continuously while dragging over the canvas. Receives canvas-space x/y. */
  onDragMove?: (canvasX: number, canvasY: number) => void;
  /** Called when a drag leaves the canvas area. */
  onDragLeave?: () => void;
  /** Called when the zoom level changes */
  onZoomChange?: (zoom: number) => void;
}
