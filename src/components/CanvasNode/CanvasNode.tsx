import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasNodeProps } from './CanvasNode.types';
import './CanvasNode.css';

const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  selected = false,
  preview = false,
  zoom = 1,
  onSelect,
  onMove,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (preview || e.button !== 0) return;
      e.stopPropagation();
      onSelect?.(node.id);

      if (onMove) {
        isDragging.current = true;
        dragStart.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };
      }
    },
    [preview, node.id, node.x, node.y, onSelect, onMove]
  );

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

  const classes = [
    'artichart-node',
    `artichart-node--${node.shape}`,
    selected && 'artichart-node--selected',
    preview && 'artichart-node--preview',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{
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
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
    </div>
  );
};

export default CanvasNode;
