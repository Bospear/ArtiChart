import React from 'react';
import type { ConnectionDraft, EdgeType } from '../../store/types';
import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';
import { getConnectorPositions } from '../CanvasNode/CanvasNode';
import { getBezierPath } from './edgePaths';

export interface ConnectionLineProps {
  draft: ConnectionDraft;
  nodes: CanvasNodeData[];
  type?: EdgeType;
  className?: string;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  draft,
  nodes,
  className,
}) => {
  const sourceNode = nodes.find((n) => n.id === draft.source);
  if (!sourceNode) return null;

  const count = sourceNode.connectorCount ?? 1;
  const positions = getConnectorPositions(
    count,
    sourceNode.width,
    sourceNode.height,
    sourceNode.shape,
  );
  const pos = positions[draft.sourceConnector] ?? positions[0];
  if (!pos) return null;

  const sourceX = sourceNode.x + pos.x;
  const sourceY = sourceNode.y + pos.y;

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX: draft.x,
    targetY: draft.y,
  });

  return (
    <path
      d={path}
      className={`artichart-edge__connection-line ${className ?? ''}`.trim()}
    />
  );
};
