import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Whiteboard.css';

export type ToolMode = 'select' | 'draw' | 'rectangle' | 'erase' | 'connect';

export interface FreehandPath {
  id: string;
  points: Array<{ x: number; y: number }>;
  stroke?: string;
  strokeWidth?: number;
}

export interface DrawnRectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export interface WhiteboardLayerProps {
  mode: ToolMode;
  paths: FreehandPath[];
  rectangles: DrawnRectangle[];
  zoom: number;
  panX: number;
  panY: number;
  canvasWidth: number;
  canvasHeight: number;
  strokeColor?: string;
  strokeWidth?: number;
  onAddPath?: (path: FreehandPath) => void;
  onAddRectangle?: (rect: DrawnRectangle) => void;
  onErase?: (position: { x: number; y: number }, radius: number) => void;
}

let nextDrawId = 1;

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpx = curr.x;
    const cpy = curr.y;
    const endX = (curr.x + next.x) / 2;
    const endY = (curr.y + next.y) / 2;
    d += ` Q ${cpx},${cpy} ${endX},${endY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

export const WhiteboardLayer: React.FC<WhiteboardLayerProps> = ({
  mode,
  paths,
  rectangles,
  zoom,
  panX,
  panY,
  canvasWidth,
  canvasHeight,
  strokeColor = '#1a1a1a',
  strokeWidth = 2,
  onAddPath,
  onAddRectangle,
  onErase,
}) => {
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectCurrent, setRectCurrent] = useState<{ x: number; y: number } | null>(null);
  const isActive = useRef(false);

  const toCanvas = useCallback(
    (clientX: number, clientY: number) => ({
      x: (clientX - panX) / zoom,
      y: (clientY - panY) / zoom,
    }),
    [zoom, panX, panY],
  );

  useEffect(() => {
    if (mode === 'select' || mode === 'connect') return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isActive.current = true;
      const pt = toCanvas(e.clientX, e.clientY);

      if (mode === 'draw') {
        setCurrentPoints([pt]);
      } else if (mode === 'rectangle') {
        setRectStart(pt);
        setRectCurrent(pt);
      } else if (mode === 'erase') {
        onErase?.(pt, 15 / zoom);
      }
    };

    const onMove = (e: MouseEvent) => {
      if (!isActive.current) return;
      const pt = toCanvas(e.clientX, e.clientY);

      if (mode === 'draw') {
        setCurrentPoints((prev) => [...prev, pt]);
      } else if (mode === 'rectangle') {
        setRectCurrent(pt);
      } else if (mode === 'erase') {
        onErase?.(pt, 15 / zoom);
      }
    };

    const onUp = () => {
      if (!isActive.current) return;
      isActive.current = false;

      if (mode === 'draw' && currentPoints.length > 1) {
        onAddPath?.({
          id: `freehand-${nextDrawId++}`,
          points: currentPoints,
          stroke: strokeColor,
          strokeWidth,
        });
        setCurrentPoints([]);
      } else if (mode === 'rectangle' && rectStart && rectCurrent) {
        const x = Math.min(rectStart.x, rectCurrent.x);
        const y = Math.min(rectStart.y, rectCurrent.y);
        const w = Math.abs(rectCurrent.x - rectStart.x);
        const h = Math.abs(rectCurrent.y - rectStart.y);
        if (w > 2 && h > 2) {
          onAddRectangle?.({
            id: `rect-${nextDrawId++}`,
            x,
            y,
            width: w,
            height: h,
            stroke: strokeColor,
            strokeWidth,
          });
        }
        setRectStart(null);
        setRectCurrent(null);
      }
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [mode, zoom, panX, panY, toCanvas, currentPoints, rectStart, rectCurrent, strokeColor, strokeWidth, onAddPath, onAddRectangle, onErase]);

  const currentPathD = currentPoints.length > 1 ? smoothPath(currentPoints) : null;

  const currentRect =
    rectStart && rectCurrent
      ? {
          x: Math.min(rectStart.x, rectCurrent.x),
          y: Math.min(rectStart.y, rectCurrent.y),
          width: Math.abs(rectCurrent.x - rectStart.x),
          height: Math.abs(rectCurrent.y - rectStart.y),
        }
      : null;

  return (
    <svg
      className="artichart-whiteboard-layer"
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      data-minimap-ignore="true"
      style={{
        pointerEvents: mode !== 'select' && mode !== 'connect' ? 'none' : 'none',
      }}
    >
      {paths.map((p) => (
        <path
          key={p.id}
          d={smoothPath(p.points)}
          className="artichart-whiteboard__freehand"
          stroke={p.stroke || strokeColor}
          strokeWidth={p.strokeWidth || strokeWidth}
        />
      ))}
      {rectangles.map((r) => (
        <rect
          key={r.id}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          className="artichart-whiteboard__rectangle"
          stroke={r.stroke || strokeColor}
          strokeWidth={r.strokeWidth || strokeWidth}
          fill={r.fill || 'transparent'}
        />
      ))}
      {currentPathD && (
        <path
          d={currentPathD}
          className="artichart-whiteboard__freehand artichart-whiteboard__freehand--active"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )}
      {currentRect && (
        <rect
          x={currentRect.x}
          y={currentRect.y}
          width={currentRect.width}
          height={currentRect.height}
          className="artichart-whiteboard__rectangle artichart-whiteboard__rectangle--active"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      )}
    </svg>
  );
};

// ---- Tool mode hook ----

export function useToolMode(
  initialMode: ToolMode = 'select',
): [ToolMode, (mode: ToolMode) => void] {
  const [mode, setMode] = useState(initialMode);
  return [mode, setMode];
}
