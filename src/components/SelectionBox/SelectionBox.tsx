import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';
import type { EdgeData, Selection } from '../../store/types';
import './SelectionBox.css';

export interface SelectionBoxProps {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
  zoom: number;
  panX: number;
  panY: number;
  enabled?: boolean;
  onSelectionChange?: (selection: Selection) => void;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  nodes,
  edges,
  zoom,
  panX,
  panY,
  enabled = true,
  onSelectionChange,
}) => {
  const [box, setBox] = useState<Rect | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const isSelecting = useRef(false);

  const _handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || e.button !== 0) return;
      isSelecting.current = true;
      const canvasX = (e.clientX - panX) / zoom;
      const canvasY = (e.clientY - panY) / zoom;
      startRef.current = { x: canvasX, y: canvasY };
      setBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
    },
    [enabled, zoom, panX, panY],
  );

  useEffect(() => {
    if (!enabled) return;
    // Activated by shift+click on canvas background (handled by parent)
  }, [enabled, _handleMouseDown]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      if (!isSelecting.current) return;
      const canvasX = (e.clientX - panX) / zoom;
      const canvasY = (e.clientY - panY) / zoom;
      const sx = startRef.current.x;
      const sy = startRef.current.y;
      setBox({
        x: Math.min(sx, canvasX),
        y: Math.min(sy, canvasY),
        width: Math.abs(canvasX - sx),
        height: Math.abs(canvasY - sy),
      });
    };

    const onUp = () => {
      if (!isSelecting.current || !box) {
        isSelecting.current = false;
        setBox(null);
        return;
      }
      isSelecting.current = false;

      const selectedNodeIds = nodes
        .filter((n) => !n.hidden && rectsOverlap(box, { x: n.x, y: n.y, width: n.width, height: n.height }))
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

      setBox(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [enabled, zoom, panX, panY, box, nodes, edges, onSelectionChange]);

  return (
    <>
      {box && box.width > 2 && box.height > 2 && (
        <div
          className="artichart-selection-box"
          style={{
            position: 'absolute',
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
          }}
          data-minimap-ignore="true"
        />
      )}
    </>
  );
};
