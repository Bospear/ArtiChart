export interface PathParams {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  curvature?: number;
  borderRadius?: number;
}

export function getBezierPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  curvature = 0.25,
}: PathParams): [path: string, labelX: number, labelY: number] {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const controlOffset = Math.max(dist * curvature, 40);

  let c1x: number, c1y: number, c2x: number, c2y: number;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const dir = Math.sign(dx) || 1;
    c1x = sourceX + controlOffset * dir;
    c1y = sourceY;
    c2x = targetX - controlOffset * dir;
    c2y = targetY;
  } else {
    const dir = Math.sign(dy) || 1;
    c1x = sourceX;
    c1y = sourceY + controlOffset * dir;
    c2x = targetX;
    c2y = targetY - controlOffset * dir;
  }

  const path = `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  return [path, labelX, labelY];
}

export function getStraightPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: PathParams): [path: string, labelX: number, labelY: number] {
  const path = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  return [path, (sourceX + targetX) / 2, (sourceY + targetY) / 2];
}

export function getSmoothStepPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  borderRadius = 5,
}: PathParams): [path: string, labelX: number, labelY: number] {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const r = Math.min(borderRadius, Math.abs(dx) / 2, Math.abs(dy) / 2);

  let path: string;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const dirX = Math.sign(dx) || 1;
    const dirY = Math.sign(dy) || 1;

    if (Math.abs(dy) < r * 2) {
      path = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    } else {
      path =
        `M ${sourceX},${sourceY}` +
        ` L ${midX - r * dirX},${sourceY}` +
        ` Q ${midX},${sourceY} ${midX},${sourceY + r * dirY}` +
        ` L ${midX},${targetY - r * dirY}` +
        ` Q ${midX},${targetY} ${midX + r * dirX},${targetY}` +
        ` L ${targetX},${targetY}`;
    }
  } else {
    const dirX = Math.sign(dx) || 1;
    const dirY = Math.sign(dy) || 1;

    if (Math.abs(dx) < r * 2) {
      path = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    } else {
      path =
        `M ${sourceX},${sourceY}` +
        ` L ${sourceX},${midY - r * dirY}` +
        ` Q ${sourceX},${midY} ${sourceX + r * dirX},${midY}` +
        ` L ${targetX - r * dirX},${midY}` +
        ` Q ${targetX},${midY} ${targetX},${midY + r * dirY}` +
        ` L ${targetX},${targetY}`;
    }
  }

  return [path, midX, midY];
}

export function getStepPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: PathParams): [path: string, labelX: number, labelY: number] {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  let path: string;

  if (Math.abs(dx) >= Math.abs(dy)) {
    path = `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`;
  } else {
    path = `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
  }

  return [path, midX, midY];
}
