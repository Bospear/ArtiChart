import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasNodeProps } from './CanvasNode.types';
import type { NodeShape } from './CanvasNode.types';
import './CanvasNode.css';

type ResizeEdge = 'n' | 'e' | 's' | 'w';

export function getConnectorPositions(
  count: number,
  width: number,
  height: number,
  shape: NodeShape,
): Array<{ x: number; y: number }> {
  if (count <= 0) return [];

  const cx = width / 2;
  const cy = height / 2;
  const positions: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    if (shape === 'circle' || shape === 'ellipse') {
      positions.push({
        x: cx + cx * cosA,
        y: cy + cy * sinA,
      });
    } else {
      const candidates: number[] = [];
      if (cosA > 1e-9) candidates.push(cx / cosA);
      if (cosA < -1e-9) candidates.push(-cx / cosA);
      if (sinA > 1e-9) candidates.push(cy / sinA);
      if (sinA < -1e-9) candidates.push(-cy / sinA);

      const t = Math.min(...candidates.filter((v) => v > 0));
      positions.push({
        x: cx + t * cosA,
        y: cy + t * sinA,
      });
    }
  }

  return positions;
}

function getShapeClipPath(shape: NodeShape): string | undefined {
  switch (shape) {
    case 'triangle':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    case 'cylinder':
      return undefined;
    default:
      return undefined;
  }
}

const RESIZE_CURSORS: Record<ResizeEdge, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
};

const MIN_NODE_SIZE = 20;
const RESIZE_EDGE_BASE = 14;

const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  selected = false,
  preview = false,
  connectable = false,
  zoom = 1,
  children,
  onSelect,
  onDoubleClick,
  onMove,
  onConnectStart,
  onConnectEnd,
  onResize,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const isResizing = useRef(false);
  const resizeEdgeRef = useRef<ResizeEdge>('e');
  const resizeStart = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (preview || !onDoubleClick) return;
      const t = e.target as HTMLElement;
      if (t.closest('.artichart-node__connector-handle')) return;
      if (t.closest('.artichart-node__resize-edge')) return;
      e.stopPropagation();
      onDoubleClick(node.id);
    },
    [preview, onDoubleClick, node.id],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (preview || e.button !== 0) return;

      if (node.dragHandle) {
        const target = e.target as HTMLElement;
        if (!target.closest(node.dragHandle)) return;
      }

      e.stopPropagation();
      onSelect?.(node.id);

      if (onMove) {
        isDragging.current = true;
        dragStart.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };
      }
    },
    [preview, node.id, node.x, node.y, node.dragHandle, onSelect, onMove],
  );

  const handleConnectorMouseDown = useCallback(
    (e: React.MouseEvent, connectorIndex: number) => {
      if (preview || !connectable || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(node.id);
      onConnectStart?.(node.id, connectorIndex);
    },
    [preview, connectable, onSelect, node.id, onConnectStart],
  );

  const handleConnectorMouseUp = useCallback(
    (e: React.MouseEvent, connectorIndex: number) => {
      if (preview || !connectable) return;
      e.preventDefault();
      e.stopPropagation();
      onConnectEnd?.(node.id, connectorIndex);
    },
    [preview, connectable, node.id, onConnectEnd],
  );

  const handleNodeMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (preview || !connectable) return;
      const count = node.connectorCount ?? 1;
      const positions = getConnectorPositions(count, node.width, node.height, node.shape);
      if (positions.length === 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const localX = (e.clientX - rect.left) * (node.width / rect.width);
      const localY = (e.clientY - rect.top) * (node.height / rect.height);

      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < positions.length; i++) {
        const dx = positions[i].x - localX;
        const dy = positions[i].y - localY;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      onConnectEnd?.(node.id, nearestIdx);
    },
    [preview, connectable, node.id, node.connectorCount, node.width, node.height, node.shape, onConnectEnd],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, edge: ResizeEdge) => {
      if (preview || !onResize) return;
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(node.id);
      isResizing.current = true;
      resizeEdgeRef.current = edge;
      resizeStart.current = {
        mx: e.clientX,
        my: e.clientY,
        x: node.x,
        y: node.y,
        w: node.width,
        h: node.height,
      };
      document.body.style.cursor = RESIZE_CURSORS[edge];
    },
    [preview, node.id, node.x, node.y, node.width, node.height, onSelect, onResize],
  );

  useEffect(() => {
    if (preview || !onResize) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const { mx, my, x, y, w, h } = resizeStart.current;
      const dx = (e.clientX - mx) / zoom;
      const dy = (e.clientY - my) / zoom;
      const edge = resizeEdgeRef.current;
      const isCircle = node.shape === 'circle';

      let newX = x, newY = y, newW = w, newH = h;

      if (isCircle) {
        let sizeDelta: number;
        switch (edge) {
          case 'e': sizeDelta = dx; break;
          case 'w': sizeDelta = -dx; break;
          case 's': sizeDelta = dy; break;
          case 'n': sizeDelta = -dy; break;
        }
        const newSize = Math.max(MIN_NODE_SIZE, w + sizeDelta);
        newW = newSize;
        newH = newSize;

        switch (edge) {
          case 'e':
            newY = y - (newSize - h) / 2;
            break;
          case 'w':
            newX = x + w - newSize;
            newY = y - (newSize - h) / 2;
            break;
          case 's':
            newX = x - (newSize - w) / 2;
            break;
          case 'n':
            newX = x - (newSize - w) / 2;
            newY = y + h - newSize;
            break;
        }
      } else {
        switch (edge) {
          case 'e':
            newW = Math.max(MIN_NODE_SIZE, w + dx);
            break;
          case 'w':
            newW = Math.max(MIN_NODE_SIZE, w - dx);
            newX = x + w - newW;
            break;
          case 's':
            newH = Math.max(MIN_NODE_SIZE, h + dy);
            break;
          case 'n':
            newH = Math.max(MIN_NODE_SIZE, h - dy);
            newY = y + h - newH;
            break;
        }
      }

      onResize(node.id, newX, newY, newW, newH);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [preview, node.id, node.shape, zoom, onResize]);

  useEffect(() => {
    if (preview || !onMove) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = (e.clientX - dragStart.current.mx) / zoom;
      const dy = (e.clientY - dragStart.current.my) / zoom;
      onMove(node.id, dragStart.current.nx + dx, dragStart.current.ny + dy);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [preview, node.id, zoom, onMove]);

  if (node.hidden) return null;

  const clipPath = getShapeClipPath(node.shape);

  const classes = [
    'artichart-node',
    `artichart-node--${node.shape}`,
    selected && 'artichart-node--selected',
    preview && 'artichart-node--preview',
    node.className,
  ]
    .filter(Boolean)
    .join(' ');

  const style: React.CSSProperties = {
    position: 'absolute',
    left: node.x,
    top: node.y,
    width: node.width,
    height: node.height,
    zIndex: node.zIndex,
    backgroundColor: node.backgroundColor || undefined,
    backgroundImage: node.backgroundImage ? `url(${node.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    pointerEvents: preview ? 'none' : undefined,
    cursor: preview ? undefined : 'grab',
    transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
    clipPath: clipPath || undefined,
    ...node.style,
  };

  const isCylinder = node.shape === 'cylinder';

  return (
    <div
      className={classes}
      style={style}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleNodeMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isCylinder && (
        <div className="artichart-node__cylinder-cap" />
      )}

      {children}

      {node.label && !preview && (
        <div className="artichart-node__label">{node.label}</div>
      )}

      {node.tooltip && isHovered && !preview && (node.tooltipTitle || node.tooltipDescription) && (
        <div className="artichart-node__tooltip">
          {node.tooltipTitle && (
            <div className="artichart-node__tooltip-title">{node.tooltipTitle}</div>
          )}
          {node.tooltipDescription && (
            <div className="artichart-node__tooltip-desc">{node.tooltipDescription}</div>
          )}
        </div>
      )}

      {!preview && connectable && (() => {
        const count = node.connectorCount ?? 1;
        const positions = getConnectorPositions(count, node.width, node.height, node.shape);
        return positions.map((pos, i) => (
          <div
            key={i}
            className="artichart-node__connector-handle"
            style={{ left: pos.x - 7, top: pos.y - 7 }}
            onMouseDown={(e) => handleConnectorMouseDown(e, i)}
            onMouseUp={(e) => handleConnectorMouseUp(e, i)}
            title="Drag to connect"
            role="button"
            aria-label={`Connector ${i} of ${node.id}`}
          />
        ));
      })()}

      {!preview && onResize && (() => {
        const edgeSize = RESIZE_EDGE_BASE / zoom;
        const half = edgeSize / 2;
        return (
          <>
            <div className="artichart-node__resize-edge artichart-node__resize-edge--n"
                 style={{ top: -half, left: 0, right: 0, height: edgeSize }}
                 onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
            <div className="artichart-node__resize-edge artichart-node__resize-edge--e"
                 style={{ top: 0, right: -half, bottom: 0, width: edgeSize }}
                 onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
            <div className="artichart-node__resize-edge artichart-node__resize-edge--s"
                 style={{ bottom: -half, left: 0, right: 0, height: edgeSize }}
                 onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
            <div className="artichart-node__resize-edge artichart-node__resize-edge--w"
                 style={{ top: 0, left: -half, bottom: 0, width: edgeSize }}
                 onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
          </>
        );
      })()}
    </div>
  );
};

export default CanvasNode;
