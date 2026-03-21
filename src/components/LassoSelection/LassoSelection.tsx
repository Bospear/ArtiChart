import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';
import type { EdgeData, Selection } from '../../store/types';

export interface LassoSelectionProps {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
  zoom: number;
  panX: number;
  panY: number;
  enabled?: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelectionChange?: (selection: Selection) => void;
}

function pointInPolygon(px: number, py: number, polygon: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const LassoSelection: React.FC<LassoSelectionProps> = ({
  nodes,
  edges,
  zoom,
  panX,
  panY,
  enabled = false,
  canvasWidth,
  canvasHeight,
  onSelectionChange,
}) => {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const isDrawing = useRef(false);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const toCanvas = useCallback(
    (clientX: number, clientY: number) => ({
      x: (clientX - panX) / zoom,
      y: (clientY - panY) / zoom,
    }),
    [zoom, panX, panY],
  );

  useEffect(() => {
    if (!enabled) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('.artichart-drawer') || target.closest('.artichart-controls') || target.closest('.artichart-panel') || target.closest('.artichart-context-menu')) {
        return;
      }
      isDrawing.current = true;
      const pt = toCanvas(e.clientX, e.clientY);
      setPoints([pt]);
    };

    const onMove = (e: MouseEvent) => {
      if (!isDrawing.current) return;
      const pt = toCanvas(e.clientX, e.clientY);
      setPoints((prev) => [...prev, pt]);
    };

    const onUp = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const currentPoints = pointsRef.current;

      if (currentPoints.length < 3) {
        setPoints([]);
        return;
      }

      const selectedNodeIds = nodes
        .filter((n) => {
          if (n.hidden) return false;
          const cx = n.x + n.width / 2;
          const cy = n.y + n.height / 2;
          return pointInPolygon(cx, cy, currentPoints);
        })
        .map((n) => n.id);

      const nodeSet = new Set(selectedNodeIds);
      const selectedEdgeIds = edges
        .filter((e) => !e.hidden && nodeSet.has(e.source) && nodeSet.has(e.target))
        .map((e) => e.id);

      if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
        onSelectionChange?.({
          kind: 'multi',
          nodeIds: selectedNodeIds,
          edgeIds: selectedEdgeIds,
        });
      }

      setPoints([]);
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [enabled, nodes, edges, toCanvas, onSelectionChange]);

  if (!enabled || points.length < 2) return null;

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <svg
      className="artichart-helper-lines"
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      data-minimap-ignore="true"
      style={{ pointerEvents: 'none' }}
    >
      <path d={pathData} className="artichart-lasso-path" />
    </svg>
  );
};
