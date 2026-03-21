import React, { useCallback, useEffect, useRef } from 'react';
import './NodeResizer.css';

type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface NodeResizerProps {
  nodeId: string;
  nodeX: number;
  nodeY: number;
  nodeWidth: number;
  nodeHeight: number;
  zoom?: number;
  minWidth?: number;
  minHeight?: number;
  keepAspectRatio?: boolean;
  visible?: boolean;
  lineClassName?: string;
  handleClassName?: string;
  onResize: (id: string, x: number, y: number, width: number, height: number) => void;
}

const HANDLE_SIZE = 8;

const CURSOR_MAP: Record<ResizeHandle, string> = {
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
};

const MIN_SIZE = 10;

export const NodeResizer: React.FC<NodeResizerProps> = ({
  nodeId,
  nodeX,
  nodeY,
  nodeWidth,
  nodeHeight,
  zoom = 1,
  minWidth = MIN_SIZE,
  minHeight = MIN_SIZE,
  keepAspectRatio = false,
  visible = true,
  lineClassName,
  handleClassName,
  onResize,
}) => {
  const isResizing = useRef(false);
  const handleRef = useRef<ResizeHandle>('se');
  const startRef = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      handleRef.current = handle;
      startRef.current = {
        mx: e.clientX,
        my: e.clientY,
        x: nodeX,
        y: nodeY,
        w: nodeWidth,
        h: nodeHeight,
      };
      document.body.style.cursor = CURSOR_MAP[handle];
    },
    [nodeX, nodeY, nodeWidth, nodeHeight],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const { mx, my, x, y, w, h } = startRef.current;
      const dx = (e.clientX - mx) / zoom;
      const dy = (e.clientY - my) / zoom;
      const handle = handleRef.current;

      let newX = x, newY = y, newW = w, newH = h;

      if (handle.includes('e')) newW = Math.max(minWidth, w + dx);
      if (handle.includes('w')) {
        newW = Math.max(minWidth, w - dx);
        newX = x + w - newW;
      }
      if (handle.includes('s')) newH = Math.max(minHeight, h + dy);
      if (handle.includes('n')) {
        newH = Math.max(minHeight, h - dy);
        newY = y + h - newH;
      }

      if (keepAspectRatio) {
        const aspect = w / h;
        if (newW / newH > aspect) {
          newW = newH * aspect;
        } else {
          newH = newW / aspect;
        }
      }

      onResize(nodeId, newX, newY, newW, newH);
    };

    const onUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [nodeId, zoom, minWidth, minHeight, keepAspectRatio, onResize]);

  if (!visible) return null;

  const half = HANDLE_SIZE / 2;
  const handles: Array<{ handle: ResizeHandle; left: number; top: number }> = [
    { handle: 'nw', left: nodeX - half, top: nodeY - half },
    { handle: 'n', left: nodeX + nodeWidth / 2 - half, top: nodeY - half },
    { handle: 'ne', left: nodeX + nodeWidth - half, top: nodeY - half },
    { handle: 'e', left: nodeX + nodeWidth - half, top: nodeY + nodeHeight / 2 - half },
    { handle: 'se', left: nodeX + nodeWidth - half, top: nodeY + nodeHeight - half },
    { handle: 's', left: nodeX + nodeWidth / 2 - half, top: nodeY + nodeHeight - half },
    { handle: 'sw', left: nodeX - half, top: nodeY + nodeHeight - half },
    { handle: 'w', left: nodeX - half, top: nodeY + nodeHeight / 2 - half },
  ];

  return (
    <>
      <div
        className={`artichart-node-resizer__line ${lineClassName ?? ''}`.trim()}
        style={{
          position: 'absolute',
          left: nodeX,
          top: nodeY,
          width: nodeWidth,
          height: nodeHeight,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        data-minimap-ignore="true"
      />
      {handles.map(({ handle, left, top }) => (
        <div
          key={handle}
          className={`artichart-node-resizer__handle ${handleClassName ?? ''}`.trim()}
          style={{
            position: 'absolute',
            left,
            top,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            cursor: CURSOR_MAP[handle],
            zIndex: 10000,
          }}
          onMouseDown={(e) => handleMouseDown(e, handle)}
          data-minimap-ignore="true"
        />
      ))}
    </>
  );
};
