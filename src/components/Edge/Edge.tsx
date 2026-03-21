import React, { useCallback, useMemo } from 'react';
import type { EdgeData, EdgeMarkerConfig, Selection } from '../../store/types';
import type { CanvasNodeData } from '../CanvasNode/CanvasNode.types';
import { getConnectorPositions } from '../CanvasNode/CanvasNode';
import { getBezierPath, getSmoothStepPath, getStepPath, getStraightPath } from './edgePaths';
import './Edge.css';

export interface EdgeLayerProps {
  nodes: CanvasNodeData[];
  edges: EdgeData[];
  selection: Selection;
  onSelectEdge?: (id: string) => void;
  canvasWidth: number;
  canvasHeight: number;
}

function getAnchor(node: CanvasNodeData, connectorIndex: number) {
  const count = node.connectorCount ?? 1;
  const positions = getConnectorPositions(count, node.width, node.height, node.shape);
  const pos = positions[connectorIndex] ?? positions[0] ?? { x: node.width / 2, y: node.height / 2 };
  return { x: node.x + pos.x, y: node.y + pos.y };
}

function resolveMarker(
  marker: EdgeMarkerConfig | string | undefined,
): EdgeMarkerConfig | undefined {
  if (!marker) return undefined;
  if (typeof marker === 'string') return { type: marker as EdgeMarkerConfig['type'] };
  return marker;
}

function getMarkerId(_marker: EdgeMarkerConfig, edgeId: string, end: 'start' | 'end'): string {
  return `artichart-marker-${edgeId}-${end}`;
}

function getPathFn(type: EdgeData['type']) {
  switch (type) {
    case 'straight':
      return getStraightPath;
    case 'smoothstep':
      return getSmoothStepPath;
    case 'step':
      return getStepPath;
    default:
      return getBezierPath;
  }
}

interface MarkerDefProps {
  id: string;
  marker: EdgeMarkerConfig;
  selected?: boolean;
}

const MarkerDef: React.FC<MarkerDefProps> = ({ id, marker, selected }) => {
  const w = marker.width ?? 12;
  const h = marker.height ?? 12;
  const strokeW = marker.strokeWidth ?? 1;

  return (
    <marker
      id={id}
      markerWidth={w}
      markerHeight={h}
      refX={w}
      refY={h / 2}
      orient="auto-start-reverse"
      markerUnits="strokeWidth"
    >
      {marker.type === 'arrowclosed' ? (
        <polygon
          points={`0 0, ${w} ${h / 2}, 0 ${h}`}
          className={`artichart-edge__marker${selected ? ' artichart-edge__marker--selected' : ''}`}
          style={marker.color ? { fill: marker.color } : undefined}
        />
      ) : (
        <polyline
          points={`0 0, ${w} ${h / 2}, 0 ${h}`}
          fill="none"
          stroke={marker.color ?? (selected ? 'var(--artichart-edge-stroke-selected, #3b82f6)' : 'var(--artichart-edge-stroke, #b1b1b7)')}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </marker>
  );
};

interface SingleEdgeProps {
  edge: EdgeData;
  path: string;
  selected: boolean;
  onSelect?: (id: string) => void;
}

const SingleEdge: React.FC<SingleEdgeProps> = ({
  edge,
  path,
  selected,
  onSelect,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect?.(edge.id);
    },
    [edge.id, onSelect],
  );

  const markerStart = resolveMarker(edge.markerStart);
  const markerEnd = resolveMarker(edge.markerEnd);
  const startId = markerStart ? getMarkerId(markerStart, edge.id, 'start') : undefined;
  const endId = markerEnd ? getMarkerId(markerEnd, edge.id, 'end') : undefined;

  const pathClass = [
    'artichart-edge__path',
    selected && 'artichart-edge__path--selected',
    edge.animated && 'artichart-edge__path--animated',
    edge.className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g>
      {markerStart && <MarkerDef id={startId!} marker={markerStart} selected={selected} />}
      {markerEnd && <MarkerDef id={endId!} marker={markerEnd} selected={selected} />}
      <path
        d={path}
        className="artichart-edge__hit-area"
        onClick={handleClick}
      />
      <path
        d={path}
        className={pathClass}
        style={edge.style}
        markerStart={startId ? `url(#${startId})` : undefined}
        markerEnd={endId ? `url(#${endId})` : undefined}
      />
    </g>
  );
};

export const EdgeLayer: React.FC<EdgeLayerProps> = ({
  nodes,
  edges,
  selection,
  onSelectEdge,
  canvasWidth,
  canvasHeight,
}) => {
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const edgePaths = useMemo(() => {
    return edges
      .filter((e) => !e.hidden)
      .map((edge) => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        if (!sourceNode || !targetNode) return null;

        const start = getAnchor(sourceNode, edge.sourceConnector ?? 0);
        const end = getAnchor(targetNode, edge.targetConnector ?? 0);
        const pathFn = getPathFn(edge.type);
        const [path, labelX, labelY] = pathFn({
          sourceX: start.x,
          sourceY: start.y,
          targetX: end.x,
          targetY: end.y,
        });

        return { edge, path, labelX, labelY };
      })
      .filter(Boolean) as Array<{
        edge: EdgeData;
        path: string;
        labelX: number;
        labelY: number;
      }>;
  }, [edges, nodeMap]);

  return (
    <>
      <svg
        className="artichart-edge-layer"
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        aria-hidden="true"
        data-minimap-ignore="true"
      >
        <defs>
          {edgePaths.map(({ edge }) => {
            const ms = resolveMarker(edge.markerStart);
            const me = resolveMarker(edge.markerEnd);
            const sel =
              (selection?.kind === 'edge' && selection.id === edge.id) ?? false;
            return (
              <React.Fragment key={`defs-${edge.id}`}>
                {ms && (
                  <MarkerDef
                    id={getMarkerId(ms, edge.id, 'start')}
                    marker={ms}
                    selected={sel}
                  />
                )}
                {me && (
                  <MarkerDef
                    id={getMarkerId(me, edge.id, 'end')}
                    marker={me}
                    selected={sel}
                  />
                )}
              </React.Fragment>
            );
          })}
        </defs>
        {edgePaths.map(({ edge, path }) => {
          const selected =
            (selection?.kind === 'edge' && selection.id === edge.id) ?? false;
          return (
            <SingleEdge
              key={edge.id}
              edge={edge}
              path={path}
              selected={selected}
              onSelect={onSelectEdge}
            />
          );
        })}
      </svg>

      <div className="artichart-edge-label-renderer" data-minimap-ignore="true">
        {edgePaths.map(({ edge, labelX, labelY }) =>
          edge.label ? (
            <div
              key={`label-${edge.id}`}
              className="artichart-edge__label"
              style={{ left: labelX, top: labelY }}
            >
              {edge.label}
            </div>
          ) : null,
        )}
      </div>
    </>
  );
};
