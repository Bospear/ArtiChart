import React, { useMemo } from 'react';
import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';
import './HelperLines.css';

export interface HelperLinesProps {
  nodes: CanvasNodeData[];
  movingNodeId: string | null;
  snapThreshold?: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface SnapLine {
  type: 'vertical' | 'horizontal';
  position: number;
}

export function getSnapLines(
  nodes: CanvasNodeData[],
  movingNodeId: string | null,
  threshold: number,
): SnapLine[] {
  if (!movingNodeId) return [];
  const movingNode = nodes.find((n) => n.id === movingNodeId);
  if (!movingNode) return [];

  const lines: SnapLine[] = [];
  const mCx = movingNode.x + movingNode.width / 2;
  const mCy = movingNode.y + movingNode.height / 2;

  for (const n of nodes) {
    if (n.id === movingNodeId) continue;

    const nCx = n.x + n.width / 2;
    const nCy = n.y + n.height / 2;

    // Vertical center alignment
    if (Math.abs(mCx - nCx) < threshold) {
      lines.push({ type: 'vertical', position: nCx });
    }
    // Left edge alignment
    if (Math.abs(movingNode.x - n.x) < threshold) {
      lines.push({ type: 'vertical', position: n.x });
    }
    // Right edge alignment
    if (Math.abs(movingNode.x + movingNode.width - (n.x + n.width)) < threshold) {
      lines.push({ type: 'vertical', position: n.x + n.width });
    }
    // Horizontal center alignment
    if (Math.abs(mCy - nCy) < threshold) {
      lines.push({ type: 'horizontal', position: nCy });
    }
    // Top edge alignment
    if (Math.abs(movingNode.y - n.y) < threshold) {
      lines.push({ type: 'horizontal', position: n.y });
    }
    // Bottom edge alignment
    if (Math.abs(movingNode.y + movingNode.height - (n.y + n.height)) < threshold) {
      lines.push({ type: 'horizontal', position: n.y + n.height });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return lines.filter((l) => {
    const key = `${l.type}-${l.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getSnappedPosition(
  nodes: CanvasNodeData[],
  movingNodeId: string,
  x: number,
  y: number,
  threshold: number,
): { x: number; y: number } {
  const movingNode = nodes.find((n) => n.id === movingNodeId);
  if (!movingNode) return { x, y };

  let snappedX = x;
  let snappedY = y;
  const w = movingNode.width;
  const h = movingNode.height;

  for (const n of nodes) {
    if (n.id === movingNodeId) continue;

    // Snap left edges
    if (Math.abs(x - n.x) < threshold) snappedX = n.x;
    // Snap right edges
    if (Math.abs(x + w - (n.x + n.width)) < threshold) snappedX = n.x + n.width - w;
    // Snap center X
    if (Math.abs(x + w / 2 - (n.x + n.width / 2)) < threshold) snappedX = n.x + n.width / 2 - w / 2;
    // Snap top edges
    if (Math.abs(y - n.y) < threshold) snappedY = n.y;
    // Snap bottom edges
    if (Math.abs(y + h - (n.y + n.height)) < threshold) snappedY = n.y + n.height - h;
    // Snap center Y
    if (Math.abs(y + h / 2 - (n.y + n.height / 2)) < threshold) snappedY = n.y + n.height / 2 - h / 2;
  }

  return { x: snappedX, y: snappedY };
}

export const HelperLines: React.FC<HelperLinesProps> = ({
  nodes,
  movingNodeId,
  snapThreshold = 5,
  canvasWidth,
  canvasHeight,
}) => {
  const lines = useMemo(
    () => getSnapLines(nodes, movingNodeId, snapThreshold),
    [nodes, movingNodeId, snapThreshold],
  );

  if (lines.length === 0) return null;

  return (
    <svg
      className="artichart-helper-lines"
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      data-minimap-ignore="true"
    >
      {lines.map((line, i) =>
        line.type === 'vertical' ? (
          <line
            key={i}
            x1={line.position}
            y1={0}
            x2={line.position}
            y2={canvasHeight}
            className="artichart-helper-lines__line"
          />
        ) : (
          <line
            key={i}
            x1={0}
            y1={line.position}
            x2={canvasWidth}
            y2={line.position}
            className="artichart-helper-lines__line"
          />
        ),
      )}
    </svg>
  );
};
