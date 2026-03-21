import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Edge.css';

export interface ControlPoint {
  x: number;
  y: number;
}

export interface EditableEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  controlPoints?: ControlPoint[];
  selected?: boolean;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onControlPointsChange?: (id: string, points: ControlPoint[]) => void;
  onClick?: (id: string) => void;
  zoom?: number;
}

function buildPathFromControlPoints(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  points: ControlPoint[],
): string {
  if (points.length === 0) {
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    return `M ${sx},${sy} Q ${mx},${my} ${tx},${ty}`;
  }

  let path = `M ${sx},${sy}`;

  if (points.length === 1) {
    path += ` Q ${points[0].x},${points[0].y} ${tx},${ty}`;
  } else {
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        const next = points[1] ?? { x: tx, y: ty };
        const midX = (points[0].x + next.x) / 2;
        const midY = (points[0].y + next.y) / 2;
        path += ` Q ${points[0].x},${points[0].y} ${midX},${midY}`;
      } else if (i === points.length - 1) {
        path += ` Q ${points[i].x},${points[i].y} ${tx},${ty}`;
      } else {
        const next = points[i + 1];
        const midX = (points[i].x + next.x) / 2;
        const midY = (points[i].y + next.y) / 2;
        path += ` Q ${points[i].x},${points[i].y} ${midX},${midY}`;
      }
    }
  }

  return path;
}

const CONTROL_POINT_RADIUS = 5;

export const EditableEdge: React.FC<EditableEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  controlPoints = [],
  selected = false,
  animated = false,
  className,
  style,
  onControlPointsChange,
  onClick,
  zoom = 1,
}) => {
  const [points, setPoints] = useState(controlPoints);
  const dragging = useRef<number | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  useEffect(() => {
    setPoints(controlPoints);
  }, [controlPoints]);

  const path = buildPathFromControlPoints(sourceX, sourceY, targetX, targetY, points);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(id);
    },
    [id, onClick],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onControlPointsChange) return;
      e.stopPropagation();
      const svg = (e.target as SVGElement).closest('svg');
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      const newPoint: ControlPoint = { x: svgP.x, y: svgP.y };
      const newPoints = [...points, newPoint];
      setPoints(newPoints);
      onControlPointsChange(id, newPoints);
    },
    [id, points, onControlPointsChange],
  );

  const handlePointMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      dragging.current = index;
      dragStart.current = {
        mx: e.clientX,
        my: e.clientY,
        px: points[index].x,
        py: points[index].y,
      };
    },
    [points],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current === null) return;
      const idx = dragging.current;
      const dx = (e.clientX - dragStart.current.mx) / zoom;
      const dy = (e.clientY - dragStart.current.my) / zoom;
      const newPoints = points.map((p, i) =>
        i === idx ? { x: dragStart.current.px + dx, y: dragStart.current.py + dy } : p,
      );
      setPoints(newPoints);
    };
    const onUp = () => {
      if (dragging.current !== null && onControlPointsChange) {
        onControlPointsChange(id, points);
      }
      dragging.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [id, points, zoom, onControlPointsChange]);

  const pathClass = [
    'artichart-edge__path',
    selected && 'artichart-edge__path--selected',
    animated && 'artichart-edge__path--animated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g>
      <path
        d={path}
        className="artichart-edge__hit-area"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      <path d={path} className={pathClass} style={style} />
      {selected &&
        points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={CONTROL_POINT_RADIUS}
            className="artichart-edge__control-point"
            onMouseDown={(e) => handlePointMouseDown(e, i)}
          />
        ))}
    </g>
  );
};
