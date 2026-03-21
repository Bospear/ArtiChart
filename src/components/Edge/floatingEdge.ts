import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';

interface Point {
  x: number;
  y: number;
}

export function getClosestPointOnNodeBorder(
  node: CanvasNodeData,
  targetX: number,
  targetY: number,
): Point {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;

  if (dx === 0 && dy === 0) {
    return { x: cx, y: node.y };
  }

  const shape = node.shape;

  if (shape === 'circle' || shape === 'ellipse') {
    const rx = node.width / 2;
    const ry = node.height / 2;
    const angle = Math.atan2(dy, dx);
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  }

  const hw = node.width / 2;
  const hh = node.height / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const scaleX = hw / (absDx || 1);
  const scaleY = hh / (absDy || 1);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

export function getFloatingEdgeAnchors(
  sourceNode: CanvasNodeData,
  targetNode: CanvasNodeData,
): { source: Point; target: Point } {
  const sourceCx = sourceNode.x + sourceNode.width / 2;
  const sourceCy = sourceNode.y + sourceNode.height / 2;
  const targetCx = targetNode.x + targetNode.width / 2;
  const targetCy = targetNode.y + targetNode.height / 2;

  return {
    source: getClosestPointOnNodeBorder(sourceNode, targetCx, targetCy),
    target: getClosestPointOnNodeBorder(targetNode, sourceCx, sourceCy),
  };
}
